import base from './playwright.config.mjs';
export default {
 ...base,
 testMatch:'staging-live.spec.mjs',
 reporter: [['list'], ['json',{outputFile:'v3/test-results/staging-browser.json'}]],
 outputDir:'./test-results/staging-browser',
 use:{...base.use,baseURL:process.env.TEST_BASE_URL||'http://127.0.0.1:8792'},
};
