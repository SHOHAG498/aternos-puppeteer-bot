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
    
    // Real desktop User Agent
    await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36');

    console.log('[Puppeteer] Opening Direct Aternos Login Page...');
    await page.goto('https://aternos.org/go/', { waitUntil: 'domcontentloaded', timeout: 90000 });

    // Cloudflare/Popups পার হতে ৮ সেকেন্ড বিরতি
    await new Promise(r => setTimeout(r, 8000));

    console.log('[Puppeteer] Looking for Login input fields...');

    // Aternos Form Selection (Multiple fallback selectors)
    const userInput = await page.waitForSelector('#user, .user, input[name="user"], input[type="text"]', { timeout: 40000 });
    const passInput = await page.waitForSelector('#password, .password, input[name="password"], input[type="password"]', { timeout: 40000 });

    if (userInput && passInput) {
      console.log('[Puppeteer] Entering Credentials...');
      await userInput.type(ATERNOS_USER, { delay: 100 });
      await passInput.type(ATERNOS_PASS, { delay: 100 });

      console.log('[Puppeteer] Submitting Login...');
      const loginBtn = await page.$('#login, .btn-login, button[type="submit"]');
      if (loginBtn) {
        await loginBtn.click();
      } else {
        await page.keyboard.press('Enter');
      }

      console.log('[Puppeteer] Waiting after login submission...');
      await new Promise(r => setTimeout(r, 12000));
    }

    console.log('[Puppeteer] Navigating to Server Dashboard...');
    await page.goto('https://aternos.org/server/', { waitUntil: 'domcontentloaded', timeout: 90000 });
    await new Promise(r => setTimeout(r, 6000));

    // Clicking Start Button
    console.log('[Puppeteer] Finding START button...');
    const startBtn = await page.waitForSelector('#start, .btn-start', { timeout: 30000 });
    if (startBtn) {
      console.log('[Puppeteer] Clicking START button...');
      await startBtn.click();
      await new Promise(r => setTimeout(r, 5000));

      // Handling Accept/Confirm popup if appears
      try {
        const confirmBtn = await page.$('#confirm, .btn-confirm');
        if (confirmBtn) {
          await confirmBtn.click();
          console.log('[Puppeteer] Confirmed server start popup!');
        }
      } catch (e) {
        // Ignored if no popup
      }

      console.log('🚀 [SUCCESS] Aternos Server Started Successfully!');
    }

  } catch (error) {
    console.error('❌ [Puppeteer Error]:', error.message);
  } finally {
    if (browser) await browser.close();
    isRunning = false;
    console.log('[Puppeteer] Browser closed & ready.');
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
