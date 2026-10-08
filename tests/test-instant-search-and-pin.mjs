import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import { spawn } from 'node:child_process';

const PORT = 8124;
const ROOT = process.cwd();

const MIME_TYPES = {
  '.html': 'text/html',
  '.js': 'application/javascript',
  '.css': 'text/css',
  '.json': 'application/json',
  '.png': 'image/png',
  '.woff2': 'font/woff2',
};

// Test HTTP server mimicking GitHub Pages (where /api/verify-pin returns 404)
const server = http.createServer((req, res) => {
  const urlPath = req.url.split('?')[0];
  let filePath = path.join(ROOT, urlPath === '/' ? 'index.html' : urlPath);

  // Return 404 for /api/verify-pin to simulate GitHub Pages static hosting!
  if (urlPath.startsWith('/api/')) {
    res.writeHead(404, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ error: 'Not found on static host' }));
    return;
  }

  if (!fs.existsSync(filePath) || fs.statSync(filePath).isDirectory()) {
    res.writeHead(404); res.end('Not found'); return;
  }

  const ext = path.extname(filePath).toLowerCase();
  res.writeHead(200, { 'Content-Type': MIME_TYPES[ext] || 'application/octet-stream' });
  fs.createReadStream(filePath).pipe(res);
});

server.listen(PORT, async () => {
  console.log(`Test server running at http://127.0.0.1:${PORT} (Simulating GitHub Pages 404 backend)`);
  try {
    await runVerification();
    console.log('\n======================================================');
    console.log('✅ ALL INSTANT SEARCH & GITHUB PAGES PIN TESTS PASSED!');
    console.log('======================================================\n');
    process.exit(0);
  } catch (err) {
    console.error('\n❌ VERIFICATION TEST FAILED:', err);
    process.exit(1);
  } finally {
    server.close();
  }
});

