// Screenshot each site at desktop (1440x900, two moments) and mobile (390x844), record runtime metrics.
const { chromium, devices } = require('playwright');
const fs = require('fs'), path = require('path');
const [, , listPath, outDir, workersArg] = process.argv;
const list = JSON.parse(fs.readFileSync(listPath, 'utf8'));
fs.mkdirSync(outDir, { recursive: true });
const slug = u => u.replace(/^https?:\/\//, '').replace(/[^a-z0-9]+/gi, '-').replace(/-+$/, '').slice(0, 60);
const INIT = () => {
  window.__gl = { webgl: 0, ctx2d: 0, errors: 0 };
  const orig = HTMLCanvasElement.prototype.getContext;
  HTMLCanvasElement.prototype.getContext = function (t, ...a) {
    if (/webgl/.test(t)) window.__gl.webgl++; else if (t === '2d') window.__gl.ctx2d++;
    const c = orig.call(this, t, ...a);
    if (!c && /webgl/.test(t)) window.__gl.errors++;
    return c;
  };
};
const metrics = async page => page.evaluate(() => {
  const res = performance.getEntriesByType('resource');
  const nav = performance.getEntriesByType('navigation')[0];
  return {
    gl: window.__gl, canvases: document.querySelectorAll('canvas').length,
    overflowX: document.documentElement.scrollWidth - window.innerWidth,
    bytes: res.reduce((s, r) => s + (r.transferSize || 0), 0) + (nav ? nav.transferSize : 0),
    jsBytes: res.filter(r => r.initiatorType === 'script').reduce((s, r) => s + (r.transferSize || 0), 0),
    requests: res.length, loadMs: nav ? Math.round(nav.loadEventEnd) : null,
    docHeight: document.documentElement.scrollHeight, title: document.title.slice(0, 120),
  };
});
async function visit(browser, site, kind) {
  const opts = kind === 'm'
    ? { ...devices['iPhone 13'], deviceScaleFactor: 1 }
    : { viewport: { width: 1440, height: 900 }, deviceScaleFactor: 1 };
  const ctx = await browser.newContext({ ...opts, ignoreHTTPSErrors: false });
  await ctx.addInitScript(INIT);
  const page = await ctx.newPage();
  const errors = [];
  page.on('console', m => { if (m.type() === 'error') errors.push(m.text().slice(0, 160)); });
  page.on('pageerror', e => errors.push('pageerror: ' + String(e).slice(0, 160)));
  const out = { kind };
  const t0 = Date.now();
  try {
    await page.goto(site.url, { waitUntil: 'domcontentloaded', timeout: 30000 });
    await page.waitForLoadState('load', { timeout: 15000 }).catch(() => {});
    out.loadedMs = Date.now() - t0;
    const s = slug(site.url);
    if (kind === 'd') {
      await page.waitForTimeout(4000);
      await page.screenshot({ path: path.join(outDir, `${s}-d1.jpg`), type: 'jpeg', quality: 72, timeout: 20000 });
      await page.waitForTimeout(8000);
      await page.screenshot({ path: path.join(outDir, `${s}-d2.jpg`), type: 'jpeg', quality: 72, timeout: 20000 });
    } else {
      await page.waitForTimeout(8000);
      await page.screenshot({ path: path.join(outDir, `${s}-m.jpg`), type: 'jpeg', quality: 72, timeout: 20000 });
    }
    Object.assign(out, await metrics(page));
    out.finalUrl = page.url();
  } catch (e) { out.error = String(e).split('\n')[0].slice(0, 200); }
  out.consoleErrors = errors.slice(0, 8); out.nErrors = errors.length;
  await ctx.close().catch(() => {});
  return out;
}
(async () => {
  const results = {};
  let i = 0;
  const workers = Number(workersArg || 3);
  await Promise.all(Array.from({ length: workers }, async () => {
    let browser = await chromium.launch({ args: ['--enable-unsafe-swiftshader', '--autoplay-policy=no-user-gesture-required', '--mute-audio'] });
    while (i < list.length) {
      const site = list[i++];
      const r = { url: site.url, name: site.name, why: site.why, slug: slug(site.url) };
      for (const kind of ['d', 'm']) {
        const v = await Promise.race([visit(browser, site, kind), new Promise(res => setTimeout(() => res({ kind, error: 'hard-timeout' }), 75000))]);
        r[kind] = v;
        if (v.error === 'hard-timeout') { await browser.close().catch(() => {}); browser = await chromium.launch({ args: ['--enable-unsafe-swiftshader', '--mute-audio'] }); }
      }
      results[site.url] = r;
      console.log(Object.keys(results).length, site.url, r.d.error || 'ok', r.m.error || 'ok');
      fs.writeFileSync(path.join(outDir, '..', 'shots.json'), JSON.stringify(results, null, 1));
    }
    await browser.close();
  }));
  console.log('DONE');
})();
