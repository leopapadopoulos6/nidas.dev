// Procedural canvas textures. Everything is generated in code: no image assets.
import * as THREE from 'three';
import type { Direction } from './directions';

function canvas(w: number, h: number): [HTMLCanvasElement, CanvasRenderingContext2D] {
  const c = document.createElement('canvas');
  c.width = w;
  c.height = h;
  const g = c.getContext('2d');
  if (!g) throw new Error('2d context unavailable');
  return [c, g];
}

function tex(c: HTMLCanvasElement, srgb = true): THREE.CanvasTexture {
  const t = new THREE.CanvasTexture(c);
  if (srgb) t.colorSpace = THREE.SRGBColorSpace;
  t.anisotropy = 8;
  return t;
}

/** Raised-floor tiles: 4x4 tiles per texture repeat, some perforated (cold aisle). */
export function floorTextures(d: Direction): { map: THREE.Texture; emissive: THREE.Texture; rough: THREE.Texture } {
  const S = 1024;
  const T = S / 4;
  const [c, g] = canvas(S, S);
  const [ce, ge] = canvas(S, S);
  const [cr, gr] = canvas(S, S);
  g.fillStyle = d.palette.floor;
  g.fillRect(0, 0, S, S);
  ge.fillStyle = '#000';
  ge.fillRect(0, 0, S, S);
  gr.fillStyle = '#5a5a5a';
  gr.fillRect(0, 0, S, S);
  const perforated = new Set(['0,1', '1,1', '2,1', '3,1']);
  for (let y = 0; y < 4; y++) {
    for (let x = 0; x < 4; x++) {
      const px = x * T;
      const py = y * T;
      // subtle per-tile value shift
      g.fillStyle = `rgba(255,255,255,${0.012 + ((x * 7 + y * 3) % 5) * 0.006})`;
      g.fillRect(px + 3, py + 3, T - 6, T - 6);
      if (perforated.has(`${x},${y}`)) {
        for (let i = 0; i < 14; i++) {
          for (let j = 0; j < 14; j++) {
            const cx = px + 22 + i * 15.5;
            const cy = py + 22 + j * 15.5;
            g.fillStyle = 'rgba(0,0,0,0.65)';
            g.beginPath();
            g.arc(cx, cy, 4.2, 0, Math.PI * 2);
            g.fill();
            ge.fillStyle = d.palette.primary;
            ge.globalAlpha = 0.16;
            ge.beginPath();
            ge.arc(cx, cy, 3.2, 0, Math.PI * 2);
            ge.fill();
            ge.globalAlpha = 1;
          }
        }
      }
      // seams
      g.strokeStyle = 'rgba(0,0,0,0.85)';
      g.lineWidth = 5;
      g.strokeRect(px + 2.5, py + 2.5, T - 5, T - 5);
      g.strokeStyle = d.palette.trim;
      g.globalAlpha = 0.18;
      g.lineWidth = 1.5;
      g.strokeRect(px + 6, py + 6, T - 12, T - 12);
      g.globalAlpha = 1;
      gr.fillStyle = '#ffffff';
      gr.fillRect(px, py, T, 6);
      gr.fillRect(px, py, 6, T);
    }
  }
  const map = tex(c);
  const emissive = tex(ce);
  const rough = tex(cr, false);
  for (const t of [map, emissive, rough]) {
    t.wrapS = t.wrapT = THREE.RepeatWrapping;
  }
  return { map, emissive, rough };
}

/** Device front: vents, a model label, a small handle. Returns map; LEDs are separate geometry. */
export function bezelTexture(d: Direction, variant: number): THREE.Texture {
  const [c, g] = canvas(512, 64);
  g.fillStyle = d.palette.bezel;
  g.fillRect(0, 0, 512, 64);
  const light = d.id === 'blacklight';
  g.fillStyle = light ? 'rgba(20,10,50,0.55)' : 'rgba(0,0,0,0.55)';
  if (variant % 3 === 0) {
    for (let x = 60; x < 330; x += 9) g.fillRect(x, 14, 5, 36);
  } else if (variant % 3 === 1) {
    for (let y = 0; y < 4; y++) for (let x = 0; x < 30; x++) {
      g.beginPath();
      g.arc(80 + x * 8 + (y % 2) * 4, 16 + y * 10, 2.6, 0, Math.PI * 2);
      g.fill();
    }
  } else {
    g.fillRect(70, 26, 250, 12);
  }
  g.fillStyle = light ? 'rgba(30,10,70,0.8)' : 'rgba(255,255,255,0.22)';
  g.font = `600 13px "${d.fonts.mono}", monospace`;
  g.fillText(['NX-9K', 'CAT-48P', 'ASA-55', 'R740', 'SRX', 'UPS-2U', 'NAS-12'][variant % 7], 350, 37);
  g.fillStyle = light ? 'rgba(255,255,255,0.6)' : 'rgba(255,255,255,0.09)';
  g.fillRect(8, 8, 18, 48);
  g.fillRect(486, 8, 18, 48);
  return tex(c);
}

export function labelTexture(text: string, d: Direction, color = d.palette.primary): THREE.Texture {
  const [c, g] = canvas(512, 96);
  g.fillStyle = 'rgba(0,0,0,0)';
  g.clearRect(0, 0, 512, 96);
  g.fillStyle = color;
  g.font = `700 54px "${d.fonts.display}", sans-serif`;
  g.textBaseline = 'middle';
  g.textAlign = 'center';
  g.fillText(text, 256, 52);
  return tex(c);
}

