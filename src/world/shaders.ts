// GLSL for the district. All materials are unlit and stylized; fog uses three's chunks.

export const buildingVert = /* glsl */ `
  varying vec3 vLocal;
  varying vec3 vSize;
  varying vec3 vNormalL;
  varying float vSeed;
  #include <common>
  #include <fog_pars_vertex>
  void main() {
    vSize = vec3(length(instanceMatrix[0].xyz), length(instanceMatrix[1].xyz), length(instanceMatrix[2].xyz));
    vLocal = position * vSize;
    vNormalL = normal;
    vSeed = float(gl_InstanceID);
    vec4 world = modelMatrix * instanceMatrix * vec4(position, 1.0);
    vec4 mvPosition = viewMatrix * world;
    gl_Position = projectionMatrix * mvPosition;
    #include <fog_vertex>
  }
`

export const buildingFrag = /* glsl */ `
  uniform vec3 uFill;
  uniform vec3 uFillTop;
  uniform vec3 uEdge;
  uniform float uEdgeOpacity;
  uniform vec3 uWin0;
  uniform vec3 uWin1;
  uniform vec3 uWin2;
  uniform float uWinDensity;
  uniform float uTime;
  varying vec3 vLocal;
  varying vec3 vSize;
  varying vec3 vNormalL;
  varying float vSeed;
  #include <common>
  #include <fog_pars_fragment>
  uniform float uWinStyle;
  float h13(vec3 p3) {
    p3 = fract(p3 * 0.1031);
    p3 += dot(p3, p3.zyx + 31.32);
    return fract((p3.x + p3.y) * p3.z);
  }
  void main() {
    vec3 hs = vSize * 0.5;
    float dx = hs.x - abs(vLocal.x);
    float dy = min(vLocal.y, vSize.y - vLocal.y);
    float dz = hs.z - abs(vLocal.z);
    float mn = min(dx, min(dy, dz));
    float mx = max(dx, max(dy, dz));
    float mid = dx + dy + dz - mn - mx;
    // hairline edges: constant width in pixels, never thicker than 6 cm
    float px = fwidth(mid);
    float w = min(px * 1.2, 0.06);
    float edge = 1.0 - smoothstep(w, w + px, mid);
    float glow = exp(-mid * 4.0) * 0.08;

    vec3 col = mix(uFill, uFillTop, clamp(vLocal.y / 45.0, 0.0, 1.0));

    // windows on the side faces only
    float side = 1.0 - step(0.5, abs(vNormalL.y));
    float faceId = abs(vNormalL.x) > 0.5 ? sign(vNormalL.x) * 2.0 : sign(vNormalL.z) * 3.0;
    vec2 wuv = vec2(abs(vNormalL.x) > 0.5 ? vLocal.z : vLocal.x, vLocal.y);
    float win = 0.0;
    float pick = 0.0;
    if (uWinStyle < 0.5) {
      // strips: thin lit bands per floor, in random runs
      float fl = floor(wuv.y / 3.2);
      float run = floor((wuv.x + 50.0) / 2.4);
      float r = h13(vec3(fl, run, vSeed * 7.0 + faceId));
      float band = 1.0 - smoothstep(0.035, 0.035 + fwidth(wuv.y) * 1.5, abs(fract(wuv.y / 3.2) - 0.5) * 3.2 - 0.0);
      win = step(1.0 - uWinDensity, r) * band;
      pick = h13(vec3(run, fl, vSeed + 3.0));
    } else {
      // panes: a regular window grid with random lit panes
      vec2 cs = vec2(1.1, 1.6);
      vec2 cell = floor((wuv + vec2(50.0, 0.0)) / cs);
      vec2 f = fract((wuv + vec2(50.0, 0.0)) / cs);
      float r = h13(vec3(cell, vSeed * 5.0 + faceId));
      float shape = step(0.2, f.x) * step(f.x, 0.8) * step(0.3, f.y) * step(f.y, 0.7);
      win = step(1.0 - uWinDensity, r) * shape;
      pick = h13(vec3(cell.yx, vSeed + 11.0));
    }
    // far away the window pattern aliases: fade it toward its average brightness
    float fw = max(fwidth(wuv.x), fwidth(wuv.y));
    win = mix(win, uWinDensity * 0.25, smoothstep(0.12, 0.45, fw));
    float floorOk = step(1.6, vLocal.y) * step(vLocal.y, vSize.y - 1.0) * step(0.6, min(hs.x - abs(vLocal.x), 9.0) + min(hs.z - abs(vLocal.z), 9.0) - mn);
    float flick = 0.8 + 0.2 * sin(uTime * (0.5 + pick * 2.0) + pick * 30.0);
    win *= side * floorOk * flick;
    vec3 wc = pick < 0.34 ? uWin0 : (pick < 0.67 ? uWin1 : uWin2);
    col += wc * win * 1.4;
    col += uEdge * (edge * uEdgeOpacity * 1.7 + glow * uEdgeOpacity);
    gl_FragColor = vec4(col, 1.0);
    #include <fog_fragment>
  }
`

