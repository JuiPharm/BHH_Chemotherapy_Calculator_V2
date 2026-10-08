import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import { spawn } from 'node:child_process';

const PORT = 8123;
const ROOT = process.cwd();

const MIME_TYPES = {
  '.html': 'text/html',
  '.js': 'application/javascript',
  '.css': 'text/css',
  '.json': 'application/json',
  '.png': 'image/png',
  '.woff2': 'font/woff2',
};

// 1. Local HTTP server
const server = http.createServer((req, res) => {
  const urlPath = req.url.split('?')[0];
  let filePath = path.join(ROOT, urlPath === '/' ? 'index.html' : urlPath);

  // Mock API endpoints for local testing
  if (urlPath === '/api/regimens') {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end('[]');
    return;
  }
  const TEST_APPROVE_PIN = '8888';

  if (urlPath === '/api/verify-pin' && req.method === 'POST') {
    let body = '';
    req.on('data', chunk => body += chunk);
    req.on('end', () => {
      try {
        const { pin } = JSON.parse(body);
        if (pin === TEST_APPROVE_PIN) {
          res.writeHead(200, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ success: true, valid: true }));
        } else {
          res.writeHead(401, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ success: false, valid: false, message: 'รหัส PIN ไม่ถูกต้อง' }));
        }
      } catch {
        res.writeHead(400); res.end();
      }
    });
    return;
  }
  if (urlPath === '/api/publish' && req.method === 'POST') {
    let body = '';
    req.on('data', chunk => body += chunk);
    req.on('end', () => {
      try {
        const { pin } = JSON.parse(body);
        if (pin === TEST_APPROVE_PIN) {
          res.writeHead(200, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ success: true, message: 'Mock Cloudflare Publish Success' }));
        } else {
          res.writeHead(401, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ success: false, message: 'รหัส PIN สำหรับอนุมัติไม่ถูกต้อง' }));
        }
      } catch {
        res.writeHead(400); res.end();
      }
    });
    return;
  }

  if (!fs.existsSync(filePath) || fs.statSync(filePath).isDirectory()) {
    res.writeHead(404);
    res.end('Not found');
    return;
  }

  const ext = path.extname(filePath).toLowerCase();
  res.writeHead(200, { 'Content-Type': MIME_TYPES[ext] || 'application/octet-stream' });
  fs.createReadStream(filePath).pipe(res);
});

server.listen(PORT, async () => {
  console.log(`Local test server running at http://127.0.0.1:${PORT}`);
  try {
    await runBrowserTests();
    console.log('\n========================================');
    console.log('🎉 ALL BROWSER E2E TESTS PASSED 100%!');
    console.log('========================================\n');
    process.exit(0);
  } catch (err) {
    console.error('\n❌ BROWSER TEST FAILED:', err);
    process.exit(1);
  } finally {
    server.close();
  }
});

