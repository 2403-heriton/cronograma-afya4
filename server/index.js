const express = require('express');
const puppeteer = require('puppeteer');
const cors = require('cors');
const bodyParser = require('body-parser');

const app = express();
const PORT = process.env.PORT || 3000;

// Increase payload limit for large HTML strings
app.use(bodyParser.json({ limit: '50mb' }));
app.use(cors());

app.post('/generate-pdf', async (req, res) => {
  const { html, orientation = 'landscape' } = req.body;

  if (!html) {
    return res.status(400).send('HTML content is required');
  }

  let browser;
  try {
    // Launch Puppeteer. 
    // 'no-sandbox' is often required for containerized environments (Render/Railway)
    browser = await puppeteer.launch({
      args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-dev-shm-usage',
        '--disable-gpu'
      ],
      headless: 'new'
    });

    const page = await browser.newPage();

    // Set content and wait for network to be idle (images/fonts loaded)
    await page.setContent(html, {
      waitUntil: ['load', 'networkidle0'],
      timeout: 60000 // 60 seconds timeout
    });

    // Generate PDF
    const pdfBuffer = await page.pdf({
      format: 'A4',
      landscape: orientation === 'landscape',
      printBackground: true, // Essential for Tailwind background colors
      margin: {
        top: '0px',
        right: '0px',
        bottom: '0px',
        left: '0px'
      },
      preferCSSPageSize: true
    });

    await browser.close();

    // Send the buffer back to client
    res.set({
      'Content-Type': 'application/pdf',
      'Content-Length': pdfBuffer.length,
    });
    res.send(pdfBuffer);

  } catch (error) {
    console.error('PDF Generation Error:', error);
    if (browser) await browser.close();
    res.status(500).send('Error generating PDF: ' + error.message);
  }
});

app.listen(PORT, () => {
  console.log(`PDF Generator Service running on port ${PORT}`);
});