"""Stage A+B: keyword-score feed entries, link-check every site, scan homepage HTML
and up to 3 same-origin JS bundles for 3D/WebGL/terminal/retro signals."""
import json, re, sys, time
from concurrent.futures import ThreadPoolExecutor, as_completed
from urllib.parse import urljoin, urlparse
import requests

feed_path, out_path = sys.argv[1], sys.argv[2]
feed = json.load(open(feed_path))

KW = {  # keyword -> weight, applied to name/tagline/url/title/meta
    r'\b3d\b': 4, r'three\.?js': 5, r'webgl': 5, r'\binteractive\b': 2, r'\bgame': 2,
    r'cyberpunk': 4, r'\bterminal\b': 3, r'\bretro\b': 3, r'\by2k\b': 4, r'\bcreative (developer|technologist|coder)': 3,
    r'\bshader': 4, r'\bgsap\b': 1, r'\bneon\b': 2, r'\bmatrix\b': 2, r'\bhacker\b': 2, r'\bcli\b': 1, r'\bnetwork engineer': 2,
    r'\bimmersive': 2, r'\bvoxel': 3, r'\bblender\b': 2, r'\bunity\b': 1, r'\bpixel\b': 1, r'\bos\b|\bdesktop os\b|windows 9[58]|macos': 1,
}
CODE = {  # strong code signals in JS bundles / HTML
    'three': re.compile(r'WebGLRenderer|three\.module|THREE\.|__THREE__|three@0\.|three/examples'),
    'r3f': re.compile(r'@react-three|react-three-fiber|useFrame\('),
    'webgl': re.compile(r'getContext\(["\']webgl2?|WebGL2RenderingContext|gl_FragColor|gl_Position'),
    'babylon': re.compile(r'BABYLON\.|babylonjs'),
    'pixi': re.compile(r'PIXI\.|pixi\.js'),
    'spline': re.compile(r'@splinetool|spline\.design|prod\.spline'),
    'ogl': re.compile(r'\bogl\b|from"ogl"'),
    'gsap': re.compile(r'gsap|ScrollTrigger|TweenMax'),
    'xterm': re.compile(r'xterm|typed\.js|Typewriter|terminal', re.I),
    'canvas': re.compile(r'<canvas', re.I),
}
UA = {'User-Agent': 'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130 Safari/537.36'}
PARKED = re.compile(r'domain (is )?for sale|buy this domain|parked free|godaddy|sedoparking|hugedomains|this domain has expired|account suspended|site not found|deployment not found|404: not found|there isn.t a github pages site here|page not found', re.I)

def kw_score(text):
    t = text.lower(); s = 0; hits = []
    for k, w in KW.items():
        if re.search(k, t): s += w; hits.append(k)
    return s, hits

def get(url, limit):
    r = requests.get(url, headers=UA, timeout=(8, 12), stream=True, allow_redirects=True)
    buf = b''
    for chunk in r.iter_content(65536):
        buf += chunk
        if len(buf) > limit: break
    r.close()
    return r, buf.decode('utf-8', 'ignore')

def probe(e):
    url = e['url'].strip()
    res = dict(e); res['ok'] = False
    try:
        r, html = get(url, 600_000)
        res['status'] = r.status_code; res['final'] = r.url
        if r.status_code >= 400 or len(html) < 200 or PARKED.search(html[:20000]) and len(html) < 30000:
            res['dead_reason'] = f'status {r.status_code} / len {len(html)}'; return res
        res['ok'] = True
        m = re.search(r'<title[^>]*>(.*?)</title>', html, re.I | re.S); res['title'] = (m.group(1).strip()[:160] if m else '')
        m = re.search(r'<meta[^>]+name=["\']description["\'][^>]+content=["\']([^"\']*)', html, re.I); res['desc'] = (m.group(1)[:300] if m else '')
        sig = {k for k, rx in CODE.items() if rx.search(html)}
        host = urlparse(r.url).netloc
        srcs = re.findall(r'<script[^>]+src=["\']([^"\']+)["\']', html, re.I)
        srcs += re.findall(r'<link[^>]+rel=["\']modulepreload["\'][^>]+href=["\']([^"\']+)', html, re.I)
        js = []
        for s in srcs:
            u = urljoin(r.url, s)
            if urlparse(u).netloc == host and not re.search(r'gtag|analytics|polyfill|webpack-runtime|framework-', u): js.append(u)
            elif re.search(r'three|babylon|pixi|spline|gsap', u, re.I): sig.add('cdn:' + re.search(r'three|babylon|pixi|spline|gsap', u, re.I).group(0).lower())
        for u in js[:4]:
            try:
                _, code = get(u, 2_500_000)
                sig |= {k for k, rx in CODE.items() if k not in ('canvas', 'xterm') and rx.search(code)}
            except Exception: pass
        res['signals'] = sorted(sig)
    except Exception as ex:
        res['dead_reason'] = type(ex).__name__ + ': ' + str(ex)[:120]
    return res

out = []
t0 = time.time()
with ThreadPoolExecutor(48) as ex:
    futs = [ex.submit(probe, e) for e in feed]
    for i, f in enumerate(as_completed(futs)):
        out.append(f.result())
        if i % 200 == 0: print(i, round(time.time() - t0), flush=True)
for r in out:
    s, hits = kw_score(' '.join([r.get('name', ''), r.get('tagline', ''), r.get('url', ''), r.get('title', ''), r.get('desc', '')]))
    sig = set(r.get('signals', []))
    s += 6 * bool(sig & {'three', 'r3f', 'cdn:three'}) + 4 * bool(sig & {'webgl', 'babylon', 'ogl'}) + 3 * bool(sig & {'spline', 'cdn:spline', 'pixi'}) + 1 * bool('gsap' in sig) + 1 * bool('xterm' in sig)
    r['score'] = s; r['kw'] = hits
json.dump(out, open(out_path, 'w'), indent=1)
print('done', len(out), 'live', sum(r['ok'] for r in out), round(time.time() - t0))