export const floorVert = /* glsl */ `
  varying vec3 vWorld;
  #include <common>
  #include <fog_pars_vertex>
  void main() {
    vec4 world = modelMatrix * vec4(position, 1.0);
    vWorld = world.xyz;
    vec4 mvPosition = viewMatrix * world;
    gl_Position = projectionMatrix * mvPosition;
    #include <fog_vertex>
  }
`

export const floorFrag = /* glsl */ `
  uniform vec3 uBase;
  uniform vec3 uMinor;
  uniform vec3 uMajor;
  uniform vec3 uGlow;
  uniform vec3 uPacket;
  uniform float uDots;
  uniform float uAlpha;
  varying vec3 vWorld;
  #include <common>
  #include <fog_pars_fragment>
  float gridLine(vec2 p, float size, float width) {
    vec2 c = p / size;
    vec2 g = abs(fract(c - 0.5) - 0.5) / fwidth(c);
    return 1.0 - min(min(g.x, g.y) / width, 1.0);
  }
  float gridDots(vec2 p, float size, float r) {
    vec2 c = fract(p / size + 0.5) - 0.5;
    float d = length(c * size);
    float aa = fwidth(d);
    return 1.0 - smoothstep(r - aa, r + aa, d);
  }
  void main() {
    vec2 p = vWorld.xz;
    float minor, major;
    if (uDots > 0.5) {
      minor = gridDots(p, 3.0, 0.07);
      major = gridDots(p, 9.0, 0.16) + gridLine(p, 45.0, 1.0) * 0.5;
    } else {
      minor = gridLine(p, 3.0, 1.0);
      major = gridLine(p, 9.0, 1.4);
    }
    // fade the fine grid with distance to avoid moire
    float dist = length(cameraPosition.xz - p);
    float fade = 1.0 - smoothstep(30.0, 110.0, dist);
    vec3 col = uBase;
    col += uMinor * minor * fade * 0.9;
    col += uMajor * major * (0.35 + 0.65 * fade);
    float pd = length(p - uPacket.xz);
    col += uGlow * exp(-pd * pd * 0.08) * 0.9;
    gl_FragColor = vec4(col, uAlpha);
    #include <fog_fragment>
  }
`

export const linkVert = /* glsl */ `
  varying vec2 vUv;
  #include <common>
  #include <fog_pars_vertex>
  void main() {
    vUv = uv;
    vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
    gl_Position = projectionMatrix * mvPosition;
    #include <fog_vertex>
  }
`

export const linkFrag = /* glsl */ `
  uniform vec3 uColor;
  uniform vec3 uPulse;
  uniform float uTime;
  uniform float uLen;
  uniform float uDead;
  uniform float uGlowStrip;
  varying vec2 vUv;
  #include <common>
  #include <fog_pars_fragment>
  void main() {
    float s = vUv.x * uLen;
    float spacing = 7.0;
    float ph = fract((s - uTime * 9.0) / spacing);
    float pulse = smoothstep(0.0, 0.04, ph) * (1.0 - smoothstep(0.04, 0.28, ph));
    if (uDead > 0.5) {
      // dead-end link: pulses stop short and fade, with dashes near the firewall
      pulse *= 1.0 - smoothstep(0.5, 0.95, vUv.x);
      float dash = step(0.5, fract(s * 0.6));
      pulse += dash * smoothstep(0.75, 1.0, vUv.x) * 0.6;
    }
    vec3 col = uColor * 0.9 + uPulse * pulse * 3.0;
    float a = 1.0;
    if (uGlowStrip > 0.5) {
      float across = abs(vUv.y - 0.5) * 2.0;
      a = exp(-across * across * 7.0) * (0.14 + pulse * 0.45);
      col = mix(uColor, uPulse, pulse);
    }
    gl_FragColor = vec4(col, a);
    #include <fog_fragment>
  }
`

export const trailVert = /* glsl */ `
  attribute float aT;
  varying float vT;
  #include <common>
  #include <fog_pars_vertex>
  void main() {
    vT = aT;
    vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
    gl_Position = projectionMatrix * mvPosition;
    #include <fog_vertex>
  }
`

export const trailFrag = /* glsl */ `
  uniform vec3 uHead;
  uniform vec3 uTail;
  uniform float uOpacity;
  varying float vT;
  #include <common>
  #include <fog_pars_fragment>
  void main() {
    // vT: 1 at the head, 0 at the tail
    vec3 col = mix(uTail, uHead, pow(vT, 1.5)) * (1.0 + 2.5 * pow(vT, 4.0));
    float a = pow(vT, 1.6) * uOpacity;
    // fade the part of the trail that runs under the chase camera
    #ifdef USE_FOG
      a *= smoothstep(4.0, 11.0, vFogDepth);
    #endif
    gl_FragColor = vec4(col, a);
    #include <fog_fragment>
  }
`

export const beamFrag = /* glsl */ `
  uniform vec3 uColor;
  uniform float uTime;
  varying vec2 vUv;
  #include <common>
  #include <fog_pars_fragment>
  void main() {
    float a = pow(1.0 - vUv.y, 1.5) * 0.22 * (0.85 + 0.15 * sin(uTime * 3.0 + vUv.y * 20.0));
    gl_FragColor = vec4(uColor, a);
    #include <fog_fragment>
  }
`
