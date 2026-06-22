const express = require('express');
const { chromium } = require('playwright');

const app = express();
app.use(express.json({ limit: '10mb' }));

let sharedCdpBrowser = null;

function requireApiKey(req, res, next) {
  const configuredKey = process.env.API_KEY;

  if (!configuredKey) {
    return res.status(500).json({
      success: false,
      error: 'API_KEY environment variable is not configured'
    });
  }

  const providedKey = req.header('x-api-key');

  if (providedKey !== configuredKey) {
    return res.status(401).json({
      success: false,
      error: 'Unauthorized'
    });
  }

  next();
}

async function getBrowser() {
  const cdpUrl = process.env.LIVE_BROWSER_CDP_URL;

  if (cdpUrl) {
    if (!sharedCdpBrowser || !sharedCdpBrowser.isConnected()) {
      sharedCdpBrowser = await chromium.connectOverCDP(cdpUrl);
      sharedCdpBrowser.on('disconnected', () => {
        sharedCdpBrowser = null;
      });
    }

    return {
      browser: sharedCdpBrowser,
      shouldCloseBrowser: false,
      mode: 'live-cdp'
    };
  }

  const browser = await chromium.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });

  return {
    browser,
    shouldCloseBrowser: true,
    mode: 'headless'
  };
}

app.get('/', (req, res) => {
  res.json({
    status: 'ok',
    service: 'n8n-playwright-service',
    mode: process.env.LIVE_BROWSER_CDP_URL ? 'live-cdp' : 'headless',
    liveBrowserCdpUrlConfigured: Boolean(process.env.LIVE_BROWSER_CDP_URL),
    protectedEndpoints: ['POST /run']
  });
});

app.get('/cdp-status', requireApiKey, async (req, res) => {
  const cdpUrl = process.env.LIVE_BROWSER_CDP_URL;

  if (!cdpUrl) {
    return res.json({
      success: true,
      mode: 'headless',
      liveBrowserCdpUrlConfigured: false
    });
  }

  try {
    const response = await fetch(`${cdpUrl.replace(/\/$/, '')}/json/version`);
    const data = await response.json();

    res.json({
      success: true,
      mode: 'live-cdp',
      liveBrowserCdpUrlConfigured: true,
      browser: data.Browser,
      webSocketDebuggerUrl: data.webSocketDebuggerUrl
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      mode: 'live-cdp',
      error: error.message
    });
  }
});

app.post('/run', requireApiKey, async (req, res) => {
  const { url } = req.body;

  if (!url) {
    return res.status(400).json({ error: 'Missing url' });
  }

  let browser;
  let shouldCloseBrowser = false;
  let page;
  let mode = 'unknown';

  try {
    const browserSession = await getBrowser();
    browser = browserSession.browser;
    shouldCloseBrowser = browserSession.shouldCloseBrowser;
    mode = browserSession.mode;

    const context = mode === 'live-cdp'
      ? browser.contexts()[0] || await browser.newContext()
      : await browser.newContext();

    page = await context.newPage();

    await page.goto(url, {
      waitUntil: 'domcontentloaded',
      timeout: 30000
    });

    const title = await page.title();
    const bodyText = await page.locator('body').innerText();

    res.json({
      success: true,
      mode,
      title,
      text: bodyText.slice(0, 3000)
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      mode,
      error: error.message
    });
  } finally {
    if (page) {
      await page.close().catch(() => {});
    }

    if (shouldCloseBrowser && browser) {
      await browser.close().catch(() => {});
    }
  }
});

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`Playwright service running on port ${PORT}`);
});
