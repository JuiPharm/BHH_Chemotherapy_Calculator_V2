import { test, expect } from '@playwright/test';
const errors = [];
async function boot(page, who = 'calculator') {
  page.on('pageerror', (e) => errors.push(e.message));
  page.on('console', (m) => {
    if (m.type() === 'error') errors.push(m.text());
  });
  await page.goto('/');
  await expect(page.locator('#connection')).toContainText('Central protocols');
  if (who !== 'calculator') {
    await page.locator('#local-user').selectOption(`${who}@local.test`);
    await expect(page.locator('#account small')).toContainText(
      {
        editor: 'regimen_editor',
        reviewer: 'oncology_pharmacist',
        admin: 'clinical_admin',
      }[who],
    );
  }
}
async function selectTCH(page) {
  await page.locator('#cancer').selectOption('Breast');
  await page.locator('#regimen-search').fill('tc');
  await expect(page.locator('#matches')).toContainText('TCH');
  await page
    .locator('#matches [data-select="BHH-BREAST-TCH-EVIQ53:1"]')
    .click();
}
async function patient(page) {
  for (const [name, value] of Object.entries({
    ageYears: '50',
    heightCm: '180',
    weightKg: '90',
    cycle: '1',
  }))
    await page.locator(`[name=${name}]`).fill(value);
  await page.locator('[name=sex]').selectOption('male');
  await page.locator('#kidney-method').selectOption('measured_gfr');
  if (await page.locator('[name=kidneyValue]').isVisible())
    await page.locator('[name=kidneyValue]').fill('90');
}
test('Clinical UI, blank patient, cancer typeahead, rounding, pastel results and reload', async ({
  page,
}) => {
  errors.length = 0;
  await boot(page);
  for (const n of [
    'ageYears',
    'heightCm',
    'weightKg',
    'cycle',
    'serumCreatinineMgDl',
    'kidneyValue',
  ])
    await expect(page.locator(`[name=${n}]`)).toHaveValue('');
  await expect(page.locator('[name=sex]')).toHaveValue('');
  await expect(page.locator('#kidney-method')).toHaveValue('cockcroft_gault');
  await selectTCH(page);
  await page.locator('#selected summary').first().click();
  await expect(page.locator('#selected')).toContainText('Population: adult');
  await expect(page.locator('#selected')).toContainText(
    'Cycle interval: 21 days',
  );
  await expect(page.locator('#selected')).toContainText('Allowed:');
  await page.locator('#calculate').click();
  expect(
    await page
      .locator('[name=ageYears]')
      .evaluate((x) => x.validity.valueMissing),
  ).toBe(true);
  await expect(page.locator('#result')).toBeEmpty();
  await patient(page);
  await page.locator('#calculate').click();
  await expect(page.locator('#result')).toContainText('690 mg');
  await expect(page.locator('#result td.recommended')).toHaveCount(3);
  await expect(page.locator('#result')).toContainText('mL/min');
  const color = await page
    .locator('#result td.recommended')
    .first()
    .evaluate((x) => getComputedStyle(x).backgroundColor);
  expect(color).toBe('rgb(229, 244, 233)');
  await page.locator('#rounding').selectOption('NO_ROUND');
  await expect(page.locator('#result')).toBeEmpty();
  await page.locator('#calculate').click();
  await expect(page.locator('#result')).toContainText('690 mg');
  await page.screenshot({
    path: 'v3/test-results/calculator-desktop.png',
    fullPage: true,
  });
  await page.locator('[data-page=library]').click();
  await expect(page.locator('#library-count')).toContainText('142 sources');
  await page.locator('#library-search').fill('pembro');
  await expect(page.locator('#library-list')).toContainText('Pembrolizumab');
  await page.locator('#library-cancer').selectOption({ label: 'Breast' });
  await expect(page.locator('#library-list')).toContainText('No records');
  await page.reload();
  await expect(page.locator('[name=ageYears]')).toHaveValue('');
  await expect(page.locator('#connection')).toContainText('Central protocols');
  await page.locator('#cancer').selectOption('Hematologic');
  await page.locator('#regimen-search').fill('R-CHOP21');
  await page
    .locator('#matches [data-select="BHH-HEME-RCHOP21-EVIQ70:1"]')
    .click();
  await page.locator('#selected summary').first().click();
  await expect(page.locator('#selected')).toContainText('Hard maximum: 2 mg');
  await patient(page);
  await page.locator('#calculate').click();
  await expect(
    page
      .locator('#result tr')
      .filter({ hasText: 'Vincristine' })
      .locator('.recommended'),
  ).toHaveText('2 mg');
  expect(errors).toEqual([]);
});
test('Browser clone, builder, save, submit, independent approve, publish and second client refresh', async ({
  browser,
}) => {
  errors.length = 0;
  const editor = await browser.newContext(),
    reviewer = await browser.newContext(),
    admin = await browser.newContext(),
    consumer = await browser.newContext();
  const ep = await editor.newPage(),
    rp = await reviewer.newPage(),
    ap = await admin.newPage(),
    cp = await consumer.newPage();
  await boot(ep, 'editor');
  await boot(rp, 'reviewer');
  await boot(ap, 'admin');
  await boot(cp);
  const before = await cp.locator('#connection').textContent();
  await ep.locator('[data-page=library]').click();
  await ep.locator('#library-search').fill('TCH');
  await ep.locator('[data-clone="BHH-BREAST-TCH-EVIQ53:1"]').click();
  await expect(ep.locator('#modal-builder')).toContainText('Draft');
  const title = 'BHH browser approved TCH ' + Date.now();
  await ep.locator('#builder-form [data-field=name]').first().fill(title);
  await ep
    .locator('#draft-reason')
    .fill('Verified copied protocol for browser UAT');
  await ep.getByRole('button', { name: 'Save Draft', exact: true }).click();
  await expect(ep.locator('#notice')).toContainText('Draft saved');
  await ep
    .locator('#draft-reason')
    .fill('Ready for independent pharmacist review');
  await ep.locator('#draft-submit').click();
  await expect(ep.locator('#review-detail')).toContainText('Submitted');
  await rp.locator('[data-page=registry]').click();
  const row = rp.locator('#registry-list tr').filter({ hasText: title });
  await row.getByRole('button', { name: 'View', exact: true }).click();
  await rp
    .locator('#review-comment')
    .fill('Beginning independent review of source and doses');
  await rp
    .getByRole('button', { name: 'Start Clinical Review', exact: true })
    .click();
  await expect(rp.locator('#review-detail')).toContainText(
    'Clinical Review Required',
  );
  await rp
    .locator('#review-comment')
    .fill('Reviewed dose units, phases, hard limits and sources; approved UAT');
  await rp.getByRole('button', { name: 'Approve', exact: true }).click();
  await expect(rp.locator('#review-detail .badge').first()).toHaveText(
    'Approved',
  );
  await ap.locator('[data-page=registry]').click();
  await ap
    .locator('#registry-list tr')
    .filter({ hasText: title })
    .getByRole('button', { name: 'View', exact: true })
    .click();
  await ap
    .locator('#review-comment')
    .fill('Publish independently approved protocol for staging UAT');
  await ap.getByRole('button', { name: 'Publish', exact: true }).click();
  await expect(ap.locator('#review-detail .badge').first()).toHaveText(
    'Published',
  );
  await expect(cp.locator('#connection')).not.toHaveText(before, {
    timeout: 25000,
  });
  await cp.locator('#cancer').selectOption('Breast');
  await cp.locator('#regimen-search').fill(title);
  await expect(cp.locator('#matches')).toContainText(title);
  await cp.locator('#matches button').first().click();
  await patient(cp);
  await cp.locator('#calculate').click();
  await expect(cp.locator('#result')).toContainText('690 mg');
  await cp.reload();
  await expect(cp.locator('#connection')).toContainText('Central protocols');
  await cp.locator('[data-page=registry]').click();
  await expect(cp.locator('#registry-list')).toContainText(title);
  await ap.locator('#regimen-modal-close').click();
  await ap.locator('[data-page=audit]').click();
  await expect(ap.locator('#audit-list')).toContainText('publish');
  await expect(ap.locator('#audit-list')).toContainText('reviewer@local.test');
  await ep.screenshot({
    path: 'v3/test-results/registry-desktop.png',
    fullPage: true,
  });
  expect(errors).toEqual([]);
  for (const c of [editor, reviewer, admin, consumer]) await c.close();
});
test('Offline published snapshot calculation, writes disabled, reconnect and mobile layout', async ({
  browser,
}) => {
  const ctx = await browser.newContext(),
    page = await ctx.newPage();
  await boot(page, 'editor');
  await selectTCH(page);
  await patient(page);
  await page.evaluate(async () => {
    await navigator.serviceWorker.ready;
  });
  await page.waitForFunction(() => !!navigator.serviceWorker.controller);
  await ctx.setOffline(true);
  await expect(page.locator('#connection')).toContainText(
    'OFFLINE / CACHED PUBLISHED PROTOCOL',
  );
  await page.locator('#calculate').click();
  await expect(page.locator('#result')).toContainText('690 mg');
  await expect(page.locator('#result')).toContainText(
    'OFFLINE / CACHED PUBLISHED PROTOCOL',
  );
  await expect(page.locator('#new-draft')).toBeDisabled();
  await page.reload();
  await expect(page.locator('#connection')).toContainText('OFFLINE');
  await expect(page.locator('[name=ageYears]')).toHaveValue('');
  await selectTCH(page);
  await patient(page);
  await page.locator('#calculate').click();
  await expect(page.locator('#result')).toContainText('690 mg');
  await ctx.setOffline(false);
  await expect(page.locator('#connection')).toContainText('Central protocols');
  await expect(page.locator('#result')).toBeEmpty();
  await page.setViewportSize({ width: 390, height: 844 });
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  ).toBe(true);
  await page.screenshot({
    path: 'v3/test-results/calculator-mobile.png',
    fullPage: true,
  });
  await ctx.close();
});
