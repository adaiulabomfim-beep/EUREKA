const puppeteer = require('puppeteer');

(async () => {
  const browser = await puppeteer.launch();
  const page = await browser.newPage();
  
  page.on('console', msg => console.log('PAGE LOG:', msg.text()));
  page.on('pageerror', error => console.log('PAGE ERROR:', error.message));
  page.on('requestfailed', request => console.log('REQUEST FAILED:', request.url(), request.failure().errorText));

  await page.goto('http://localhost:3000/#/comportas', { waitUntil: 'networkidle2' });
  
  // Wait a bit just in case
  await new Promise(r => setTimeout(r, 2000));
  
  // Click the 3D ON button
  try {
    const btn = await page.$('button[title="Mudar para 3D"]');
    if (btn) {
      await btn.click();
      await new Promise(r => setTimeout(r, 2000));
    }
  } catch (e) {
    console.log("Could not click 3D button", e);
  }

  await browser.close();
})();
