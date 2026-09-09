import { chromium } from 'playwright'

const logs = []
const browser = await chromium.launch()
const page = await browser.newPage({ viewport: { width: 1440, height: 900 } })
page.on('console', (msg) => logs.push(msg.text()))

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

const searchInput = page.locator('input[type="search"]').first()
await searchInput.click()
await searchInput.type('My', { delay: 80 })
await page.waitForTimeout(500)

console.log('DEBUG logs found:', logs.filter(l => l.includes('DEBUG')).length)
console.log(logs.filter(l => l.includes('DEBUG')).join('\n'))

await browser.close()
