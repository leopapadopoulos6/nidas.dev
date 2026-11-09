// Quick prototype of the Server Room diorama. One scene graph, styled per direction.
// Throwaway code for the concept board: Phase 3 rebuilds this in React Three Fiber.
import * as THREE from 'three';
import { Reflector } from 'three/examples/jsm/objects/Reflector.js';
import { RoomEnvironment } from 'three/examples/jsm/environments/RoomEnvironment.js';
import { RectAreaLightUniformsLib } from 'three/examples/jsm/lights/RectAreaLightUniformsLib.js';
import type { Direction } from './directions';
import {
  bezelTexture, consoleTexture, deniedTexture, dotTexture, floorTextures, labelTexture,
  neonSignTexture, shaftTexture, signTexture,
} from './textures';

export interface Pickable {
  id: string; // rack:0..3 | port:0..5 | console | locked
  object: THREE.Object3D;
  focus: { pos: THREE.Vector3; target: THREE.Vector3; fov: number };
}

export interface ServerRoom {
  scene: THREE.Scene;
  pickables: Pickable[];
  update: (t: number, dt: number) => void;
  setHover: (id: string | null) => void;
  firePort: (i: number) => void;
  screen: THREE.Mesh;
  dispose: () => void;
}

const U = 0.0445; // one rack unit in metres
/** Layer for bright overhead objects that should not show up in the floor reflection. */
export const NO_REFLECT = 1;
const RACK_H = 2.0;
const RACK_W = 0.6;
const RACK_D = 1.0;
const FLOOR = { x0: -3.8, x1: 3.0, z0: -3, z1: 1.8 };
const WALL_H = 3.0;
const TRAY_Y = 2.55;
export const RACK_LABELS = ['01 ABOUT', '02 WORK', '03 PROJECTS', '04 SKILLS'];
export const PORT_LABELS = ['GH', 'IN', 'MAIL', 'CV', 'RSS', 'PGP'];

type LedSpec = { p: THREE.Vector3; c: THREE.Color; s: [number, number, number]; rate: number; phase: number; duty: number; base: number; group: string };

