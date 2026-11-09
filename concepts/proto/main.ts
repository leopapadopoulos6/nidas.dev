// Prototype viewer: renders one direction of the Server Room. Used for the concept-board stills
// (?still=1) and as a live motion sketch (camera focus, port pulse, console dive).
import * as THREE from 'three';
import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/examples/jsm/postprocessing/UnrealBloomPass.js';
import { OutputPass } from 'three/examples/jsm/postprocessing/OutputPass.js';
import { ShaderPass } from 'three/examples/jsm/postprocessing/ShaderPass.js';
import { DIRECTIONS, type DirectionId } from './directions';
import { buildServerRoom, NO_REFLECT, PORT_LABELS, RACK_LABELS, type Pickable } from './scene';
import '../fonts';
import './proto.css';

const qs = new URLSearchParams(location.search);
const dirId = (qs.get('d') ?? 'noir') as DirectionId;
const d = DIRECTIONS[dirId] ?? DIRECTIONS.noir;
if (qs.has('gloss')) d.floorGloss = Number(qs.get('gloss'));
const still = qs.has('still');
const camName = qs.get('cam') ?? 'hero';
const calm = qs.has('calm') || matchMedia('(prefers-reduced-motion: reduce)').matches;

document.documentElement.dataset.dir = d.id;
document.title = `${d.name} · Server Room prototype`;

const CAMS: Record<string, { pos: THREE.Vector3; target: THREE.Vector3; fov: number }> = {
  hero: { pos: new THREE.Vector3(6.4, 4.9, 6.9), target: new THREE.Vector3(-0.45, 0.85, -0.65), fov: 30 },
  wide: { pos: new THREE.Vector3(6.2, 4.4, 7.0), target: new THREE.Vector3(-0.6, 0.9, -0.6), fov: 33 },
  mobile: { pos: new THREE.Vector3(2.2, 3.4, 7.8), target: new THREE.Vector3(-0.9, 1.0, -0.9), fov: 46 },
  aisle: { pos: new THREE.Vector3(0.6, 1.45, 1.5), target: new THREE.Vector3(-1.9, 1.15, -1.8), fov: 40 },
};