/** Crash-cart CRT: the boot screen that the camera later dives into. */
export function consoleTexture(d: Direction): THREE.CanvasTexture {
  const [c, g] = canvas(800, 600);
  g.fillStyle = d.id === 'blacklight' ? '#0b0322' : '#020604';
  g.fillRect(0, 0, 800, 600);
  const col = d.palette.screen;
  g.fillStyle = col;
  g.shadowColor = col;
  g.shadowBlur = 10;
  g.font = `500 26px "${d.fonts.mono}", monospace`;
  const lines = [
    'NIDAS-BIOS 2.0   (c) 2026',
    'CPU0 ... LEO.PAPADOPOULOS   OK',
    'MEM  ... 640K NETWORK ENGINEER',
    'NIC0 ... trunk up  vlan 10,20,30',
    '',
    'boot: loading /home/leo/resume',
    '[####################----] 82%',
    '',
    '> whoami',
    'network engineer // nyc',
    '> cat about.txt_',
  ];
  lines.forEach((l, i) => g.fillText(l, 44, 70 + i * 42));
  g.shadowBlur = 0;
  for (let y = 0; y < 600; y += 4) {
    g.fillStyle = 'rgba(0,0,0,0.22)';
    g.fillRect(0, y, 800, 2);
  }
  return tex(c);
}

export function deniedTexture(d: Direction): THREE.CanvasTexture {
  const [c, g] = canvas(512, 384);
  g.fillStyle = '#090102';
  g.fillRect(0, 0, 512, 384);
  g.strokeStyle = d.palette.alert;
  g.lineWidth = 6;
  g.strokeRect(18, 18, 476, 348);
  g.fillStyle = d.palette.alert;
  g.shadowColor = d.palette.alert;
  g.shadowBlur = 14;
  g.textAlign = 'center';
  g.font = `800 64px "${d.fonts.display}", sans-serif`;
  g.fillText('ACCESS', 256, 160);
  g.fillText('DENIED', 256, 230);
  g.shadowBlur = 0;
  g.font = `500 22px "${d.fonts.mono}", monospace`;
  g.fillText('/apps  ·  auth required', 256, 300);
  return tex(c);
}

/** The sign across the street, seen through the window. */
export function neonSignTexture(d: Direction): THREE.CanvasTexture {
  const [c, g] = canvas(1024, 512);
  g.clearRect(0, 0, 1024, 512);
  const glow = (color: string, blur: number) => {
    g.shadowColor = color;
    g.shadowBlur = blur;
    g.strokeStyle = color;
    g.fillStyle = color;
  };
  g.lineCap = 'round';
  g.lineJoin = 'round';
  glow(d.palette.accent, 30);
  g.lineWidth = 16;
  g.font = `800 210px "${d.fonts.display}", sans-serif`;
  g.textAlign = 'center';
  g.strokeText('24/7', 512, 300);
  glow('#ffffff', 8);
  g.lineWidth = 5;
  g.strokeText('24/7', 512, 300);
  glow(d.palette.primary, 26);
  g.lineWidth = 10;
  g.beginPath();
  g.moveTo(170, 380);
  g.lineTo(854, 380);
  g.stroke();
  g.font = `600 56px "${d.fonts.mono}", monospace`;
  g.fillText('NETWORK · NOC · DATA', 512, 450);
  return tex(c);
}

/** Vertical falloff used for fake volumetric light shafts. */
export function shaftTexture(): THREE.Texture {
  const [c, g] = canvas(64, 256);
  const grd = g.createLinearGradient(0, 0, 0, 256);
  grd.addColorStop(0, 'rgba(255,255,255,0.9)');
  grd.addColorStop(0.5, 'rgba(255,255,255,0.25)');
  grd.addColorStop(1, 'rgba(255,255,255,0)');
  g.fillStyle = grd;
  g.fillRect(0, 0, 64, 256);
  const side = g.createLinearGradient(0, 0, 64, 0);
  side.addColorStop(0, 'rgba(0,0,0,1)');
  side.addColorStop(0.3, 'rgba(0,0,0,0)');
  side.addColorStop(0.7, 'rgba(0,0,0,0)');
  side.addColorStop(1, 'rgba(0,0,0,1)');
  g.globalCompositeOperation = 'destination-out';
  g.fillStyle = side;
  g.fillRect(0, 0, 64, 256);
  return tex(c, false);
}

export function dotTexture(): THREE.Texture {
  const [c, g] = canvas(64, 64);
  const grd = g.createRadialGradient(32, 32, 0, 32, 32, 32);
  grd.addColorStop(0, 'rgba(255,255,255,1)');
  grd.addColorStop(0.35, 'rgba(255,255,255,0.35)');
  grd.addColorStop(1, 'rgba(255,255,255,0)');
  g.fillStyle = grd;
  g.fillRect(0, 0, 64, 64);
  return tex(c, false);
}

export function signTexture(lines: string[], d: Direction, fg: string, bg: string): THREE.Texture {
  const [c, g] = canvas(512, 256);
  g.fillStyle = bg;
  g.fillRect(0, 0, 512, 256);
  g.fillStyle = fg;
  g.textAlign = 'center';
  g.font = `800 52px "${d.fonts.display}", sans-serif`;
  g.fillText(lines[0] ?? '', 256, 110);
  g.font = `500 28px "${d.fonts.mono}", monospace`;
  g.fillText(lines[1] ?? '', 256, 170);
  return tex(c);
}
