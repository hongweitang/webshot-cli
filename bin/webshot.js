#!/usr/bin/env node

const puppeteer = require('puppeteer');
const { program } = require('commander');
const fs = require('fs');
const os = require('os');
const path = require('path');

const homeDir = os.homedir();
const desktopDir = path.join(homeDir, 'Desktop');
const outputDir = path.join(desktopDir, 'Website_Screenshots');

// Ensure screenshots directory exists
if (!fs.existsSync(outputDir)) {
  fs.mkdirSync(outputDir, { recursive: true });
}

const aspectRatios = {
  '16:10': { width: 1920, height: 1200 }, // default
  '16:9': { width: 1920, height: 1080 },
  '4:3': { width: 1440, height: 1080 },
  '1:1': { width: 1080, height: 1080 },
  '21:9': { width: 2560, height: 1080 },
  mobile: { width: 375, height: 667 },
  tablet: { width: 768, height: 1024 },
  desktop: { width: 1920, height: 1080 },
};

/**
 * Generate a timestamp for filenames
 * @returns {string} Formatted timestamp
 */
function getTimestamp() {
  const now = new Date();
  return now.toISOString().slice(0, 19).replace(/[:T]/g, '-');
}

/**
 * Validate and normalize URL
 * @param {string} url - Input URL
 * @returns {string} Normalized URL
 */
function normalizeUrl(url) {
  if (!url.startsWith('http://') && !url.startsWith('https://')) {
    return `https://${url}`;
  }
  return url;
}

/**
 * Get a safe filename from URL
 * @param {string} url - Website URL
 * @param {number} scale - Scale factor for retina
 * @returns {string} Safe filename
 */
function getSafeFilename(url, scale = 1) {
  try {
    const urlObj = new URL(url);
    const domain = urlObj.hostname.replace(/^www\./, '');
    const timestamp = getTimestamp();
    const scaleStr = scale > 1 ? `_${scale}x` : '';
    return `${domain}_${timestamp}${scaleStr}.png`;
  } catch (error) {
    const timestamp = getTimestamp();
    const scaleStr = scale > 1 ? `_${scale}x` : '';
    return `screenshot_${timestamp}${scaleStr}.png`;
  }
}

/**
 * Take a screenshot of a website
 * @param {Object} options - Screenshot options
 */
async function screenshotWebsite({ url, width, height, delay, output, headless, quality, format, scale }) {
  const browser = await puppeteer.launch({
    headless,
    args: ['--no-sandbox', '--disable-setuid-sandbox'], // Better compatibility
  });

  try {
    const page = await browser.newPage();

    // Set viewport with retina scaling
    await page.setViewport({
      width: parseInt(width),
      height: parseInt(height),
      deviceScaleFactor: scale,
    });

    // Set user agent for better compatibility
    await page.setUserAgent(
      'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
    );

    console.log(`Taking screenshot of: ${url}`);
    console.log(`📐 Viewport: ${width}x${height} ${scale > 1 ? `(${scale}x retina)` : ''}`);
    console.log(`Delay: ${delay}ms`);

    // Navigate to the page
    await page.goto(url, {
      waitUntil: 'networkidle2',
      timeout: 30000,
    });

    // Wait for specified delay
    if (delay > 0) {
      await new Promise((resolve) => setTimeout(resolve, delay));
    }

    // Take screenshot
    const screenshotOptions = {
      path: output,
      fullPage: false,
    };

    if (format === 'jpeg') {
      screenshotOptions.type = 'jpeg';
      screenshotOptions.quality = quality;
    }

    await page.screenshot(screenshotOptions);

    // Get file size for confirmation
    const stats = fs.statSync(output);
    const fileSizeKB = (stats.size / 1024).toFixed(1);

    console.log(`Screenshot saved to: ${output}`);
    console.log(`File size: ${fileSizeKB} KB`);
  } catch (error) {
    console.error(`Error taking screenshot: ${error.message}`);
    throw error;
  } finally {
    await browser.close();
  }
}

// Error handling for unhandled rejections
process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection at:', promise, 'reason:', reason);
  process.exit(1);
});

program
  .name('webshot')
  .description('Take a screenshot of a website with delay and custom size')
  .version('1.0.0')
  .argument('<url>', 'Website URL to screenshot')
  .option('-w, --width <number>', 'Viewport width in pixels')
  .option('-h, --height <number>', 'Viewport height in pixels')
  .option('-r, --ratio <preset>', `Aspect ratio preset (${Object.keys(aspectRatios).join(', ')})`, '16:10')
  .option('-d, --delay <ms>', 'Delay before screenshot in milliseconds', '3000')
  .option('-o, --output <file>', 'Output file path (auto-generated if not specified)')
  .option('-f, --format <type>', 'Image format (png, jpeg)', 'png')
  .option('-q, --quality <number>', 'JPEG quality (1-100, only for JPEG)', '90')
  .option('-s, --scale <number>', 'Scale factor for retina screenshots (1, 2, 3)', '1')
  .option('--headless', 'Run in headless mode (default)', true)
  .option('--no-headless', 'Run with visible browser (for debugging)')
  .option('--full-page', 'Take full page screenshot')
  .action(async (url, options) => {
    try {
      // Normalize URL
      const normalizedUrl = normalizeUrl(url);

      // Determine dimensions
      let width = options.width;
      let height = options.height;

      if (!width || !height) {
        const preset = aspectRatios[options.ratio];
        if (!preset) {
          console.error(`Invalid ratio. Available: ${Object.keys(aspectRatios).join(', ')}`);
          process.exit(1);
        }
        width = preset.width;
        height = preset.height;
      }

      // Determine output path
      let output;
      if (options.output) {
        output = path.isAbsolute(options.output) ? options.output : path.join(outputDir, options.output);
      } else {
        const scale = parseInt(options.scale);
        const filename = getSafeFilename(normalizedUrl, scale);
        output = path.join(outputDir, filename);
      }

      // Validate format
      const validFormats = ['png', 'jpeg'];
      if (!validFormats.includes(options.format)) {
        console.error(`Invalid format. Use: ${validFormats.join(', ')}`);
        process.exit(1);
      }

      // Validate quality for JPEG
      const quality = parseInt(options.quality);
      if (options.format === 'jpeg' && (quality < 1 || quality > 100)) {
        console.error('JPEG quality must be between 1-100');
        process.exit(1);
      }

      // Validate scale factor
      const scale = parseInt(options.scale);
      if (![1, 2, 3].includes(scale)) {
        console.error('Scale must be 1, 2, or 3');
        process.exit(1);
      }

      // Take screenshot
      await screenshotWebsite({
        url: normalizedUrl,
        width,
        height,
        delay: parseInt(options.delay),
        output,
        headless: options.headless,
        quality,
        format: options.format,
        scale,
      });
    } catch (error) {
      console.error(`Failed to take screenshot: ${error.message}`);
      process.exit(1);
    }
  });

// Add help examples
program.on('--help', () => {
  console.log(''); // Add a newline for better readability
  console.log('Examples:');
  console.log('  $ webshot https://example.com');
  console.log('  $ webshot example.com -r mobile -d 2000');
  console.log('  $ webshot https://example.com -w 1920 -h 1080 -o cool-name.png');
  console.log('  $ webshot https://example.com -f jpeg -q 85');
  console.log('  $ webshot https://example.com -s 2  # 2x retina');
  console.log('  $ webshot https://example.com --no-headless');
  console.log('');
});

program.parse();
