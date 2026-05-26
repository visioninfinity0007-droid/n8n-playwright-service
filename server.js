const express = require('express');
const { chromium } = require('playwright');

const app = express();
app.use(express.json({ limit: '10mb' }));

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

app.get('/', (req, res) => {
  res.json({
    status: 'ok',
    service: 'n8n-playwright-service',
    protectedEndpoints: ['POST /run']
  });
});

app.post('/run', requireApiKey, async (req, res) => {
  const { url } = req.body;

  if (!url) {
    return res.status(400).json({ error: 'Missing url' });
  }

  let browser;

  try {
    browser = await chromium.launch({
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    });

    const page = await browser.newPage();

    await page.goto(url, {
      waitUntil: 'domcontentloaded',
      timeout: 30000
    });

    const title = await page.title();
    const bodyText = await page.locator('body').innerText();

    res.json({
      success: true,
      title,
      text: bodyText.slice(0, 3000)
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  } finally {
    if (browser) {
      await browser.close();
    }
  }
});

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`Playwright service running on port ${PORT}`);
});