export function buildServerRoom(d: Direction, renderer: THREE.WebGLRenderer): ServerRoom {
  RectAreaLightUniformsLib.init();
  const vector = d.render === 'vector';
  const P = d.palette;
  const col = (h: string) => new THREE.Color(h);
  const scene = new THREE.Scene();
  scene.background = col(P.void);
  scene.fog = new THREE.FogExp2(P.void, d.light.fogDensity);

  const pmrem = new THREE.PMREMGenerator(renderer);
  const env = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;
  if (!vector) {
    scene.environment = env;
    scene.environmentIntensity = d.id === 'blacklight' ? 0.22 : 0.12;
  }

  const uTime = { value: 0 };
  const disposables: { dispose: () => void }[] = [env, pmrem];
  const leds: LedSpec[] = [];
  const pickables: Pickable[] = [];
  const hoverables = new Map<string, THREE.Material[]>();
  const cableMats: { mat: THREE.MeshStandardMaterial; pulse: { value: number }; boost: { value: number }; port?: number }[] = [];

  // ---------- materials ----------
  const steel = new THREE.MeshStandardMaterial({ color: P.steel, metalness: 0.65, roughness: 0.42 });
  const steelDark = new THREE.MeshStandardMaterial({ color: col(P.steel).multiplyScalar(0.6), metalness: 0.5, roughness: 0.6 });
  const trim = new THREE.MeshStandardMaterial({ color: P.trim, metalness: 0.8, roughness: 0.3 });
  const wallMat = new THREE.MeshStandardMaterial({ color: P.wall, metalness: 0.0, roughness: 0.92 });
  const chrome = new THREE.MeshStandardMaterial({ color: '#d9dcf2', metalness: 1, roughness: 0.16 });
  const sidePanel = d.acrylic
    ? new THREE.MeshStandardMaterial({ color: '#3a1a9e', emissive: '#2a0c80', emissiveIntensity: 0.4, metalness: 0.1, roughness: 0.15, transparent: true, opacity: 0.42, depthWrite: false })
    : steel;
  const bezelMats = Array.from({ length: 7 }, (_, i) => new THREE.MeshStandardMaterial({
    map: bezelTexture(d, i), metalness: d.id === 'blacklight' ? 0.9 : 0.4, roughness: d.id === 'blacklight' ? 0.2 : 0.5,
  }));
  const glow = (hex: string, k = 1) => new THREE.MeshBasicMaterial({ color: col(hex).multiplyScalar(k), toneMapped: false });

  // ---------- helpers ----------
  const box = (w: number, h: number, dd: number, m: THREE.Material | THREE.Material[], x: number, y: number, z: number, parent: THREE.Object3D = scene) => {
    const mesh = new THREE.Mesh(new THREE.BoxGeometry(w, h, dd), m);
    mesh.position.set(x, y, z);
    parent.add(mesh);
    return mesh;
  };
  const led = (p: THREE.Vector3, hex: string, opts: Partial<Omit<LedSpec, 'p' | 'c'>> = {}) => {
    leds.push({ p, c: col(hex), s: opts.s ?? [0.012, 0.008, 0.006], rate: opts.rate ?? 0, phase: opts.phase ?? Math.random(), duty: opts.duty ?? 0.5, base: opts.base ?? 0.25, group: opts.group ?? '' });
  };
  const cable = (pts: THREE.Vector3[], hex: string, r = 0.009, opts: { pulse?: number; port?: number; speed?: number } = {}) => {
    const curve = new THREE.CatmullRomCurve3(pts, false, 'catmullrom', 0.35);
    const len = curve.getLength();
    const geo = new THREE.TubeGeometry(curve, Math.max(24, Math.round(len * 40)), r, 6, false);
    const c = col(hex);
    const mat = new THREE.MeshStandardMaterial({
      color: vector ? col(P.void) : c.clone().multiplyScalar(0.55),
      emissive: c, emissiveIntensity: vector ? 0.55 : d.id === 'blacklight' ? 1.25 : 0.32,
      roughness: 0.45, metalness: 0.1,
    });
    const pulse = { value: opts.pulse ?? 0 };
    const boost = { value: 0 };
    const uLen = { value: len };
    const uPhase = { value: Math.random() * 10 };
    const uSpeed = { value: opts.speed ?? 0.9 };
    mat.defines = { USE_UV: '' };
    mat.onBeforeCompile = (sh) => {
      Object.assign(sh.uniforms, { uTime, uPulse: pulse, uBoost: boost, uLen, uPhase, uSpeed });
      sh.fragmentShader = sh.fragmentShader
        .replace('#include <common>', '#include <common>\nuniform float uTime, uPulse, uBoost, uLen, uPhase, uSpeed;')
        .replace('#include <emissivemap_fragment>', `#include <emissivemap_fragment>
          float pp = fract(vUv.x * uLen * 0.35 - uTime * uSpeed + uPhase);
          float band = smoothstep(0.0, 0.05, pp) * (1.0 - smoothstep(0.05, 0.16, pp));
          totalEmissiveRadiance *= 1.0 + uBoost * 2.5;
          totalEmissiveRadiance += emissive * band * (uPulse * 3.0 + uBoost * 6.0);`);
    };
    const mesh = new THREE.Mesh(geo, mat);
    mesh.userData.vector = false;
    scene.add(mesh);
    cableMats.push({ mat, pulse, boost, port: opts.port });
    return mesh;
  };

  // ---------- floor slab ----------
  const fw = FLOOR.x1 - FLOOR.x0;
  const fd = FLOOR.z1 - FLOOR.z0;
  const fcx = (FLOOR.x0 + FLOOR.x1) / 2;
  const fcz = (FLOOR.z0 + FLOOR.z1) / 2;
  const ft = floorTextures(d);
  for (const t of [ft.map, ft.emissive, ft.rough]) t.repeat.set(fw / 2.4, fd / 2.4);
  const floorMat = new THREE.MeshStandardMaterial({
    map: ft.map, emissiveMap: ft.emissive, emissive: '#ffffff', emissiveIntensity: d.id === 'blacklight' ? 1.4 : 1.0,
    roughnessMap: ft.rough, roughness: 0.9, metalness: 0.1, // gloss comes from the Reflector; rough base kills point-light hotspots
    transparent: d.floorGloss > 0, opacity: 1 - d.floorGloss * 0.45,
  });
  const floor = new THREE.Mesh(new THREE.PlaneGeometry(fw, fd), floorMat);
  floor.rotation.x = -Math.PI / 2;
  floor.position.set(fcx, 0, fcz);
  floor.userData.vector = false;
  scene.add(floor);
  if (d.floorGloss > 0) {
    const refl = new Reflector(new THREE.PlaneGeometry(fw, fd), {
      textureWidth: 1024, textureHeight: 1024, color: d.id === 'blacklight' ? 0x8a78b8 : 0x7a8496, clipBias: 0.003,
    });
    refl.rotation.x = -Math.PI / 2;
    refl.position.set(fcx, -0.004, fcz);
    refl.userData.vector = false;
    scene.add(refl);
    disposables.push(refl);
  }
  if (vector) {
    // phosphor floor: tile grid lines instead of a texture
    const pts: number[] = [];
    for (let x = FLOOR.x0; x <= FLOOR.x1 + 1e-6; x += 0.6) pts.push(x, 0.002, FLOOR.z0, x, 0.002, FLOOR.z1);
    for (let z = FLOOR.z0; z <= FLOOR.z1 + 1e-6; z += 0.6) pts.push(FLOOR.x0, 0.002, z, FLOOR.x1, 0.002, z);
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.Float32BufferAttribute(pts, 3));
    scene.add(new THREE.LineSegments(g, new THREE.LineBasicMaterial({ color: col(P.primary).multiplyScalar(0.22) })));
    floor.visible = false;
  }
  const slab = box(fw, 0.28, fd, steelDark, fcx, -0.14, fcz);
  slab.userData.edge = 0.8;
  // glowing lip around the slab: the diorama sits on a "display plinth"
  const lip = glow(d.id === 'blacklight' ? P.accent : P.primary, vector ? 1.2 : 0.9);
  box(fw, 0.012, 0.012, lip, fcx, 0.0, FLOOR.z1).userData.vector = false;
  box(0.012, 0.012, fd, lip, FLOOR.x1, 0.0, fcz).userData.vector = false;

  // ---------- an open floor tile: cable trench glowing underneath ----------
  {
    const hx = -2.1;
    const hz = 0.3;
    const pit = new THREE.Mesh(new THREE.PlaneGeometry(0.6, 0.6), new THREE.MeshBasicMaterial({ color: col(P.void).multiplyScalar(0.4) }));
    pit.rotation.x = -Math.PI / 2;
    pit.position.set(hx, 0.003, hz);
    pit.userData.vector = false;
    scene.add(pit);
    for (const [a, b2] of [[-1, 1], [1, -1]] as const) box(0.6, 0.018, 0.012, trim, hx, 0.009, hz + a * 0.3, scene).userData.edge = 0.9 + b2 * 0;
    for (const a of [-1, 1]) box(0.012, 0.018, 0.6, trim, hx + a * 0.3, 0.009, hz, scene).userData.edge = 0.9;
    const tile = box(0.6, 0.03, 0.6, new THREE.MeshStandardMaterial({ map: ft.map, roughness: 0.6, metalness: 0.3 }), hx + 0.62, 0.2, hz - 0.05);
    tile.rotation.z = 0.62;
    tile.userData.edge = 0.8;
    for (let k = 0; k < 5; k++) {
      const z = hz - 0.22 + k * 0.11;
      cable([new THREE.Vector3(hx - 0.31, 0.006, z), new THREE.Vector3(hx, 0.008, z + 0.03 * Math.sin(k)), new THREE.Vector3(hx + 0.31, 0.006, z + 0.02)], d.cables[(k + 1) % d.cables.length], 0.014, { pulse: 0.9, speed: 0.6 });
    }
  }

  // ---------- UV-reactive floor tape marking the cold aisle (blacklight only) ----------
  if (d.id === 'blacklight') {
    const tape = glow(P.secondary, 1.1);
    for (const z of [-1.62, -0.55]) for (let x = -3.05; x < 0.0; x += 0.24) {
      const t = box(0.14, 0.002, 0.03, tape, x, 0.003, z);
      t.userData.vector = false;
    }
  }

  // ---------- walls (back wall has a window hole) ----------
  const win = { x0: 0.3, x1: 1.9, y0: 0.85, y1: 2.55 };
  const wz = FLOOR.z0 - 0.075;
  box(win.x0 - FLOOR.x0, WALL_H, 0.15, wallMat, (FLOOR.x0 + win.x0) / 2, WALL_H / 2, wz);
  box(FLOOR.x1 - win.x1, WALL_H, 0.15, wallMat, (win.x1 + FLOOR.x1) / 2, WALL_H / 2, wz);
  box(win.x1 - win.x0, win.y0, 0.15, wallMat, (win.x0 + win.x1) / 2, win.y0 / 2, wz);
  box(win.x1 - win.x0, WALL_H - win.y1, 0.15, wallMat, (win.x0 + win.x1) / 2, (win.y1 + WALL_H) / 2, wz);
  box(0.15, WALL_H, fd + 0.15, wallMat, FLOOR.x0 - 0.075, WALL_H / 2, fcz - 0.075);
  // wall-top trim catches the light and frames the cut-away
  box(fw + 0.15, 0.03, 0.17, trim, fcx - 0.075, WALL_H, wz);
  box(0.17, 0.03, fd + 0.15, trim, FLOOR.x0 - 0.075, WALL_H, fcz - 0.075);
  const cap = glow(d.id === 'blacklight' ? P.accent : P.primary, vector ? 1 : 0.32);
  box(fw + 0.16, 0.008, 0.008, cap, fcx - 0.075, WALL_H + 0.016, wz + 0.085).userData.vector = false;
  box(0.008, 0.008, fd + 0.16, cap, FLOOR.x0 + 0.01, WALL_H + 0.016, fcz - 0.075).userData.vector = false;
  box(0.008, WALL_H, 0.008, cap, FLOOR.x0 + 0.01, WALL_H / 2, FLOOR.z1 + 0.0).userData.vector = false;
  box(0.008, WALL_H, 0.008, cap, FLOOR.x1 + 0.0, WALL_H / 2, wz + 0.085).userData.vector = false;

  // ---------- window, blinds, the street outside ----------
  const winW = win.x1 - win.x0;
  const winH = win.y1 - win.y0;
  const wcx = (win.x0 + win.x1) / 2;
  const wcy = (win.y0 + win.y1) / 2;
  const frame = trim;
  box(winW + 0.08, 0.05, 0.2, frame, wcx, win.y0, wz);
  box(winW + 0.08, 0.05, 0.2, frame, wcx, win.y1, wz);
  box(0.05, winH, 0.2, frame, win.x0, wcy, wz);
  box(0.05, winH, 0.2, frame, win.x1, wcy, wz);
  box(0.035, winH, 0.12, frame, wcx, wcy, wz);
  const slats = new THREE.InstancedMesh(new THREE.BoxGeometry(winW - 0.06, 0.004, 0.05), vector ? glow(P.primary, 0.35) : new THREE.MeshStandardMaterial({ color: P.trim, metalness: 0.3, roughness: 0.5 }), 24);
  const m4 = new THREE.Matrix4();
  for (let i = 0; i < 24; i++) {
    const q = new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(1, 0, 0), -0.95);
    const y = win.y1 - 0.12 - i * 0.052;
    m4.compose(new THREE.Vector3(wcx, y, wz + 0.11), q, new THREE.Vector3(1, 1, 1));
    slats.setMatrixAt(i, m4);
    if (y < win.y0 + 0.75) slats.count = i; // blinds pulled up: bottom third open
  }
  slats.userData.vector = false;
  scene.add(slats);
  // outside: dark street, a building across, the sign
  const street = new THREE.Mesh(new THREE.PlaneGeometry(winW + 1.0, winH + 0.3), new THREE.MeshBasicMaterial({ color: col(P.void).lerp(col(P.accent), vector ? 0.0 : 0.07) }));
  street.position.set(wcx, wcy, FLOOR.z0 - 0.9);
  street.userData.vector = false;
  scene.add(street);
  const sign = new THREE.Mesh(new THREE.PlaneGeometry(1.5, 0.75), new THREE.MeshBasicMaterial({ map: neonSignTexture(d), transparent: true, toneMapped: false, color: new THREE.Color(1.6, 1.6, 1.6), depthWrite: false }));
  sign.position.set(wcx + 0.1, 1.45, FLOOR.z0 - 0.7);
  sign.userData.vector = false;
  scene.add(sign);
  {
    // distant windows of the building across the street
    const g = new THREE.BufferGeometry();
    const pts: number[] = [];
    const cols: number[] = [];
    const warm = col(P.secondary);
    const cool = col(P.primary);
    for (let i = 0; i < 90; i++) {
      pts.push(wcx - 1.3 + Math.random() * 2.6, win.y0 - 0.3 + Math.random() * (winH + 0.6), FLOOR.z0 - 0.85);
      const c = Math.random() < 0.6 ? warm : cool;
      const k = 0.25 + Math.random() * 0.6;
      cols.push(c.r * k, c.g * k, c.b * k);
    }
    g.setAttribute('position', new THREE.Float32BufferAttribute(pts, 3));
    g.setAttribute('color', new THREE.Float32BufferAttribute(cols, 3));
    const pm = new THREE.Points(g, new THREE.PointsMaterial({ size: 0.05, vertexColors: true, map: dotTexture(), transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, toneMapped: false }));
    pm.userData.vector = false;
    scene.add(pm);
  }
  if (!vector) {
    const rect = new THREE.RectAreaLight(d.light.windowColor, d.light.windowIntensity, winW, winH);
    rect.position.set(wcx, wcy, FLOOR.z0 + 0.25);
    rect.lookAt(wcx + 0.4, 0.4, 2);
    scene.add(rect);
    // fake volumetric shafts through the blinds
    const sTex = shaftTexture();
    const shaftMat = new THREE.MeshBasicMaterial({ map: sTex, color: col(d.light.windowColor).multiplyScalar(d.id === 'blacklight' ? 0.1 : 0.12), transparent: true, blending: THREE.AdditiveBlending, depthWrite: false, side: THREE.DoubleSide, toneMapped: false, fog: false });
    for (let i = 0; i < 9; i++) {
      const s = new THREE.Mesh(new THREE.PlaneGeometry(0.1 + Math.random() * 0.16, 3.2), shaftMat);
      s.position.set(win.x0 + 0.12 + i * 0.17, 1.25, FLOOR.z0 + 1.15);
      s.rotation.set(-0.95, 0, 0.12 - i * 0.03);
      s.userData.vector = false;
      scene.add(s);
    }
    // the stripe pattern the blinds throw on the floor
    const [c, g] = (() => { const c = document.createElement('canvas'); c.width = 256; c.height = 256; return [c, c.getContext('2d')!] as const; })();
    const rg = g.createRadialGradient(128, 128, 10, 128, 128, 128);
    rg.addColorStop(0, 'rgba(255,255,255,0.9)');
    rg.addColorStop(1, 'rgba(255,255,255,0)');
    g.fillStyle = rg;
    g.fillRect(0, 0, 256, 256);
    g.globalCompositeOperation = 'destination-out';
    for (let y = 0; y < 256; y += 22) { g.fillStyle = 'rgba(0,0,0,0.75)'; g.fillRect(0, y, 256, 9); }
    const pool = new THREE.Mesh(new THREE.PlaneGeometry(2.4, 2.2), new THREE.MeshBasicMaterial({ map: new THREE.CanvasTexture(c), color: col(d.light.windowColor).multiplyScalar(0.55), transparent: true, blending: THREE.AdditiveBlending, depthWrite: false, toneMapped: false }));
    pool.rotation.x = -Math.PI / 2;
    pool.position.set(wcx + 0.2, 0.004, FLOOR.z0 + 1.7);
    pool.userData.vector = false;
    scene.add(pool);
  }

  // ---------- racks ----------
  const rackX = [-2.65, -1.95, -1.25, -0.55];
  const rackZ = FLOOR.z0 + 0.2 + RACK_D / 2;
  const frontZ = rackZ + RACK_D / 2;
  const layouts: number[][] = [
    [2, 1, 1, 0, 2, 2, 1, 0, 4, 2, 2, 0, 1, 1, 2, 2, 0, 3, 2],
    [1, 1, 1, 0, 1, 1, 0, 2, 2, 2, 2, 0, 1, 2, 2, 0, 4, 2, 3],
    [2, 2, 0, 1, 1, 2, 2, 2, 0, 1, 4, 4, 0, 2, 2, 2, 3],
    [1, 0, 2, 2, 2, 2, 0, 1, 1, 4, 0, 2, 2, 2, 2, 0, 3, 2],
  ];
  rackX.forEach((rx, ri) => {
    const rack = new THREE.Group();
    rack.name = `rack:${ri}`;
    scene.add(rack);
    const mats: THREE.Material[] = [];
    // frame
    for (const sx of [-1, 1]) for (const sz of [-1, 1]) box(0.04, RACK_H, 0.04, steel, rx + sx * (RACK_W / 2 - 0.02), RACK_H / 2, rackZ + sz * (RACK_D / 2 - 0.02), rack);
    box(RACK_W, 0.05, RACK_D, steel, rx, RACK_H - 0.025, rackZ, rack);
    box(RACK_W, 0.08, RACK_D, steelDark, rx, 0.04, rackZ, rack);
    for (const sx of [-1, 1]) {
      const sp = box(0.015, RACK_H - 0.13, RACK_D - 0.08, sidePanel, rx + sx * (RACK_W / 2 - 0.008), RACK_H / 2, rackZ, rack);
      if (d.acrylic) sp.renderOrder = 2;
    }
    // mounting rails
    for (const sx of [-1, 1]) box(0.03, RACK_H - 0.14, 0.02, trim, rx + sx * 0.255, RACK_H / 2, frontZ - 0.06, rack);
    // devices
    let y = 0.1;
    layouts[ri].forEach((hu, di) => {
      const h = Math.max(1, hu) * U - 0.003;
      if (hu === 0) {
        box(0.48, U - 0.003, 0.02, steelDark, rx, y + U / 2, frontZ - 0.05, rack); // blanking panel
        y += U;
        return;
      }
      const variant = (ri * 3 + di) % 7;
      const faces = [steel, steel, steel, steel, bezelMats[variant], steel];
      box(0.48, h, 0.78, faces, rx, y + h / 2, frontZ - 0.44, rack);
      const fz = frontZ - 0.048;
      const isSwitch = hu === 1 && (di % 2 === 0);
      if (isSwitch) {
        for (let k = 0; k < 24; k++) {
          const lx = rx - 0.16 + k * 0.0125;
          led(new THREE.Vector3(lx, y + h * 0.72, fz), k % 5 === 0 ? P.secondary : P.primary, { s: [0.006, 0.004, 0.004], rate: 2 + Math.random() * 7, duty: 0.35, base: 0.15, group: `rack:${ri}` });
        }
        // short patch loops dropping to the device below
        if (di > 0) for (let k = 0; k < 4; k++) {
          const lx = rx - 0.15 + k * 0.05 + Math.random() * 0.02;
          cable([
            new THREE.Vector3(lx, y + h * 0.4, fz + 0.005),
            new THREE.Vector3(lx + 0.01, y - 0.03, fz + 0.07),
            new THREE.Vector3(lx + 0.02, y - U * 2.2, fz + 0.03),
            new THREE.Vector3(lx + 0.02, y - U * 2.5, fz - 0.01),
          ], d.cables[(k + ri) % d.cables.length], 0.0035, { pulse: 0.4, speed: 1.6 });
        }
      } else {
        led(new THREE.Vector3(rx - 0.215, y + h - 0.012, fz), P.primary, { rate: 0, base: 1, group: `rack:${ri}` });
        led(new THREE.Vector3(rx - 0.198, y + h - 0.012, fz), P.secondary, { rate: 3 + Math.random() * 9, duty: 0.3, base: 0.1, group: `rack:${ri}` });
        if (hu >= 2) for (let k = 0; k < 6; k++) led(new THREE.Vector3(rx + 0.02 + k * 0.03, y + 0.015, fz), k === 4 && Math.random() < 0.3 ? P.alert : P.primary, { s: [0.01, 0.003, 0.004], rate: 1 + Math.random() * 5, duty: 0.6, base: 0.2, group: `rack:${ri}` });
      }
      y += Math.max(1, hu) * U;
    });
    // rack crown: identity strip + label
    const stripMat = glow(P.primary, 0.9);
    mats.push(stripMat);
    const strip = box(RACK_W - 0.06, 0.012, 0.012, stripMat, rx, RACK_H - 0.06, frontZ + 0.002, rack);
    strip.userData.vector = false;
    const labelMat = new THREE.MeshBasicMaterial({ map: labelTexture(RACK_LABELS[ri], d), transparent: true, toneMapped: false, color: new THREE.Color(1.3, 1.3, 1.3), depthWrite: false });
    mats.push(labelMat);
    const label = new THREE.Mesh(new THREE.PlaneGeometry(0.56, 0.105), labelMat);
    label.position.set(rx, RACK_H + 0.09, frontZ - 0.02);
    label.userData.vector = false;
    rack.add(label);
    hoverables.set(`rack:${ri}`, mats);
    pickables.push({
      id: `rack:${ri}`, object: rack,
      focus: { pos: new THREE.Vector3(rx + 0.5, 1.25, frontZ + 1.6), target: new THREE.Vector3(rx, 1.05, frontZ), fov: 34 },
    });
    // cables rising from the rack top into the tray
    for (let k = 0; k < 5; k++) {
      const cx = rx - 0.15 + k * 0.075;
      cable([
        new THREE.Vector3(cx, RACK_H - 0.02, rackZ - 0.25),
        new THREE.Vector3(cx, RACK_H + 0.25, rackZ - 0.25 + (k % 2) * 0.05),
        new THREE.Vector3(cx + 0.02, TRAY_Y - 0.02, rackZ - 0.12),
      ], d.cables[(k + ri * 2) % d.cables.length], 0.01, { pulse: 0.5 });
    }
  });
  // hanging row sign
  {
    const s = new THREE.Mesh(new THREE.PlaneGeometry(0.7, 0.2), new THREE.MeshBasicMaterial({ map: signTexture(['ROW A', 'COLD AISLE'], d, d.id === 'blacklight' ? '#14062e' : P.primary, d.id === 'blacklight' ? '#d9dcf2' : '#000000'), toneMapped: false, color: new THREE.Color(1.1, 1.1, 1.1) }));
    s.position.set(-1.6, 2.92, frontZ + 0.55);
    s.userData.vector = false;
    s.layers.set(NO_REFLECT);
    scene.add(s);
    box(0.004, 0.3, 0.004, trim, -1.85, 3.15, frontZ + 0.55);
    box(0.004, 0.3, 0.004, trim, -1.35, 3.15, frontZ + 0.55);
  }

  // ---------- overhead ladder tray ----------
  const trayMat = vector ? steel : trim;
  const trayZ = rackZ - 0.12;
  box(4.0, 0.06, 0.02, trayMat, FLOOR.x0 + 2.0, TRAY_Y, trayZ - 0.18);
  box(4.0, 0.06, 0.02, trayMat, FLOOR.x0 + 2.0, TRAY_Y, trayZ + 0.18);
  for (let x = FLOOR.x0 + 0.2; x < 0.0; x += 0.3) box(0.02, 0.015, 0.36, trayMat, x, TRAY_Y - 0.02, trayZ);
  const trayX = FLOOR.x0 + 0.3;
  box(0.02, 0.06, 2.6, trayMat, trayX - 0.18, TRAY_Y, trayZ + 1.3);
  box(0.02, 0.06, 2.6, trayMat, trayX + 0.18, TRAY_Y, trayZ + 1.3);
  for (let z = trayZ + 0.2; z < trayZ + 2.6; z += 0.3) box(0.36, 0.015, 0.02, trayMat, trayX, TRAY_Y - 0.02, z);
  for (const x of [-3.0, -1.6, -0.2]) for (const dz of [-0.18, 0.18]) box(0.01, WALL_H - TRAY_Y, 0.01, trayMat, x, (WALL_H + TRAY_Y) / 2, trayZ + dz);
  // bundles lying in the tray
  for (let k = 0; k < 7; k++) {
    const off = -0.12 + k * 0.04;
    cable([
      new THREE.Vector3(-0.15, TRAY_Y + 0.01, trayZ + off),
      new THREE.Vector3(-2.0, TRAY_Y + 0.015, trayZ + off * 0.9),
      new THREE.Vector3(trayX + off * 0.5, TRAY_Y + 0.02, trayZ + 0.1),
      new THREE.Vector3(trayX + off, TRAY_Y + 0.015, trayZ + 1.4),
      new THREE.Vector3(trayX + off, TRAY_Y + 0.01, trayZ + 2.45),
    ], d.cables[k % d.cables.length], 0.012, { pulse: 0.6, speed: 0.7 + k * 0.08 });
  }

  // ---------- patch panel on the left wall: the links ----------
  const ppZ = -0.95;
  const ppY = 1.55;
  const ppX = FLOOR.x0 + 0.01;
  const pp = new THREE.Group();
  pp.name = 'patch';
  scene.add(pp);
  box(0.16, 0.42, 0.62, steelDark, ppX + 0.08, ppY, ppZ, pp);
  {
    const c = document.createElement('canvas');
    c.width = 620; c.height = 160;
    const g = c.getContext('2d')!;
    g.fillStyle = d.id === 'blacklight' ? '#c9cbe6' : '#0c1018';
    g.fillRect(0, 0, 620, 160);
    for (let r = 0; r < 2; r++) for (let i = 0; i < 12; i++) {
      const x = 28 + i * 48 + Math.floor(i / 6) * 8;
      const y2 = 34 + r * 66;
      g.fillStyle = '#000';
      g.fillRect(x, y2, 34, 28);
      g.fillStyle = d.id === 'blacklight' ? '#2b1666' : 'rgba(255,255,255,0.45)';
      g.font = `600 13px "${d.fonts.mono}", monospace`;
      g.fillText(String(r * 12 + i + 1).padStart(2, '0'), x + 8, y2 - 6);
    }
    const t = new THREE.CanvasTexture(c);
    t.colorSpace = THREE.SRGBColorSpace;
    const face = new THREE.Mesh(new THREE.PlaneGeometry(0.6, 0.155), new THREE.MeshStandardMaterial({ map: t, roughness: 0.6, metalness: 0.3 }));
    face.rotation.y = Math.PI / 2;
    face.position.set(ppX + 0.165, ppY + 0.09, ppZ);
    pp.add(face);
    const face2 = face.clone();
    face2.position.y = ppY - 0.09;
    pp.add(face2);
  }
  const portPos = (row: number, i: number) => new THREE.Vector3(ppX + 0.17, ppY + 0.09 - (row ? 0.18 : 0) + 0.028 - 0.062 + 0.04, ppZ + 0.3 - (28 + i * 48 + Math.floor(i / 6) * 8 + 17) / 620 * 0.6);
  for (let r = 0; r < 2; r++) for (let i = 0; i < 12; i++) {
    const p = portPos(r, i);
    led(new THREE.Vector3(p.x + 0.002, p.y + 0.035, p.z), r === 0 && i < 6 ? P.primary : P.trim, { s: [0.004, 0.005, 0.008], rate: r === 0 && i < 6 ? 0 : 4, base: r === 0 && i < 6 ? 0.9 : 0.06, group: r === 0 && i < 6 ? `port:${i}` : '' });
  }
  PORT_LABELS.forEach((_, i) => {
    const p = portPos(0, i);
    const tray = new THREE.Vector3(trayX - 0.1 + i * 0.04, TRAY_Y + 0.02, trayZ + 2.1 - i * 0.12);
    cable([
      p,
      new THREE.Vector3(p.x + 0.09, p.y - 0.08 - i * 0.015, p.z),
      new THREE.Vector3(p.x + 0.16, p.y + 0.25, p.z + 0.05),
      new THREE.Vector3(p.x + 0.12, TRAY_Y - 0.25, (p.z + tray.z) / 2),
      tray,
    ], d.cables[i % d.cables.length], 0.0065, { pulse: 0.15, port: i, speed: 1.4 });
    // invisible, generous hit target per port
    const hit = new THREE.Mesh(new THREE.BoxGeometry(0.03, 0.07, 0.042), new THREE.MeshBasicMaterial({ visible: false }));
    hit.position.copy(p);
    hit.userData.vector = false;
    pp.add(hit);
    pickables.push({ id: `port:${i}`, object: hit, focus: { pos: new THREE.Vector3(p.x + 1.4, p.y + 0.15, p.z + 0.4), target: p.clone(), fov: 30 } });
  });
  const ppLabel = new THREE.Mesh(new THREE.PlaneGeometry(0.6, 0.11), new THREE.MeshBasicMaterial({ map: labelTexture('PATCH · LINKS', d), transparent: true, toneMapped: false, depthWrite: false }));
  ppLabel.rotation.y = Math.PI / 2;
  ppLabel.position.set(ppX + 0.02, ppY + 0.31, ppZ);
  ppLabel.userData.vector = false;
  scene.add(ppLabel);

  // ---------- locked door + access terminal (the /apps vault) ----------
  const doorZ = 0.95;
  box(0.06, 2.15, 1.0, steel, FLOOR.x0 + 0.03, 1.075, doorZ).userData.edge = 0.7;
  box(0.07, 0.04, 1.06, trim, FLOOR.x0 + 0.03, 2.17, doorZ);
  box(0.03, 0.03, 0.6, chrome, FLOOR.x0 + 0.08, 1.05, doorZ);
  {
    const wm = new THREE.Mesh(new THREE.PlaneGeometry(0.26, 0.38), new THREE.MeshBasicMaterial({ color: col(P.void).lerp(col(P.alert), 0.12) }));
    wm.rotation.y = Math.PI / 2;
    wm.position.set(FLOOR.x0 + 0.065, 1.6, doorZ + 0.22);
    scene.add(wm);
    const sg = new THREE.Mesh(new THREE.PlaneGeometry(0.44, 0.22), new THREE.MeshBasicMaterial({ map: signTexture(['RESTRICTED', 'authorized only'], d, '#140305', d.palette.alert), toneMapped: false }));
    sg.rotation.y = Math.PI / 2;
    sg.position.set(FLOOR.x0 + 0.065, 1.55, doorZ - 0.15);
    sg.userData.vector = false;
    scene.add(sg);
  }
  const beaconMat = glow(P.alert, 1.4);
  const beacon = new THREE.Mesh(new THREE.CylinderGeometry(0.045, 0.05, 0.08, 16), beaconMat);
  beacon.position.set(FLOOR.x0 + 0.09, 2.3, doorZ);
  beacon.userData.vector = false;
  scene.add(beacon);
  const beaconLight = new THREE.PointLight(P.alert, vector ? 0 : 1.6, 2.6, 2);
  beaconLight.position.set(FLOOR.x0 + 0.3, 2.2, doorZ);
  scene.add(beaconLight);
  const term = new THREE.Group();
  term.name = 'locked';
  scene.add(term);
  box(0.08, 0.34, 0.26, steelDark, FLOOR.x0 + 0.04, 1.32, 0.05, term);
  const denied = new THREE.Mesh(new THREE.PlaneGeometry(0.2, 0.15), new THREE.MeshBasicMaterial({ map: deniedTexture(d), toneMapped: false, color: new THREE.Color(1.3, 1.3, 1.3) }));
  denied.rotation.y = Math.PI / 2;
  denied.position.set(FLOOR.x0 + 0.082, 1.38, 0.05);
  denied.userData.vector = false;
  term.add(denied);
  for (let r = 0; r < 3; r++) for (let c = 0; c < 3; c++) box(0.01, 0.02, 0.03, chrome, FLOOR.x0 + 0.085, 1.27 - r * 0.028, 0.01 + c * 0.04, term).userData.vector = false;
  pickables.push({ id: 'locked', object: term, focus: { pos: new THREE.Vector3(FLOOR.x0 + 1.3, 1.45, 0.35), target: new THREE.Vector3(FLOOR.x0 + 0.08, 1.36, 0.05), fov: 28 } });
  hoverables.set('locked', [denied.material as THREE.Material]);

  // ---------- crash cart with the console CRT ----------
  const cart = new THREE.Group();
  cart.name = 'console';
  cart.position.set(0.55, 0, 0.15);
  cart.rotation.y = 0.55;
  cart.scale.setScalar(1.2);
  scene.add(cart);
  for (const sx of [-1, 1]) for (const sz of [-1, 1]) {
    box(0.025, 0.95, 0.025, chrome, sx * 0.27, 0.53, sz * 0.21, cart);
    const w = new THREE.Mesh(new THREE.CylinderGeometry(0.035, 0.035, 0.025, 14), steelDark);
    w.rotation.z = Math.PI / 2;
    w.position.set(sx * 0.27, 0.035, sz * 0.21);
    cart.add(w);
  }
  box(0.6, 0.025, 0.47, steel, 0, 0.3, 0, cart);
  box(0.6, 0.025, 0.47, steel, 0, 0.93, 0, cart);
  box(0.62, 0.02, 0.02, chrome, 0, 1.0, -0.26, cart);
  // CRT
  const crtBody = d.id === 'blacklight' ? new THREE.MeshStandardMaterial({ color: '#1a9c92', transparent: true, opacity: 0.72, emissive: '#06403c', emissiveIntensity: 0.2, roughness: 0.2, metalness: 0.3 }) : new THREE.MeshStandardMaterial({ color: d.id === 'noir' ? '#2a2f3a' : P.steel, roughness: 0.55, metalness: 0.15 });
  box(0.46, 0.38, 0.06, crtBody, 0, 1.135, 0.05, cart);
  box(0.4, 0.33, 0.28, crtBody, 0, 1.125, -0.12, cart);
  box(0.28, 0.24, 0.12, crtBody, 0, 1.13, -0.3, cart);
  box(0.16, 0.03, 0.14, crtBody, 0, 0.96, -0.08, cart);
  const scrGeo = new THREE.PlaneGeometry(0.37, 0.28, 20, 16);
  {
    const pos = scrGeo.attributes.position;
    for (let i = 0; i < pos.count; i++) {
      const x = pos.getX(i) / 0.185;
      const yy = pos.getY(i) / 0.14;
      pos.setZ(i, 0.016 * (1 - 0.5 * (x * x + yy * yy)));
    }
    scrGeo.computeVertexNormals();
  }
  const scrTex = consoleTexture(d);
  const sb = d.id === 'blacklight' ? 0.62 : 1.25;
  const screen = new THREE.Mesh(scrGeo, new THREE.MeshBasicMaterial({ map: scrTex, toneMapped: false, color: new THREE.Color(sb, sb, sb) }));
  screen.position.set(0, 1.14, 0.082);
  screen.userData.vector = false;
  cart.add(screen);
  // keyboard
  {
    const kb = box(0.44, 0.02, 0.15, steelDark, 0, 0.955, 0.14, cart);
    kb.rotation.x = 0.06;
    for (let r = 0; r < 4; r++) for (let c = 0; c < 14; c++) box(0.024, 0.008, 0.024, d.id === 'blacklight' ? chrome : steel, -0.195 + c * 0.03, 0.97, 0.085 + r * 0.03, cart).userData.vector = false;
  }
  const screenLight = new THREE.PointLight(P.screen, vector ? 0 : d.id === 'blacklight' ? 0.5 : 1.4, 2.2, 2);
  screenLight.position.set(0, 1.15, 0.35);
  cart.add(screenLight);
  const consoleMats: THREE.Material[] = [screen.material as THREE.Material];
  hoverables.set('console', consoleMats);
  {
    const sw = new THREE.Vector3(0, 1.14, 0.09).applyMatrix4(cart.matrixWorld.compose(cart.position, cart.quaternion, cart.scale));
    const n = new THREE.Vector3(0, 0, 1).applyQuaternion(cart.quaternion);
    pickables.push({ id: 'console', object: cart, focus: { pos: sw.clone().addScaledVector(n, 0.32), target: sw, fov: 40 } });
  }
  // a console cable trailing across the floor to rack 4
  cable([
    new THREE.Vector3(0.3, 0.95, -0.12),
    new THREE.Vector3(0.15, 0.4, -0.25),
    new THREE.Vector3(0.05, 0.012, -0.5),
    new THREE.Vector3(-0.2, 0.012, -1.0),
    new THREE.Vector3(-0.45, 0.012, frontZ + 0.15),
    new THREE.Vector3(-0.5, 0.25, frontZ - 0.03),
  ], P.secondary, 0.006, { pulse: 0.5, speed: 1.1 });

  // ---------- CRAC unit in the corner ----------
  {
    const crac = new THREE.Group();
    scene.add(crac);
    const body = d.id === 'blacklight' ? chrome : new THREE.MeshStandardMaterial({ color: col(P.wall).lerp(new THREE.Color('#ffffff'), 0.06), roughness: 0.7, metalness: 0.2 });
    box(0.75, 2.1, 0.8, body, 2.5, 1.05, FLOOR.z0 + 0.42, crac);
    for (let i = 0; i < 14; i++) box(0.62, 0.012, 0.02, steelDark, 2.5, 0.25 + i * 0.05, FLOOR.z0 + 0.83, crac);
    const lcd = new THREE.Mesh(new THREE.PlaneGeometry(0.16, 0.07), new THREE.MeshBasicMaterial({ map: signTexture(['18.4°C', 'RH 45%'], d, P.primary, '#000'), toneMapped: false }));
    lcd.position.set(2.5, 1.55, FLOOR.z0 + 0.822);
    lcd.userData.vector = false;
    crac.add(lcd);
  }

  // ---------- fire extinguisher, wall clock: scale cues ----------
  {
    const ext = new THREE.Mesh(new THREE.CylinderGeometry(0.07, 0.07, 0.5, 18), new THREE.MeshStandardMaterial({ color: vector ? P.void : '#c8102e', roughness: 0.35, metalness: 0.3 }));
    ext.position.set(FLOOR.x0 + 0.12, 0.25, 1.62);
    scene.add(ext);
    const clock = new THREE.Mesh(new THREE.PlaneGeometry(0.5, 0.16), new THREE.MeshBasicMaterial({ map: signTexture(['03:14:07', 'UTC-5 · NYC'], d, P.alert, '#060203'), toneMapped: false, color: new THREE.Color(1.2, 1.2, 1.2) }));
    clock.position.set(wcx, 2.78, FLOOR.z0 + 0.005);
    clock.userData.vector = false;
    scene.add(clock);
  }

  // ---------- ceiling fixture ----------
  const tubeColor = d.id === 'blacklight' ? '#9b5cff' : d.id === 'noir' ? '#9fc4ff' : P.primary;
  const tubeMat = glow(tubeColor, d.id === 'noir' ? 0.75 : 1.4);
  const fixture = new THREE.Mesh(new THREE.CylinderGeometry(0.018, 0.018, 1.6, 10), tubeMat);
  fixture.rotation.z = Math.PI / 2;
  fixture.position.set(-1.6, 2.86, -0.7);
  fixture.userData.vector = false;
  fixture.layers.set(NO_REFLECT);
  scene.add(fixture);
  box(1.7, 0.03, 0.09, steelDark, -1.6, 2.9, -0.7);
  if (!vector) {
    const spot = new THREE.SpotLight(tubeColor, d.id === 'blacklight' ? 6 : 3.5, 6, 1.15, 1.0, 1.4);
    spot.position.set(-1.6, 2.8, -0.7);
    spot.target.position.set(-1.6, 0, -1.2);
    scene.add(spot, spot.target);
    const coldAisle = new THREE.PointLight(d.light.fillColor, d.light.fill * 0.3, 3.0, 1.5);
    coldAisle.position.set(-1.6, 0.9, -1.25);
    scene.add(coldAisle);
    scene.add(new THREE.AmbientLight(P.void === '#04060b' ? '#1a2440' : d.light.hemiSky, d.light.ambient));
    scene.add(new THREE.HemisphereLight(d.light.hemiSky, d.light.hemiGround, d.light.hemi));
  }

  // ---------- LEDs (one instanced mesh, blinking in the shader) ----------
  const ledGeo = new THREE.BoxGeometry(1, 1, 1);
  const ledCount = leds.length;
  const aBlink = new Float32Array(ledCount * 4);
  const aGroup = new Float32Array(ledCount);
  const groups = ['', ...pickables.map((p) => p.id)];
  const ledMat = new THREE.ShaderMaterial({
    uniforms: { uTime, uHover: { value: -1 }, uFire: { value: -1 }, uFireT: { value: 0 } },
    vertexShader: /* glsl */ `
      attribute vec4 aBlink; attribute float aGroup;
      uniform float uTime, uHover, uFire, uFireT;
      varying vec3 vColor;
      void main() {
        float on = aBlink.x == 0.0 ? 1.0 : step(fract(uTime * aBlink.x + aBlink.y), aBlink.z);
        float k = mix(aBlink.w, 1.0, on);
        if (abs(aGroup - uHover) < 0.5) k *= 1.8;
        if (abs(aGroup - uFire) < 0.5) k += 3.0 * exp(-uFireT * 2.5) * step(0.5, fract(uFireT * 6.0));
        vColor = instanceColor * k * 2.2;
        gl_Position = projectionMatrix * modelViewMatrix * instanceMatrix * vec4(position, 1.0);
      }`,
    fragmentShader: /* glsl */ `
      varying vec3 vColor;
      void main() { gl_FragColor = vec4(vColor, 1.0); }`,
    toneMapped: false,
  });
  const ledMesh = new THREE.InstancedMesh(ledGeo, ledMat, ledCount);
  leds.forEach((l, i) => {
    m4.compose(l.p, new THREE.Quaternion(), new THREE.Vector3(...l.s));
    ledMesh.setMatrixAt(i, m4);
    ledMesh.setColorAt(i, l.c);
    aBlink.set([l.rate, l.phase, l.duty, l.base], i * 4);
    aGroup[i] = groups.indexOf(l.group);
  });
  ledGeo.setAttribute('aBlink', new THREE.InstancedBufferAttribute(aBlink, 4));
  ledGeo.setAttribute('aGroup', new THREE.InstancedBufferAttribute(aGroup, 1));
  ledMesh.frustumCulled = false;
  ledMesh.userData.vector = false;
  scene.add(ledMesh);

  // ---------- dust in the air ----------
  const dustN = 520;
  const dustGeo = new THREE.BufferGeometry();
  const dp = new Float32Array(dustN * 3);
  for (let i = 0; i < dustN; i++) dp.set([FLOOR.x0 + Math.random() * fw, Math.random() * 2.9, FLOOR.z0 + Math.random() * fd], i * 3);
  dustGeo.setAttribute('position', new THREE.BufferAttribute(dp, 3));
  const dust = new THREE.Points(dustGeo, new THREE.PointsMaterial({ size: 0.018, map: dotTexture(), color: col(vector ? P.primary : d.light.windowColor).multiplyScalar(vector ? 0.5 : 0.8), transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, toneMapped: false }));
  dust.userData.vector = false;
  scene.add(dust);

  // ---------- vector (phosphor) conversion ----------
  if (vector) {
    const fill = new THREE.MeshBasicMaterial({ color: P.void, polygonOffset: true, polygonOffsetFactor: 1, polygonOffsetUnits: 1 });
    const lineMats = new Map<number, THREE.LineBasicMaterial>();
    const lineMat = (k: number) => {
      const key = Math.round(k * 100);
      if (!lineMats.has(key)) lineMats.set(key, new THREE.LineBasicMaterial({ color: col(P.primary).multiplyScalar(k) }));
      return lineMats.get(key)!;
    };
    const meshes: THREE.Mesh[] = [];
    scene.traverse((o) => { if ((o as THREE.Mesh).isMesh && o.userData.vector !== false && !(o as THREE.InstancedMesh).isInstancedMesh) meshes.push(o as THREE.Mesh); });
    for (const m of meshes) {
      const e = new THREE.LineSegments(new THREE.EdgesGeometry(m.geometry, 30), lineMat(m.userData.edge ?? 0.55));
      m.add(e);
      m.material = fill;
    }
  }

  // ---------- runtime ----------
  let fireT = 99;
  const update = (t: number, dt: number) => {
    uTime.value = t;
    fireT += dt;
    ledMat.uniforms.uFireT.value = fireT;
    for (const c of cableMats) if (c.port !== undefined) c.boost.value = ledMat.uniforms.uFire.value === groups.indexOf(`port:${c.port}`) ? Math.max(0, 1 - fireT * 0.35) : 0;
    const pos = dustGeo.attributes.position as THREE.BufferAttribute;
    for (let i = 0; i < dustN; i++) {
      let yy = pos.getY(i) + dt * 0.03 * (0.5 + (i % 7) / 7);
      if (yy > 2.9) yy = 0;
      pos.setY(i, yy);
      pos.setX(i, pos.getX(i) + Math.sin(t * 0.3 + i) * dt * 0.01);
    }
    pos.needsUpdate = true;
    const b = 0.55 + 0.45 * Math.max(0, Math.sin(t * 3.2));
    beaconMat.color.copy(col(P.alert)).multiplyScalar(0.4 + b * 1.4);
    beaconLight.intensity = vector ? 0 : 0.4 + b * 1.6;
    if (d.id === 'noir') tubeMat.color.copy(col(tubeColor)).multiplyScalar(Math.sin(t * 37) > 0.97 ? 0.15 : 0.75);
  };
  const setHover = (id: string | null) => {
    ledMat.uniforms.uHover.value = id ? groups.indexOf(id) : -1;
    hoverables.forEach((mats, key) => mats.forEach((m) => {
      const mm = m as THREE.MeshBasicMaterial;
      if (!mm.userData.base) mm.userData.base = mm.color.clone();
      mm.color.copy(mm.userData.base as THREE.Color).multiplyScalar(key === id ? 1.9 : 1);
    }));
  };
  const firePort = (i: number) => {
    ledMat.uniforms.uFire.value = groups.indexOf(`port:${i}`);
    fireT = 0;
  };
  const dispose = () => {
    scene.traverse((o) => {
      const m = o as THREE.Mesh;
      m.geometry?.dispose();
      const mat = m.material as THREE.Material | THREE.Material[] | undefined;
      (Array.isArray(mat) ? mat : mat ? [mat] : []).forEach((x) => x.dispose());
    });
    disposables.forEach((x) => x.dispose());
  };
  return { scene, pickables, update, setHover, firePort, screen, dispose };
}
