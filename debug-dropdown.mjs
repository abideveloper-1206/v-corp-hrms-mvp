import { chromium } from 'playwright'

const results = []
const browser = await chromium.launch()
const page = await browser.newPage({ viewport: { width: 1440, height: 900 } })
page.on('console', (msg) => { if (msg.type() === 'error') results.push(`console.error: ${msg.text()}`) })
page.on('pageerror', (err) => results.push(`pageerror: ${err.message}`))

await page.goto('http://localhost:3002/login', { waitUntil: 'networkidle' })
await page.fill('input[type="email"]', 'admin@vcorp.com')
await page.fill('input[type="password"]', 'vcorp123')
await page.click('button[type="submit"]')
await page.waitForURL('**/dashboard', { timeout: 15000 })

// Test 1: SelectField (Department filter) on Employees page
await page.goto('http://localhost:3002/employees', { waitUntil: 'networkidle' })
await page.waitForSelector('table, [data-slot="table-content"]')
await page.waitForTimeout(300)

// Click the "All departments" select trigger
const selectTrigger = page.locator('button[data-slot="select-trigger"]').first()
const selectExists = await selectTrigger.count()
results.push(`select trigger found: ${selectExists}`)
if (selectExists > 0) {
  await selectTrigger.click()
  await page.waitForTimeout(400)
  const listboxVisible = await page.locator('[role="listbox"]').count()
  results.push(`listbox opened after click: ${listboxVisible > 0}`)
  await page.screenshot({ path: 'C:\\Users\\AbinaM\\Desktop\\vezham\\v-corp-hrms\\debug-select-open.png' })
  await page.keyboard.press('Escape')
}

// Test 2: Dropdown (kebab menu) on employee row
await page.waitForTimeout(300)
const kebab = page.locator('tbody tr').first().locator('button').last()
await kebab.click()
await page.waitForTimeout(400)
const menuVisible = await page.locator('[role="menu"]').count()
results.push(`dropdown menu opened after click: ${menuVisible > 0}`)
await page.screenshot({ path: 'C:\\Users\\AbinaM\\Desktop\\vezham\\v-corp-hrms\\debug-dropdown-open.png' })
await page.keyboard.press('Escape')

// Test 3: user avatar dropdown in topbar
await page.waitForTimeout(300)
const avatarTrigger = page.locator('button[data-slot="dropdown-trigger"]').last()
await avatarTrigger.click()
await page.waitForTimeout(400)
const userMenuVisible = await page.locator('[role="menu"]').count()
results.push(`user menu opened after click: ${userMenuVisible > 0}`)

console.log(results.join('\n'))
await browser.close()
