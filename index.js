const express = require('express');
const puppeteer = require('puppeteer-extra');
const StealthPlugin = require('puppeteer-extra-plugin-stealth');

puppeteer.use(StealthPlugin());

const app = express();
const PORT = process.env.PORT || 10000;

const ATERNOS_USER = process.env.ATERNOS_USER;
const ATERNOS_PASS = process.env.ATERNOS_PASS;

let isRunning = false;

async function startAternosServer() {
  if (isRunning) {
    console.log('[Puppeteer] A process is already running. Skipping...');
    return;
  }

  isRunning = true;
  console.log('[Puppeteer] Starting Headless Chrome...');
  
  let browser;
  try {
    browser = await puppeteer.launch({
      headless: "new",
      args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-dev-shm-usage',
        '--disable-accelerated-2d-canvas',
        '--disable-gpu',
        '--window-size=1920,1080'
      ]
    });

    const page = await browser.newPage();
    await page.setViewport({ width: 1920, height: 1080 });
    await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36');

    console.log('[Puppeteer] Opening Aternos Login Page...');
    await page.goto('https://aternos.org/go/', { waitUntil: 'networkidle2', timeout: 90000 });

    // Cloudflare বা পপ-আপ পার হওয়ার জন্য ৫ সেকেন্ড ওয়েট
    await new Promise(r => setTimeout(r, 5000));

    console.log('[Puppeteer] Entering Credentials...');
    await page.waitForSelector('.user', { timeout: 30000 });
    await page.type('.user', ATERNOS_USER, { delay: 120 });
    await page.type('.password', ATERNOS_PASS, { delay: 120 });

    console.log('[Puppeteer] Clicking Login Button...');
    await page.click('.btn-login');

    // লগইন সম্পন্ন হওয়ার জন্য ১০ সেকেন্ড ওয়েট
    await new Promise(r => setTimeout(r, 10000));

    console.log('[Puppeteer] Going to Server Page...');
    await page.goto('https://aternos.org/server/', { waitUntil: 'networkidle2', timeout: 90000 });

    await new Promise(r => setTimeout(r, 5000));

    // Start বাটন সিলেক্টর
    const startBtn = '#start';
    await page.waitForSelector(startBtn, { timeout: 30000 });
    
    console.log('[Puppeteer] Clicking START button...');
    await page.click(startBtn);

    // যদি কোনো কনফার্মেশন বাটন আসে (যেমন Confirm/Accept)
    try {
      const confirmBtn = '#confirm';
      await page.waitForSelector(confirmBtn, { timeout: 5000 });
      await page.click(confirmBtn);
      console.log('[Puppeteer] Clicked Confirm Button!');
    } catch (e) {
      // কনফার্ম বাটন না আসলে সমস্যা নেই
    }

    console.log('🚀 [SUCCESS] Aternos Server Started Successfully!');

  } catch (error) {
    console.error('❌ [Puppeteer Error]:', error.message);
  } finally {
    if (browser) await browser.close();
    isRunning = false;
    console.log('[Puppeteer] Browser Closed.');
  }
}

app.get('/', (req, res) => {
  res.status(200).send('Trigger received! Processing in background...');
  setImmediate(() => {
    startAternosServer();
  });
});

app.listen(PORT, () => {
  console.log(`[HTTP] Server running on port ${PORT}`);
});
