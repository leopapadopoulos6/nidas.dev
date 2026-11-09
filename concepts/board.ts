import './fonts';
import './board.css';
import { SHORTLIST, SURVEY } from './research';

const el = <K extends keyof HTMLElementTagNameMap>(tag: K, attrs: Record<string, string> = {}, text?: string) => {
  const n = document.createElement(tag);
  for (const [k, v] of Object.entries(attrs)) n.setAttribute(k, v);
  if (text) n.textContent = text;
  return n;
};
const fmt = (n: number) => n.toLocaleString('en-US');

const method = document.querySelector('#method');
if (method) {
  method.textContent = `I parsed all ${fmt(SURVEY.feed)} entries in emmabostian/developer-portfolios, link-checked every one, and scanned each homepage plus its first JavaScript bundles for Three.js, WebGL, R3F, Spline and similar code, alongside taglines and titles mentioning 3D, terminal, retro, Y2K, cyberpunk and so on. The ${SURVEY.screenshotted} strongest candidates (including your two favourites) were screenshotted at 1440 px and 390 px, then narrowed to these 15 for what they teach this concept specifically.`;
}

const stats = document.querySelector('#stats');
if (stats) {
  const rows: [string, string][] = [
    [fmt(SURVEY.feed), 'portfolios in feed.json'],
    [fmt(SURVEY.live), `live (${SURVEY.dead} dead or blocking bots)`],
    [fmt(SURVEY.codeSignals), '3D/WebGL code found in bundles'],
    [fmt(SURVEY.screenshotted), 'screenshotted, desktop + mobile'],
    [fmt(SURVEY.lowTrust), 'low-trust WebGL renders'],
    [`${SURVEY.medianMB} MB`, `median first load (${SURVEY.over10MB} over 10 MB)`],
  ];
  for (const [b, s] of rows) {
    const d = el('div');
    d.append(el('b', {}, b), el('span', {}, s));
    stats.append(d);
  }
}

const cards = document.querySelector('#cards');
if (cards) {
  SHORTLIST.forEach((p, i) => {
    const card = el('article', { class: 'card' });
    const thumbs = el('div', { class: 'thumbs' });
    thumbs.append(
      el('img', { class: 'd', src: `/concepts/img/research/${p.img}`, alt: `${p.name} at 1440 px`, loading: 'lazy', width: '640', height: '400' }),
      el('img', { src: `/concepts/img/research/${p.mimg}`, alt: `${p.name} at 390 px`, loading: 'lazy', width: '195', height: '422' }),
    );
    const txt = el('div', { class: 'txt' });
    const nm = el('div', { class: 'nm' });
    nm.append(el('a', { href: p.url, target: '_blank', rel: 'noopener noreferrer' }, p.url.replace(/^https?:\/\/(www\.)?/, '').replace(/\/$/, '')), el('span', { class: 'rank' }, `#${String(i + 1).padStart(2, '0')}`));
    txt.append(nm);
    if (p.fav || p.lowTrust) {
      const badges = el('div');
      if (p.fav) badges.append(el('span', { class: 'badge fav' }, 'your favourite'), document.createTextNode(' '));
      if (p.lowTrust) badges.append(el('span', { class: 'badge', title: p.lowTrust }, `low-trust render: ${p.lowTrust.toLowerCase()}`));
      txt.append(badges);
    }
    txt.append(el('p', { class: 'one' }, p.one));
    const dl = el('dl');
    dl.append(el('dt', { class: 'l' }, 'Learn'), el('dd', {}, p.learn), el('dt', { class: 'v' }, 'Avoid'), el('dd', {}, p.avoid));
    txt.append(dl);
    card.append(thumbs, txt);
    cards.append(card);
  });
}
