import { chromium } from 'playwright'

const browser = await chromium.launch()
const page = await browser.newPage({ viewport: { width: 1440, height: 900 } })
const logs = []
page.on('console', (msg) => logs.push(msg.text()))
page.on('pageerror', (err) => logs.push('PAGEERROR: ' + err.message))

await page.goto('http://localhost:3002/login', { waitUntil: 'networkidle' })
await page.fill('input[type="email"]', 'admin@vcorp.com')
await page.fill('input[type="password"]', 'vcorp123')
await page.click('button[type="submit"]')
await page.waitForURL('**/dashboard', { timeout: 15000 })
await page.goto('http://localhost:3002/employees', { waitUntil: 'networkidle' })
await page.waitForSelector('table, [data-slot="table-content"]')
await page.waitForTimeout(300)

const trigger = page.locator('button[data-slot="select-trigger"]').first()
const before = await trigger.evaluate((el) => ({
  ariaExpanded: el.getAttribute('aria-expanded'),
  ariaHaspopup: el.getAttribute('aria-haspopup'),
  disabled: el.disabled,
  tag: el.tagName,
}))
console.log('BEFORE', JSON.stringify(before))

await trigger.click({ force: false })
await page.waitForTimeout(300)

const after = await trigger.evaluate((el) => ({
  ariaExpanded: el.getAttribute('aria-expanded'),
}))
console.log('AFTER', JSON.stringify(after))

// check if a popover element exists anywhere in the DOM (even if hidden/mispositioned)
const popoverInfo = await page.evaluate(() => {
  const el = document.querySelector('[data-slot="select-popover"]') || document.querySelector('[data-slot="dropdown-popover"]')
  if (!el) return { found: false }
  const rect = el.getBoundingClientRect()
  const style = getComputedStyle(el)
  return { found: true, rect, display: style.display, visibility: style.visibility, opacity: style.opacity }
})
console.log('POPOVER', JSON.stringify(popoverInfo))

console.log('--- relevant console logs ---')
console.log(logs.filter(l => l.toLowerCase().includes('error') || l.toLowerCase().includes('warn')).join('\n'))

await browser.close()
