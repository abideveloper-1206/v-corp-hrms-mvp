import { chromium } from 'playwright'

const results = []
const browser = await chromium.launch()
const page = await browser.newPage({ viewport: { width: 1440, height: 900 } })
page.on('console', (msg) => { if (msg.type() === 'error') results.push(`console.error: ${msg.text()}`) })
page.on('pageerror', (err) => results.push(`pageerror: ${err.message}`))

await page.goto('http://localhost:4173/login', { waitUntil: 'load' })
await page.waitForSelector('text=Sign in to your workspace')
await page.waitForTimeout(800)
await page.fill('input[type="email"]', 'admin@vcorp.com')
await page.fill('input[type="password"]', 'vcorp123')
await page.click('button[type="submit"]')
await page.waitForURL('**/dashboard', { timeout: 15000 })

await page.goto('http://localhost:4173/employees', { waitUntil: 'load' })
await page.waitForSelector('table, [data-slot="table-content"]')
await page.waitForTimeout(400)
await page.screenshot({ path: 'C:\\Users\\AbinaM\\Desktop\\vezham\\v-corp-hrms\\debug-search-pag.png' })

// type into search box
const searchInput = page.locator('input[type="search"]').first()
const searchCount = await searchInput.count()
results.push(`search input found: ${searchCount}`)
if (searchCount > 0) {
  await searchInput.click()
  await searchInput.type('Myrna', { delay: 50 })
  await page.waitForTimeout(600)
  const inputVal = await searchInput.inputValue()
  results.push(`search input value now: "${inputVal}"`)
  const rowCount = await page.locator('tbody tr').count()
  results.push(`rows after search "Myrna": ${rowCount}`)
  const firstRowText = await page.locator('tbody tr').first().innerText()
  results.push(`first row text: ${firstRowText.slice(0, 60)}`)
}

// click Next on pagination
const nextBtn = page.locator('button:has-text("Next")').first()
const nextCount = await nextBtn.count()
results.push(`next button found: ${nextCount}`)
if (nextCount > 0) {
  await nextBtn.click()
  await page.waitForTimeout(400)
  const pageText = await page.locator('text=/Page \\d+ of \\d+/').first().textContent()
  results.push(`page indicator after Next click: ${pageText}`)
}

console.log(results.join('\n'))
await browser.close()
