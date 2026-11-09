"""Score screenshot trust, write survey.json, and build labelled contact sheets."""
import json, sys, os
from PIL import Image, ImageDraw, ImageStat, ImageFont
root = sys.argv[1]
shots = json.load(open(f'{root}/shots.json'))
probe = {r['url']: r for r in json.load(open(f'{root}/probe.json'))}
def stats(path):
    if not os.path.exists(path): return None
    im = Image.open(path).convert('L').resize((160, 100))
    st = ImageStat.Stat(im)
    return round(st.mean[0], 1), round(st.stddev[0], 1)
survey = []
for url, r in shots.items():
    d, m = r.get('d', {}), r.get('m', {})
    s1, s2, sm = (stats(f"{root}/shots/{r['slug']}-{k}.jpg") for k in ('d1', 'd2', 'm'))
    gl = (d.get('gl') or {}).get('webgl', 0) + (m.get('gl') or {}).get('webgl', 0)
    errs = ' '.join(d.get('consoleErrors', []) + m.get('consoleErrors', [])).lower()
    flags = []
    if d.get('error') or m.get('error'): flags.append('load-error')
    if gl and s2 and (s2[1] < 10 or s2[0] < 6): flags.append('webgl-blank')
    if gl and any(k in errs for k in ('webgl', 'gpu', 'context lost', 'swiftshader', 'shader')): flags.append('webgl-errors')
    if s2 and s2[1] < 4: flags.append('blank')
    if m.get('overflowX', 0) and m['overflowX'] > 2: flags.append(f"mobile-overflow-{m['overflowX']}px")
    pr = probe.get(url, {})
    survey.append(dict(url=url, name=r['name'], why=r['why'], tagline=pr.get('tagline', ''), signals=pr.get('signals', []),
        webgl_contexts=gl, canvases=d.get('canvases'), load_ms=d.get('loadedMs'), bytes=d.get('bytes'), js_bytes=d.get('jsBytes'),
        requests=d.get('requests'), mobile_overflow=m.get('overflowX'), title=d.get('title') or pr.get('title', ''),
        lum_d2=s2, lum_m=sm, flags=flags, untrusted=bool({'webgl-blank', 'webgl-errors'} & set(flags)) or ('load-error' in flags and gl > 0),
        slug=r['slug']))
json.dump(survey, open(f'{root}/survey.json', 'w'), indent=1)
print(len(survey), 'untrusted', sum(s['untrusted'] for s in survey), 'overflow', sum(bool(s['mobile_overflow'] and s['mobile_overflow'] > 2) for s in survey))
# contact sheets: desktop d2 + mobile side by side, 4 cols x 5 rows
font = ImageFont.load_default()
os.makedirs(f'{root}/sheets', exist_ok=True)
W, H, MW = 300, 188, 87
for si in range(0, len(survey), 20):
    sheet = Image.new('RGB', (4 * (W + MW + 12), 5 * (H + 26)), (20, 20, 24))
    dr = ImageDraw.Draw(sheet)
    for k, s in enumerate(survey[si:si + 20]):
        x, y = (k % 4) * (W + MW + 12), (k // 4) * (H + 26)
        for name, size, dx in ((f"{s['slug']}-d2.jpg", (W, H), 0), (f"{s['slug']}-m.jpg", (MW, H), W + 2)):
            p = f"{root}/shots/{name}"
            if os.path.exists(p): sheet.paste(Image.open(p).resize(size), (x + dx, y))
        lab = f"{si + k}: {s['url'].replace('https://', '')[:44]}{' [?]' if s['untrusted'] else ''}"
        dr.text((x + 2, y + H + 6), lab, fill=(255, 210, 90) if s['untrusted'] else (230, 230, 230), font=font)
    sheet.save(f'{root}/sheets/sheet{si // 20:02d}.jpg', quality=82)
print('sheets', (len(survey) + 19) // 20)
