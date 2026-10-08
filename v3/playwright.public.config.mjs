import base from './playwright.config.mjs';
export default {
 ...base,
 testMatch:'public-pin.spec.mjs',
 reporter:[['list'],['json',{outputFile:'v3/test-results/public-pin-browser.json'}]],
 outputDir:'./test-results/public-pin-browser',
 use:{...base.use,baseURL:process.env.TEST_BASE_URL||'http://127.0.0.1:8792'},
};
