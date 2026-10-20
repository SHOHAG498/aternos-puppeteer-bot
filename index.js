const express = require('express');
const puppeteer = require('puppeteer-extra');
const StealthPlugin = require('puppeteer-extra-plugin-stealth');

puppeteer.use(StealthPlugin());

const app = express();
const PORT = process.env.PORT || 10000;

// Render Environment Variables থেকে মান নেবে
const ATERNOS_USER = process.env.ATERNOS_USER;
const ATERNOS_PASS = process.env.ATERNOS_PASS;

async function startAternosServer() {
  console.log('[Puppeteer] Launching headless browser...');
  
  const browser = await puppeteer.launch({
    headless: "new",
    args: [
      '--no-sandbox',
      '--disable-setuid-sandbox',
      '--disable-dev-shm-usage',
      '--disable-accelerated-2d-canvas',
      '--disable-gpu'
    ]
  });

  try {
    const page = await browser.newPage();
    
    // Realistic User-Agent
    await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36');

    console.log('[Puppeteer] Navigating to Aternos Login...');
    await page.goto('https://aternos.org/go/', { waitUntil: 'networkidle2', timeout: 60000 });

    // Fill Login Credentials
    await page.waitForSelector('#user', { timeout: 20000 });
    await page.type('#user', ATERNOS_USER, { delay: 100 });
    await page.type('#password', ATERNOS_PASS, { delay: 100 });

    console.log('[Puppeteer] Submitting login...');
    await Promise.all([
      page.waitForNavigation({ waitUntil: 'networkidle2', timeout: 60000 }),
      page.click('#login')
    ]);

    console.log('[Puppeteer] Navigating to Server Page...');
    await page.goto('https://aternos.org/server/', { waitUntil: 'networkidle2', timeout: 60000 });

    // Click Start Button
    const startButtonSelector = '#start';
    await page.waitForSelector(startButtonSelector, { timeout: 20000 });
    
    console.log('[Puppeteer] Clicking START button...');
    await page.click(startButtonSelector);

    console.log('🚀 [SUCCESS] Aternos Server Start Triggered Successfully!');
    
    await new Promise(r => setTimeout(r, 10000));

  } catch (error) {
    console.error('❌ [Puppeteer Error]:', error.message);
  } finally {
    await browser.close();
    console.log('[Puppeteer] Browser closed.');
  }
}

// Web Server Endpoint
app.get('/', (req, res) => {
  res.send('Aternos Auto-Start Triggered! Check Render logs for progress.');
  startAternosServer();
});

app.listen(PORT, () => {
  console.log(`[HTTP] Auto-Start Proxy running on port ${PORT}`);
});
