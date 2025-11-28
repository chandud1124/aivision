import puppeteer from 'puppeteer';

const BASE = process.env.BASE_URL || 'http://localhost:8081';
const routes = ['/', '/live', '/departments', '/system', '/users', '/roles'];

function makeUser() {
  return {
    id: 1,
    email: 'admin@campus.edu',
    full_name: 'Admin',
    role: 'admin',
  };
}

async function checkRoute(browser, route) {
  const page = await browser.newPage();
  const messages = [];
  const failedRequests = [];
  page.on('console', (m) => messages.push({ type: m.type(), text: m.text() }));
  page.on('pageerror', (err) => messages.push({ type: 'pageerror', text: err.message }));
  page.on('requestfailed', (req) => failedRequests.push({ url: req.url(), reason: req.failure()?.errorText }));

  // set a fake logged-in state so ProtectedRoute doesn't redirect
  await page.goto(BASE, { waitUntil: 'domcontentloaded', timeout: 10000 });
  await page.evaluate((user) => {
    localStorage.setItem('access_token', 'dev_access_token');
    localStorage.setItem('user', JSON.stringify(user));
  }, makeUser());

  const url = BASE + route;
  let ok = false;
  let title = '';
  try {
    const resp = await page.goto(url, { waitUntil: 'networkidle2', timeout: 30000 });
    title = await page.title();
    const content = await page.content();
    // basic success heuristics: page returned and content length > 300
    ok = !!resp && resp.status && resp.status() < 400 && content.length > 300;
  } catch (err) {
    messages.push({ type: 'error', text: err.message });
  }

  // take a small screenshot for debugging
  const screenshot = await page.screenshot({ encoding: 'base64', fullPage: false }).catch(() => null);
  await page.close();
  return { route, ok, title, messages, failedRequests, screenshot: screenshot ? `<base64 ${screenshot.length} bytes>` : null };
}

(async () => {
  console.log('Starting Puppeteer smoke tests against', BASE);
  const browser = await puppeteer.launch({ args: ['--no-sandbox', '--disable-setuid-sandbox'] });
  const results = [];
  for (const r of routes) {
    process.stdout.write(`Checking ${r} ... `);
    const res = await checkRoute(browser, r);
    console.log(res.ok ? 'OK' : 'FAIL');
    results.push(res);
  }
  await browser.close();
  console.log('\n=== SUMMARY ===');
  for (const r of results) {
    console.log(`\nRoute: ${r.route}\n  ok: ${r.ok}\n  title: ${r.title}\n  messages: ${r.messages.length}\n  failedRequests: ${r.failedRequests.length}`);
    if (r.messages.length) console.log('  first message:', JSON.stringify(r.messages[0]).slice(0, 200));
    if (r.failedRequests.length) console.log('  first failed request:', JSON.stringify(r.failedRequests[0]).slice(0, 200));
  }
  // exit with non-zero if any failed
  const anyFail = results.some(r => !r.ok);
  process.exit(anyFail ? 2 : 0);
})();