async function runBrowserTests() {
  const browserPath = fs.existsSync('C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe')
    ? 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe'
    : 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe';

  console.log(`Launching headless browser from: ${browserPath}`);
  const browserProc = spawn(browserPath, [
    '--headless=new',
    '--remote-debugging-port=9222',
    '--disable-gpu',
    '--no-first-run',
    '--no-default-browser-check',
    `http://127.0.0.1:${PORT}`
  ], { stdio: 'ignore' });

  // Wait for remote debugging endpoint to become ready
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
    browserProc.kill();
    throw new Error('Failed to connect to browser CDP port 9222');
  }

  console.log('Connected to Chrome DevTools Protocol via WebSocket.');
  const ws = new globalThis.WebSocket(wsUrl);
  await new Promise(r => ws.onopen = r);

  let msgId = 1;
  const pending = new Map();
  ws.onmessage = (event) => {
    const data = JSON.parse(event.data);
    if (data.id && pending.has(data.id)) {
      pending.get(data.id)(data);
      pending.delete(data.id);
    }
  };

  const send = (method, params = {}) => new Promise((resolve) => {
    const id = msgId++;
    pending.set(id, resolve);
    ws.send(JSON.stringify({ id, method, params }));
  });

  const evaluate = async (expression) => {
    const res = await send('Runtime.evaluate', {
      expression,
      returnByValue: true,
      awaitPromise: true
    });
    if (res.result?.exceptionDetails) {
      throw new Error(res.result.exceptionDetails.exception?.description || 'Evaluation error');
    }
    return res.result?.result?.value;
  };

  // Wait for application loading
  console.log('Checking app startup...');
  await new Promise(r => setTimeout(r, 2000));

  const appReady = await evaluate(`!document.getElementById('app-shell').classList.contains('hidden')`);
  console.log('App Shell loaded successfully:', appReady);
  if (!appReady) {
    const loadingHtml = await evaluate(`document.getElementById('app-loading')?.innerHTML`);
    console.log('app-loading content:', loadingHtml);
    throw new Error('App Shell failed to load: ' + loadingHtml);
  }

  // Test 1: Verify General User View & Badge Removal
  console.log('\n--- Test 1: General User View ---');
  const adminTabsHidden = await evaluate(`
    Array.from(document.querySelectorAll('.admin-tab')).every(el => el.classList.contains('hidden'))
  `);
  console.log('Admin tabs are hidden for general users:', adminTabsHidden);
  if (!adminTabsHidden) throw new Error('Admin tabs must be hidden for general users');

  const calcTabActive = await evaluate(`
    document.querySelector('.tabs button.active')?.dataset.tab === 'calculator'
  `);
  console.log('Calculator tab is active by default:', calcTabActive);
  if (!calcTabActive) throw new Error('Calculator tab must be active by default');

  const prodBadgeExists = await evaluate(`!!document.querySelector('.prod-badge')`);
  console.log('PRODUCTION v2.3.0 badge removed:', !prodBadgeExists);
  if (prodBadgeExists) throw new Error('PRODUCTION v2.3.0 badge must be removed');

  // Test 2: PIN Authentication Flow
  console.log('\n--- Test 2: PIN Authentication (Unlock Pharmacist Mode) ---');
  await evaluate(`document.getElementById('admin-pin-toggle-btn').click()`);
  await new Promise(r => setTimeout(r, 300));

  const pinPlaceholder = await evaluate(`document.getElementById('pin-auth-input').getAttribute('placeholder')`);
  console.log('PIN auth input placeholder is removed:', !pinPlaceholder);
  if (pinPlaceholder) throw new Error('pin-auth-input placeholder should be empty');

  // Enter wrong PIN first
  await evaluate(`
    document.getElementById('pin-auth-input').value = '99999';
    document.getElementById('pin-auth-form').dispatchEvent(new Event('submit', { cancelable: true }));
  `);
  await new Promise(r => setTimeout(r, 300));
  const errorVisible = await evaluate(`!document.getElementById('pin-auth-error').classList.contains('hidden')`);
  console.log('Wrong PIN shows error:', errorVisible);
  if (!errorVisible) throw new Error('Wrong PIN should display an error');

  // Verify 1234 is REJECTED (no longer valid default PIN)
  console.log('Testing that old default PIN 1234 is rejected...');
  await evaluate(`
    document.getElementById('pin-auth-input').value = '1234';
    document.getElementById('pin-auth-form').dispatchEvent(new Event('submit', { cancelable: true }));
  `);
  await new Promise(r => setTimeout(r, 300));
  const oldPinRejected = await evaluate(`!document.getElementById('pin-auth-error').classList.contains('hidden')`);
  console.log('Old default PIN 1234 rejected:', oldPinRejected);
  if (!oldPinRejected) throw new Error('Old default PIN 1234 should be rejected');

  // Enter new Cloudflare APPROVE_PIN (8888)
  console.log('Testing that new APPROVE_PIN (8888) unlocks...');
  await evaluate(`
    document.getElementById('pin-auth-input').value = '8888';
    document.getElementById('pin-auth-form').dispatchEvent(new Event('submit', { cancelable: true }));
  `);
  await new Promise(r => setTimeout(r, 300));

  const adminTabsVisible = await evaluate(`
    Array.from(document.querySelectorAll('.admin-tab')).every(el => !el.classList.contains('hidden'))
  `);
  console.log('Admin tabs unlocked and visible after new PIN 8888:', adminTabsVisible);
  if (!adminTabsVisible) throw new Error('Admin tabs should be visible after correct PIN');

  // Test 3: Regimen Library & Review / Publish Flow WITHOUT Guideline URL
  console.log('\n--- Test 3: Review & Publish Regimen Workflow (Without Guideline Link) ---');
  // Switch to Regimen Library tab
  await evaluate(`document.querySelector('[data-tab="library"]').click()`);
  await new Promise(r => setTimeout(r, 500));

  const libraryCount = await evaluate(`document.querySelectorAll('.regimen-card').length`);
  console.log(`Rendered regimen cards in Library: ${libraryCount}`);
  if (libraryCount < 10) throw new Error('Regimen library should render catalog cards');

  // Open review for BHH-CATALOG-039 (R-CVP)
  console.log('Opening Review / Publish dialog for R-CVP (BHH-CATALOG-039)...');
  await evaluate(`
    const item = catalog.find(x => x.master?.catalog_id === 'BHH-CATALOG-039');
    window.BHH_PUBLISH.open(item);
  `);
  await new Promise(r => setTimeout(r, 600));

  const dialogOpen = await evaluate(`document.getElementById('review-publish-dialog')?.open`);
  console.log('Review dialog opened:', dialogOpen);
  if (!dialogOpen) throw new Error('Review dialog did not open');

  // Clear guideline link and source to verify publishing works WITHOUT guideline validation
  console.log('Clearing guideline link (testing publish without guideline URL)...');
  await evaluate(`
    document.getElementById('review-publish-url').value = '';
    document.getElementById('review-publish-source').value = '';
    document.getElementById('review-publish-attest').checked = true;
    document.getElementById('review-publish-token').value = '8888';
  `);
  await new Promise(r => setTimeout(r, 300));

  // Submit Publish
  console.log('Submitting Approve & Publish without guideline URL...');
  await evaluate(`
    document.getElementById('review-publish-form').dispatchEvent(new Event('submit', { cancelable: true }));
  `);
  await new Promise(r => setTimeout(r, 1000));

  const publishMsg = await evaluate(`document.getElementById('review-publish-message').textContent`);
  console.log('Publish status message:', publishMsg);
  if (!publishMsg.includes('บันทึกสำเร็จ') && !publishMsg.includes('Approved + Published')) {
    throw new Error('Publish message did not indicate success: ' + publishMsg);
  }

  // Test 4: Live Regimen Search & Calculation Test
  console.log('\n--- Test 4: Live Regimen Search & Calculator Execution ---');
  await evaluate(`document.querySelector('[data-tab="calculator"]').click()`);
  await new Promise(r => setTimeout(r, 400));

  // Test live search by typing "AC"
  console.log('Testing live regimen search input: typing "AC"...');
  await evaluate(`
    const searchInput = document.getElementById('regimen-search');
    searchInput.value = 'AC';
    searchInput.dispatchEvent(new Event('input'));
  `);
  await new Promise(r => setTimeout(r, 400));

  const dropdownVisible = await evaluate(`!document.getElementById('regimen-search-dropdown').classList.contains('hidden')`);
  const matchCount = await evaluate(`document.querySelectorAll('#regimen-search-dropdown .search-match-item').length`);
  console.log(`Live search dropdown visible: ${dropdownVisible}, matches found: ${matchCount}`);
  if (!dropdownVisible || matchCount === 0) throw new Error('Search dropdown should display matches for "AC"');

  // Click on the first search result
  console.log('Clicking the first search result...');
  await evaluate(`
    document.querySelector('#regimen-search-dropdown .search-match-item').click();
  `);
  await new Promise(r => setTimeout(r, 400));

  const contextVisible = await evaluate(`!document.getElementById('regimen-context').classList.contains('hidden')`);
  const contextText = await evaluate(`document.getElementById('regimen-context').textContent`);
  console.log('Regimen context shown immediately:', contextVisible, '| Content snippet:', contextText.slice(0, 50));
  if (!contextVisible) throw new Error('Regimen context should be visible after selecting from search');
  await new Promise(r => setTimeout(r, 400));

  // Select Cancer Type: Hematologic Malignancy
  await evaluate(`
    document.getElementById('cancer-type-select').value = 'Hematologic Malignancy';
    document.getElementById('cancer-type-select').dispatchEvent(new Event('change'));
  `);
  await new Promise(r => setTimeout(r, 300));

  // Select R-CVP or R-CHOP
  const availableOptions = await evaluate(`document.getElementById('regimen-select').options.length`);
  console.log(`Available regimens in dropdown: ${availableOptions - 1}`);
  if (availableOptions <= 1) throw new Error('Regimen options should be populated');

  await evaluate(`
    document.getElementById('regimen-select').selectedIndex = 1;
    document.getElementById('regimen-select').dispatchEvent(new Event('change'));
  `);
  await new Promise(r => setTimeout(r, 300));

  const calcBtnDisabled = await evaluate(`document.getElementById('calculate-btn').disabled`);
  console.log('Calculate button enabled:', !calcBtnDisabled);
  if (calcBtnDisabled) throw new Error('Calculate button should be enabled for selected regimen');

  // Fill patient data
  await evaluate(`
    document.getElementById('cycle-input').value = '1';
    document.getElementById('age-input').value = '55';
    document.getElementById('sex-input').value = 'female';
    document.getElementById('height-input').value = '160';
    document.getElementById('weight-input').value = '60';
    document.getElementById('kidney-method').value = 'cockcroft_gault_legacy';
    document.getElementById('scr-input').value = '0.9';
    document.getElementById('kidney-method').dispatchEvent(new Event('change'));
  `);

  // Calculate with 10 mg Rounding (default)
  console.log('Calculating with Nearest 10 mg Rounding...');
  await evaluate(`
    document.querySelector('input[name="calc-rounding-choice"][value="BHH_NEAREST_10MG_DEFAULT"]').checked = true;
    document.getElementById('calc-form').dispatchEvent(new Event('submit', { cancelable: true }));
  `);
  await new Promise(r => setTimeout(r, 500));

  const hasOutput10mg = await evaluate(`document.querySelectorAll('#calc-output table tr').length`);
  console.log(`Calculated drug rows (10mg): ${hasOutput10mg - 1}`);
  if (hasOutput10mg <= 1) throw new Error('Calculation output table not generated');

  const hasPastelBg = await evaluate(`document.getElementById('calc-output').classList.contains('has-result')`);
  console.log('Calculation output has pastel theme background class:', hasPastelBg);
  if (!hasPastelBg) throw new Error('Calculation output should have has-result class for pastel styling');

  // Switch to "No operational rounding" Radio
  console.log('Switching to "No Rounding (Exact Dose)" Radio button...');
  await evaluate(`
    const noRoundRadio = document.querySelector('input[name="calc-rounding-choice"][value="NO_ROUND"]');
    noRoundRadio.checked = true;
    noRoundRadio.dispatchEvent(new Event('change'));
  `);
  await new Promise(r => setTimeout(r, 500));

  const exactDoseText = await evaluate(`
    document.querySelector('#calc-output table tbody tr td:nth-child(5)')?.textContent
  `);
  console.log('Exact Dose displayed without rounding:', exactDoseText);

  // Switch to "1 mg Rounding" Radio
  console.log('Switching to "1 mg Rounding" Radio button...');
  await evaluate(`
    const r1Radio = document.querySelector('input[name="calc-rounding-choice"][value="BHH_NEAREST_1MG_DEFAULT"]');
    r1Radio.checked = true;
    r1Radio.dispatchEvent(new Event('change'));
  `);
  await new Promise(r => setTimeout(r, 500));

  const r1DoseText = await evaluate(`
    document.querySelector('#calc-output table tbody tr td:nth-child(5)')?.textContent
  `);
  console.log('1 mg Rounded Dose displayed:', r1DoseText);

  ws.close();
  browserProc.kill();
}

