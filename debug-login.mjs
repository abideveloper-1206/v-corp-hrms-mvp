import { chromium } from 'playwright'

const browser = await chromium.launch()
const page = await browser.newPage({ viewport: { width: 1440, height: 900 } })
const logs = []
page.on('console', (msg) => logs.push(`[console:${msg.type()}] ${msg.text()}`))
page.on('pageerror', (err) => logs.push('PAGEERROR: ' + err.message))
page.on('request', (req) => { if (req.method() !== 'GET' || req.url().includes('login')) logs.push(`REQUEST ${req.method()} ${req.url()}`) })

await page.goto('http://localhost:4173/login', { waitUntil: 'load' })
await page.waitForSelector('text=Sign in to your workspace')
await page.waitForTimeout(1500)

const formInfo = await page.evaluate(() => {
  const form = document.querySelector('form')
  const btn = document.querySelector('button[type="submit"]')
  return {
    formExists: !!form,
    formHasOnsubmit: form ? (typeof form.onsubmit) : null,
    reactPropsKey: form ? Object.keys(form).find(k => k.startsWith('__reactProps')) : null,
    btnExists: !!btn,
    hydrated: !!document.querySelector('[data-rehydrate]') || document.readyState,
  }
})
console.log('FORM INFO', JSON.stringify(formInfo))

await page.fill('input[type="email"]', 'admin@vcorp.com')
await page.fill('input[type="password"]', 'vcorp123')
await page.click('button[type="submit"]')
await page.waitForTimeout(2000)
console.log('URL AFTER CLICK:', page.url())
await page.screenshot({ path: 'C:\\Users\\AbinaM\\Desktop\\vezham\\v-corp-hrms\\debug-login-after.png' })
const bodyText = await page.evaluate(() => document.body.innerText.slice(0, 500))
console.log('BODY TEXT:', bodyText)

console.log('--- logs ---')
console.log(logs.join('\n'))

await browser.close()