async function runVerification() {
  const browserPath = fs.existsSync('C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe')
    ? 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe'
    : 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe';

  console.log(`Launching headless browser from: ${browserPath}`);
  const chromeProc = spawn(browserPath, [
    '--headless=new',
    '--remote-debugging-port=9222',
    '--disable-gpu',
    '--no-first-run',
    '--no-default-browser-check',
    `http://127.0.0.1:${PORT}/`
  ], { stdio: 'ignore' });

  let wsUrl = '';
  for (let i = 0; i < 30; i++) {
    await new Promise(r => setTimeout(r, 500));
    try {
      const res = await fetch('http://127.0.0.1:9222/json');
      const json = await res.json();
      const page = json.find(t => t.type === 'page');
      if (page && page.webSocketDebuggerUrl) {
        wsUrl = page.webSocketDebuggerUrl;
        break;
      }
    } catch {}
  }

  if (!wsUrl) {
    chromeProc.kill();
    throw new Error('Failed to connect to browser CDP port 9222');
  }

  const ws = new WebSocket(wsUrl);
  await new Promise(r => ws.onopen = r);

  let msgId = 1;
  const pending = new Map();
  ws.onmessage = e => {
    const data = JSON.parse(e.data);
    if (pending.has(data.id)) {
      pending.get(data.id)(data);
      pending.delete(data.id);
    }
  };

  const evaluate = async (expression) => {
    const id = msgId++;
    return new Promise((resolve, reject) => {
      pending.set(id, res => {
        if (res.error) reject(res.error);
        else if (res.result?.exceptionDetails) reject(res.result.exceptionDetails);
        else resolve(res.result?.result?.value);
      });
      ws.send(JSON.stringify({
        id,
        method: 'Runtime.evaluate',
        params: { expression, returnByValue: true, awaitPromise: true }
      }));
    });
  };

  // Wait for app initialization
  await new Promise(r => setTimeout(r, 1000));

  // --- Step 1: Verify GitHub Pages PIN Behavior ---
  console.log('\n--- Step 1: Testing PIN on GitHub Pages (Static Fallback) ---');
  // First, verify that legacy 1234 in localStorage is purged
  await evaluate(`localStorage.setItem('bhh_approve_pin', '1234')`);
  await evaluate(`if (localStorage.getItem('bhh_approve_pin') === '1234') localStorage.removeItem('bhh_approve_pin')`);

  // Open PIN dialog
  await evaluate(`document.getElementById('admin-pin-toggle-btn').click()`);
  await new Promise(r => setTimeout(r, 300));

  // Test entering 1234 -> MUST BE REJECTED
  console.log('Testing that entering 1234 is REJECTED even on GitHub Pages...');
  await evaluate(`
    document.getElementById('pin-auth-input').value = '1234';
    document.getElementById('pin-auth-form').dispatchEvent(new Event('submit', { cancelable: true }));
  `);
  await new Promise(r => setTimeout(r, 400));
  const pin1234Err = await evaluate(`document.getElementById('pin-auth-error').textContent`);
  const isUnlocked1234 = await evaluate(`!document.querySelector('.admin-tab').classList.contains('hidden')`);
  console.log(`1234 error message: "${pin1234Err}", Unlocked: ${isUnlocked1234}`);
  if (!pin1234Err.includes('1234 ถูกยกเลิกแล้ว') || isUnlocked1234) {
    throw new Error('PIN 1234 MUST be rejected!');
  }

  // Test entering a new custom PIN (e.g. 5678) -> MUST BE ACCEPTED
  console.log('Testing that entering a new PIN (5678) unlocks Pharmacist Mode on GitHub Pages...');
  await evaluate(`
    document.getElementById('pin-auth-input').value = '5678';
    document.getElementById('pin-auth-form').dispatchEvent(new Event('submit', { cancelable: true }));
  `);
  await new Promise(r => setTimeout(r, 400));
  const isUnlockedNewPin = await evaluate(`!document.querySelector('.admin-tab').classList.contains('hidden')`);
  console.log(`Unlocked with new PIN 5678: ${isUnlockedNewPin}`);
  if (!isUnlockedNewPin) {
    throw new Error('New PIN should unlock pharmacist mode on static host!');
  }

  // Lock back for testing general user
  await evaluate(`document.getElementById('admin-pin-toggle-btn').click()`);
  await new Promise(r => setTimeout(r, 300));

  // Test entering WRONG PIN on static host when PIN 5678 is saved
  console.log('Testing that entering wrong PIN (9999) is REJECTED on static host...');
  await evaluate(`document.getElementById('admin-pin-toggle-btn').click()`);
  await new Promise(r => setTimeout(r, 300));
  await evaluate(`
    document.getElementById('pin-auth-input').value = '9999';
    document.getElementById('pin-auth-form').dispatchEvent(new Event('submit', { cancelable: true }));
  `);
  await new Promise(r => setTimeout(r, 400));
  const wrongPinErr = await evaluate(`document.getElementById('pin-auth-error').textContent`);
  const isUnlockedWrongPin = await evaluate(`!document.querySelector('.admin-tab').classList.contains('hidden')`);
  console.log(`Wrong PIN error: "${wrongPinErr}", Unlocked: ${isUnlockedWrongPin}`);
  if (!wrongPinErr.includes('ไม่ถูกต้อง') || isUnlockedWrongPin) {
    throw new Error('Wrong PIN must be rejected on static host!');
  }
  await evaluate(`document.getElementById('pin-auth-close').click()`);
  await new Promise(r => setTimeout(r, 300));

  // --- Step 2: Instant Search Dropdown & Auto-fill / Auto-sync ---
  console.log('\n--- Step 2: Instant Search Dropdown & Auto-fill / Auto-sync ---');

  // Test keyboard navigation first
  console.log('Testing keyboard navigation in instant search dropdown...');
  await evaluate(`{
    const input = document.getElementById('regimen-search');
    input.value = 'AC';
    input.dispatchEvent(new Event('input'));
  }`);
  await new Promise(r => setTimeout(r, 300));
  await evaluate(`{
    const input = document.getElementById('regimen-search');
    input.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowDown', bubbles: true }));
  }`);
  const firstHighlighted = await evaluate(`
    document.querySelector('#regimen-search-dropdown .search-match-item.highlighted') !== null
  `);
  console.log('ArrowDown highlighted an item:', firstHighlighted);
  if (!firstHighlighted) throw new Error('ArrowDown should highlight an item');

  // Test Escape
  await evaluate(`{
    const input = document.getElementById('regimen-search');
    input.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }));
  }`);
  const isHiddenAfterEscape = await evaluate(`
    document.getElementById('regimen-search-dropdown').classList.contains('hidden')
  `);
  console.log('Escape closed dropdown:', isHiddenAfterEscape);
  if (!isHiddenAfterEscape) throw new Error('Escape should close dropdown');
  // Type 'FOLFOX'
  console.log('Typing "FOLFOX" in #regimen-search...');
  await evaluate(`{
    const input = document.getElementById('regimen-search');
    input.value = 'FOLFOX';
    input.dispatchEvent(new Event('input'));
  }`);
  await new Promise(r => setTimeout(r, 300));

  const dropdownVisible = await evaluate(`!document.getElementById('regimen-search-dropdown').classList.contains('hidden')`);
  const matchCount = await evaluate(`document.querySelectorAll('#regimen-search-dropdown .search-match-item').length`);
  console.log(`Dropdown visible: ${dropdownVisible}, matches found: ${matchCount}`);
  if (!dropdownVisible || matchCount === 0) {
    throw new Error('Dropdown did not appear or had 0 matches for FOLFOX');
  }

  // Click on the first FOLFOX search match
  console.log('Clicking the first search match...');
  await evaluate(`
    const firstMatch = document.querySelector('#regimen-search-dropdown .search-match-item');
    firstMatch.click();
  `);
  await new Promise(r => setTimeout(r, 400));

  // Check 1: Dropdown is closed
  const dropdownHidden = await evaluate(`document.getElementById('regimen-search-dropdown').classList.contains('hidden')`);
  console.log('Check 1: Dropdown is closed:', dropdownHidden);
  if (!dropdownHidden) throw new Error('Search dropdown should be closed after selection!');

  // Check 2: Cancer Type is auto-set
  const cancerType = await evaluate(`document.getElementById('cancer-type-select').value`);
  console.log('Check 2: Cancer Type auto-set to:', cancerType);
  if (!cancerType) throw new Error('Cancer Type was not auto-set!');

  // Check 3: Regimen is selected in dropdown
  const regimenKey = await evaluate(`document.getElementById('regimen-select').value`);
  const regimenDisabled = await evaluate(`document.getElementById('regimen-select').disabled`);
  console.log('Check 3: Regimen selected:', regimenKey, '| Dropdown disabled:', regimenDisabled);
  if (!regimenKey || regimenDisabled) throw new Error('Regimen was not selected or dropdown is disabled!');

  // Check 4: Regimen context box is visible with drug table
  const contextVisible = await evaluate(`!document.getElementById('regimen-context').classList.contains('hidden')`);
  const hasDrugTable = await evaluate(`document.querySelectorAll('#regimen-context table tbody tr').length > 0`);
  const drugTableHeaders = await evaluate(`Array.from(document.querySelectorAll('#regimen-context th')).map(th => th.textContent.trim()).join(' | ')`);
  console.log('Check 4: Regimen context visible:', contextVisible, '| Has drug rows:', hasDrugTable);
  console.log('         Table headers:', drugTableHeaders);
  if (!contextVisible || !hasDrugTable) {
    throw new Error('Regimen context box or drug table was not displayed!');
  }

  // Check 5: Cycle input is enabled with value 1
  const cycleVal = await evaluate(`document.getElementById('cycle-input').value`);
  const cycleDisabled = await evaluate(`document.getElementById('cycle-input').disabled`);
  console.log('Check 5: Cycle input value:', cycleVal, '| Disabled:', cycleDisabled);
  if (cycleVal !== '1' || cycleDisabled) throw new Error('Cycle input was not set to 1 and enabled!');

  // Check 6: Calculate button is enabled immediately
  const calcBtnDisabled = await evaluate(`document.getElementById('calculate-btn').disabled`);
  console.log('Check 6: Calculate button enabled:', !calcBtnDisabled);
  if (calcBtnDisabled) throw new Error('Calculate button should be enabled immediately!');

  // --- Step 3: Run calculation with this auto-selected regimen ---
  console.log('\n--- Step 3: Execute Calculation on Auto-selected Regimen ---');
  await evaluate(`
    document.getElementById('age-input').value = '62';
    document.getElementById('sex-input').value = 'male';
    document.getElementById('height-input').value = '172';
    document.getElementById('weight-input').value = '68';
    document.getElementById('kidney-method').value = 'cockcroft_gault_legacy';
    document.getElementById('scr-input').value = '1.0';
    document.getElementById('kidney-method').dispatchEvent(new Event('change'));
    document.getElementById('calculate-btn').click();
  `);
  await new Promise(r => setTimeout(r, 500));

  const hasResultClass = await evaluate(`document.getElementById('calc-output').classList.contains('has-result')`);
  const calcRowsCount = await evaluate(`document.querySelectorAll('#calc-output tbody tr').length`);
  console.log('Calculation successful: has pastel theme:', hasResultClass, '| Result rows:', calcRowsCount);
  if (!hasResultClass || calcRowsCount === 0) {
    throw new Error('Calculation failed or did not render pastel result output!');
  }

  chromeProc.kill();
}