async function main() {
  await Promise.all([
    document.fonts.load(`700 40px "${d.fonts.display}"`),
    document.fonts.load(`500 20px "${d.fonts.mono}"`),
  ]);

  const canvas = document.querySelector<HTMLCanvasElement>('#gl')!;
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, powerPreference: 'high-performance' });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = d.light.exposure;

  const room = buildServerRoom(d, renderer);
  const narrow = window.innerWidth / window.innerHeight < 0.9;
  const base = CAMS[narrow && camName === 'hero' ? 'mobile' : camName] ?? CAMS.hero;
  const v3 = (k: string, f: THREE.Vector3) => (qs.get(k) ? new THREE.Vector3(...qs.get(k)!.split(',').map(Number)) : f);
  const start = { pos: v3('cp', base.pos), target: v3('ct', base.target), fov: Number(qs.get('fov') ?? base.fov) };
  const camera = new THREE.PerspectiveCamera(start.fov, window.innerWidth / window.innerHeight, 0.05, 60);
  if (camName === 'console') {
    const f = room.pickables.find((p) => p.id === 'console')!.focus;
    start.target.copy(f.target);
    start.pos.copy(f.target).addScaledVector(f.pos.clone().sub(f.target), 4.2).add(new THREE.Vector3(0.25, 0.35, 0));
    start.fov = 34;
  }
  const home = { pos: start.pos.clone(), target: start.target.clone(), fov: start.fov };
  const cam = { pos: home.pos.clone(), target: home.target.clone(), fov: home.fov };
  camera.layers.enable(NO_REFLECT);
  camera.position.copy(cam.pos);
  camera.lookAt(cam.target);

  const composer = new EffectComposer(renderer, new THREE.WebGLRenderTarget(1, 1, { type: THREE.HalfFloatType, samples: 4 }));
  composer.setPixelRatio(renderer.getPixelRatio());
  composer.setSize(window.innerWidth, window.innerHeight);
  composer.addPass(new RenderPass(room.scene, camera));
  const bloom = new UnrealBloomPass(new THREE.Vector2(window.innerWidth, window.innerHeight), d.bloom.strength, d.bloom.radius, d.bloom.threshold);
  composer.addPass(bloom);
  composer.addPass(new OutputPass());
  const grade = new ShaderPass({
    uniforms: {
      tDiffuse: { value: null },
      uTime: { value: 0 },
      uVignette: { value: d.grade.vignette },
      uGrain: { value: d.grade.grain },
      uAberration: { value: d.grade.aberration },
      uScan: { value: d.grade.scanlines },
      uBarrel: { value: d.grade.barrel },
      uTint: { value: new THREE.Vector3(...d.grade.tint) },
      uDive: { value: 0 },
    },
    vertexShader: /* glsl */ `varying vec2 vUv; void main() { vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }`,
    fragmentShader: /* glsl */ `
      uniform sampler2D tDiffuse; uniform float uTime, uVignette, uGrain, uAberration, uScan, uBarrel, uDive; uniform vec3 uTint;
      varying vec2 vUv;
      float hash(vec2 p) { return fract(sin(dot(p, vec2(12.9898, 78.233))) * 43758.5453); }
      void main() {
        vec2 c = vUv - 0.5;
        float barrel = uBarrel + uDive * 0.25;
        vec2 uv = 0.5 + c * (1.0 + barrel * dot(c, c) * 2.0) / (1.0 + barrel * 0.5);
        if (uv.x < 0.0 || uv.x > 1.0 || uv.y < 0.0 || uv.y > 1.0) { gl_FragColor = vec4(0.0, 0.0, 0.0, 1.0); return; }
        vec2 off = c * (uAberration + uDive * 0.01);
        vec3 col = vec3(texture2D(tDiffuse, uv + off).r, texture2D(tDiffuse, uv).g, texture2D(tDiffuse, uv - off).b) * uTint;
        col *= 1.0 - uScan * (0.5 + 0.5 * sin(gl_FragCoord.y * 2.0944));
        float v = smoothstep(0.95, 0.25, length(c) * 1.3);
        col *= mix(1.0, v, uVignette);
        col += (hash(gl_FragCoord.xy + fract(uTime) * 100.0) - 0.5) * uGrain;
        gl_FragColor = vec4(col, 1.0);
      }`,
  });
  composer.addPass(grade);

  const resize = () => {
    const w = window.innerWidth;
    const h = window.innerHeight;
    renderer.setSize(w, h);
    composer.setSize(w, h);
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
  };
  window.addEventListener('resize', resize);

  if (still) {
    // deterministic frame for the concept board
    document.documentElement.classList.add('still');
    const t = Number(qs.get('t') ?? 7.3);
    room.update(t, 0.016);
    if (qs.has('fire')) { room.firePort(Number(qs.get('fire'))); room.update(t + 0.02, 0.02); }
    grade.uniforms.uTime.value = t;
    composer.render();
    composer.render();
    (window as unknown as { __ready: boolean }).__ready = true;
    return;
  }

  // ---------- live motion sketch ----------
  const ray = new THREE.Raycaster();
  const ndc = new THREE.Vector2(9, 9);
  const parallax = new THREE.Vector2();
  let hovered: Pickable | null = null;
  let focused: Pickable | null = null;
  let tween: { from: typeof cam; to: typeof cam; t: number; dur: number; done?: () => void } | null = null;
  const ease = (x: number) => (x < 0.5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2);
  const go = (to: typeof cam, dur = 1.4, done?: () => void) => {
    tween = { from: { pos: cam.pos.clone(), target: cam.target.clone(), fov: cam.fov }, to, t: 0, dur, done };
  };

  const hud = document.querySelector<HTMLElement>('#hud')!;
  const panel = document.querySelector<HTMLElement>('#panel')!;
  const overlay = document.querySelector<HTMLElement>('#overlay')!;
  const hint = document.querySelector<HTMLElement>('#hint')!;
  hud.querySelector('.name')!.textContent = d.name;

  const pickRoot = (o: THREE.Object3D | null): Pickable | null => {
    while (o) {
      const p = room.pickables.find((pp) => pp.object === o);
      if (p) return p;
      o = o.parent;
    }
    return null;
  };
  canvas.addEventListener('pointermove', (e) => {
    ndc.set((e.clientX / window.innerWidth) * 2 - 1, -(e.clientY / window.innerHeight) * 2 + 1);
    parallax.copy(ndc);
  });
  const back = () => {
    focused = null;
    panel.hidden = true;
    overlay.hidden = true;
    overlay.classList.remove('on');
    grade.uniforms.uDive.value = 0;
    go(home, 1.2);
  };
  document.querySelector('#back')!.addEventListener('click', back);
  window.addEventListener('keydown', (e) => { if (e.key === 'Escape') back(); });
  overlay.addEventListener('click', (e) => { if ((e.target as HTMLElement).dataset.close !== undefined) back(); });

  const typeInto = (el: HTMLElement, lines: string[]) => {
    el.textContent = '';
    let i = 0;
    const tick = () => {
      if (overlay.hidden) return;
      const all = lines.join('\n');
      el.textContent = all.slice(0, i) + (i < all.length ? '█' : '\n> _');
      i += 3;
      if (i <= all.length + 3) setTimeout(tick, 16);
    };
    tick();
  };

  const pickAt = (cx: number, cy: number): Pickable | null => {
    ray.setFromCamera(new THREE.Vector2((cx / window.innerWidth) * 2 - 1, -(cy / window.innerHeight) * 2 + 1), camera);
    const hits = ray.intersectObjects(room.pickables.map((pp) => pp.object), true);
    return hits.length ? pickRoot(hits[0].object) : null;
  };
  canvas.addEventListener('click', (e) => {
    // raycast at the click itself: touch taps never produce a hover
    const p = pickAt(e.clientX, e.clientY);
    if (!p || tween) return;
    if (p.id.startsWith('port:')) {
      const i = Number(p.id.split(':')[1]);
      room.firePort(i);
      showPanel(`PORT ${String(i + 1).padStart(2, '0')} · ${PORT_LABELS[i]}`, 'Link lit. In the shell this opens the destination (GitHub, LinkedIn, mail, résumé PDF…).');
      return;
    }
    focused = p;
    hint.hidden = true;
    panel.hidden = true;
    if (p.id === 'console') {
      // dive: approach the screen, then push through it into the 2D interface
      go(p.focus, 1.3, () => {
        const into = { pos: p.focus.target.clone().lerp(p.focus.pos, 0.08), target: p.focus.target.clone(), fov: 20 };
        go(into, 0.7, () => {
          overlay.hidden = false;
          requestAnimationFrame(() => overlay.classList.add('on'));
          typeInto(overlay.querySelector('pre')!, [
            'NIDAS-BIOS 2.0 ............ OK',
            'mounting /home/leo ........ OK',
            '',
            '$ whoami',
            'Leo Papadopoulos · network engineer · NYC',
            '',
            '$ ls ~/',
            'about.txt   experience/   education/   skills.cfg   resume.pdf',
          ]);
        });
      });
      return;
    }
    go(p.focus, 1.4, () => {
      if (p.id === 'locked') showPanel('/apps · ACCESS DENIED', 'Private dashboards live behind this door later. No auth yet.', true);
      else showPanel(RACK_LABELS[Number(p.id.split(':')[1])], 'Section rack. In the shell, a detail panel slides in here with this section\'s content.');
    });
  });
  const showPanel = (title: string, body: string, alert = false) => {
    panel.hidden = false;
    panel.classList.toggle('alert', alert);
    panel.querySelector('h2')!.textContent = title;
    panel.querySelector('p')!.textContent = body;
  };

  if (qs.has('debug')) {
    // test hook: project a pickable's focus target to client pixels
    (window as unknown as { __where: (id: string) => number[] }).__where = (id: string) => {
      const p = room.pickables.find((pp) => pp.id === id)!;
      const v = (p.object.type === 'Mesh' ? p.object.getWorldPosition(new THREE.Vector3()) : p.focus.target.clone()).project(camera);
      return [((v.x + 1) / 2) * window.innerWidth, ((1 - v.y) / 2) * window.innerHeight];
    };
    (window as unknown as { __pick: (x: number, y: number) => string | null }).__pick = (x, y) => pickAt(x, y)?.id ?? null;
    (window as unknown as { __busy: () => boolean }).__busy = () => tween !== null;
  }
  const clock = new THREE.Clock();
  const tick = () => {
    const dt = Math.min(clock.getDelta(), 0.05);
    const t = clock.elapsedTime;
    room.update(t, dt);
    grade.uniforms.uTime.value = t;
    if (tween) {
      tween.t = Math.min(1, tween.t + dt / tween.dur);
      const k = ease(tween.t);
      cam.pos.lerpVectors(tween.from.pos, tween.to.pos, k);
      cam.target.lerpVectors(tween.from.target, tween.to.target, k);
      cam.fov = THREE.MathUtils.lerp(tween.from.fov, tween.to.fov, k);
      if (focused?.id === 'console') grade.uniforms.uDive.value = Math.max(0, k * 2 - 1);
      if (tween.t >= 1) { const done = tween.done; tween = null; done?.(); }
    }
    const idle = calm ? 0 : focused ? 0.04 : 1;
    camera.position.set(
      cam.pos.x + (parallax.x * 0.35 + Math.sin(t * 0.21) * 0.12) * idle,
      cam.pos.y + (parallax.y * 0.18 + Math.sin(t * 0.17) * 0.05) * idle,
      cam.pos.z,
    );
    camera.fov = cam.fov;
    camera.updateProjectionMatrix();
    camera.lookAt(cam.target);
    if (!tween && !focused) {
      ray.setFromCamera(ndc, camera);
      const hits = ray.intersectObjects(room.pickables.map((p) => p.object), true);
      const p = hits.length ? pickRoot(hits[0].object) : null;
      if (p !== hovered) {
        hovered = p;
        room.setHover(p?.id ?? null);
        canvas.style.cursor = p ? 'pointer' : 'default';
      }
    }
    composer.render();
    requestAnimationFrame(tick);
  };
  tick();
}

main();
