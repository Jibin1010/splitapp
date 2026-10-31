import puppeteer from 'puppeteer-core'
import path from 'path'
import fs from 'fs'

const ARTIFACT_DIR = '/Users/jibin/.gemini/antigravity-ide/brain/ddb1bfad-727c-4cdf-a70d-463c62d3234e'

async function main() {
  const browser = await puppeteer.launch({
    executablePath: '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--window-size=1400,1600'],
    defaultViewport: {
      width: 1400,
      height: 1600,
      deviceScaleFactor: 2, // Crisp Retina resolution
    },
  })

  const page = await browser.newPage()
  console.log('Navigating to http://localhost:3000/split...')
  await page.goto('http://localhost:3000/split', { waitUntil: 'networkidle0' })

  // Find and click the AI Scan button
  console.log('Looking for AI Scan button...')
  await page.waitForSelector('button', { timeout: 5000 })
  const buttons = await page.$$('button')
  let scanBtn = null
  for (const b of buttons) {
    const text = await page.evaluate(el => el.textContent, b)
    if (text && text.includes('AI Scan')) {
      scanBtn = b
      break
    }
  }

  if (!scanBtn) {
    console.error('Could not find AI Scan button')
    await browser.close()
    process.exit(1)
  }

  console.log('Clicking AI Scan button...')
  await scanBtn.click()

  // Wait for dialog content to appear
  console.log('Waiting for dialog...')
  await page.waitForSelector('[role="dialog"]', { timeout: 5000 })

  // Look for "Try Sample Receipt"
  console.log('Looking for Try Sample Receipt button...')
  const sampleBtn = await page.waitForSelector('button ::-p-text(Try Sample Receipt)', { timeout: 5000 })
  if (!sampleBtn) {
    console.error('Could not find Try Sample Receipt button')
    await browser.close()
    process.exit(1)
  }

  console.log('Clicking Try Sample Receipt button...')
  await sampleBtn.click()

  // Capture screenshot 1: During scanning (with pure vector Lottie animation)
  await new Promise(r => setTimeout(r, 600))
  const scanningPath = path.join(ARTIFACT_DIR, 'receipt_ocr_scanning_lottie.png')
  await page.screenshot({ path: scanningPath, fullPage: false })
  console.log(`Saved scanning screenshot: ${scanningPath}`)

  // Wait for scanning animation to complete (1.8s + buffer)
  console.log('Waiting for scanning and OCR analysis to complete...')
  await new Promise(r => setTimeout(r, 1800))

  // Wait for result table / Duniyav Bir header
  await page.waitForFunction(() => document.body.innerText.includes('Duniyav Bir'), { timeout: 5000 })

  // Ensure full dialog is visible by expanding max-height on the dialog content for a full screenshot
  await page.evaluate(() => {
    const dialog = document.querySelector('[role="dialog"]')
    if (dialog) {
      dialog.style.maxHeight = 'none'
      dialog.style.height = 'auto'
      dialog.style.overflow = 'visible'
    }
  })

  // Resize viewport to fit entire modal if needed
  const dialogRect = await page.evaluate(() => {
    const dialog = document.querySelector('[role="dialog"]')
    if (!dialog) return null
    const r = dialog.getBoundingClientRect()
    return { top: r.top, left: r.left, width: r.width, height: r.height }
  })

  if (dialogRect && dialogRect.height > 1200) {
    await page.setViewport({
      width: 1400,
      height: Math.ceil(dialogRect.height + 200),
      deviceScaleFactor: 2,
    })
  }

  await new Promise(r => setTimeout(r, 500))

  // Capture screenshot 2: Full dialog with analyzed items, people, and split
  const fullDialogPath = path.join(ARTIFACT_DIR, 'receipt_ocr_analyzed_full.png')
  
  // Screenshot dialog element specifically
  const dialogElement = await page.$('[role="dialog"]')
  if (dialogElement) {
    await dialogElement.screenshot({ path: fullDialogPath })
  } else {
    await page.screenshot({ path: fullDialogPath, fullPage: true })
  }
  console.log(`Saved analyzed dialog screenshot: ${fullDialogPath}`)

  // Also capture full window view
  const fullPagePath = path.join(ARTIFACT_DIR, 'receipt_ocr_page_view.png')
  await page.screenshot({ path: fullPagePath, fullPage: false })
  console.log(`Saved page screenshot: ${fullPagePath}`)

  await browser.close()
  console.log('Done!')
}

main().catch(err => {
  console.error('Error in capture script:', err)
  process.exit(1)
})
