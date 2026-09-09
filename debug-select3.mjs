import { chromium } from 'playwright'

const results = []
const browser = await chromium.launch()
const page = await browser.newPage({ viewport: { width: 1440, height: 900 } })
page.on('console', (msg) => { if (msg.type() === 'error') results.push(`console.error: ${msg.text()}`) })
page.on('pageerror', (err) => results.push(`pageerror: ${err.message}`))

await page.goto('http://localhost:4173/login', { waitUntil: 'load' })
await page.waitForSelector('text=Sign in to your workspace')
await page.waitForTimeout(1000)
await page.fill('input[type="email"]', 'admin@vcorp.com')
await page.fill('input[type="password"]', 'vcorp123')
await page.click('button[type="submit"]')
await page.waitForURL('**/dashboard', { timeout: 15000 })

// Full add-employee flow using the Department select
await page.goto('http://localhost:4173/employees', { waitUntil: 'load' })
await page.waitForSelector('table, [data-slot="table-content"]')
await page.click('button:has-text("Add employee")')
await page.waitForSelector('text=Personal information', { timeout: 15000 })

await page.fill('input[name="firstName"]', 'Test')
await page.fill('input[name="lastName"]', 'User')
await page.fill('input[name="email"]', 'test.user@vcorp.com')
await page.fill('input[name="phone"]', '+1234567890')

// open Department select (inside the drawer dialog specifically) and pick the first real option
const dialog = page.locator('[data-slot="drawer-dialog"]')
const deptTrigger = dialog.locator('button[aria-label="Department"]')
await deptTrigger.click()
await page.waitForTimeout(300)
const options = page.locator('[role="option"]')
const optCount = await options.count()
results.push(`department options visible: ${optCount}`)
await options.first().click()
await page.waitForTimeout(200)
const selectedText = await deptTrigger.textContent()
results.push(`department selected label now shows: ${selectedText?.trim()}`)

await page.fill('input[name="designation"]', 'QA Tester')
await page.fill('input[name="location"]', 'Chennai, IN')
await page.fill('input[name="address"]', '123 Test Street')
await page.fill('input[name="emergencyContactName"]', 'Emergency Contact')
await page.fill('input[name="emergencyContactPhone"]', '+1987654321')

await dialog.locator('button:has-text("Add employee")').click()
await page.waitForTimeout(1000)
const toastVisible = await page.locator('text=Employee added').count()
results.push(`success toast shown: ${toastVisible > 0}`)
await page.screenshot({ path: 'C:\\Users\\AbinaM\\Desktop\\vezham\\v-corp-hrms\\debug-add-flow.png' })

console.log(results.join('\n'))
await browser.close()
