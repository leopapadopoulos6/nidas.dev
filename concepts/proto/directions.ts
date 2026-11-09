// The three visual directions for the Server Room concept.
// Each direction drives the same scene graph with different palette, materials, light and post.

export type DirectionId = 'noir' | 'blacklight' | 'phosphor';

export interface Direction {
  id: DirectionId;
  name: string;
  tagline: string;
  render: 'lit' | 'vector';
  fonts: { display: string; mono: string };
  palette: {
    void: string; // background / fog
    floor: string;
    wall: string;
    steel: string; // rack bodies
    bezel: string; // device fronts
    trim: string; // edges / frames
    primary: string; // main LED / link color
    secondary: string; // activity LED
    accent: string; // neon spill
    alert: string; // locked terminal / alarm
    screen: string; // console text
    text: string;
  };
  cables: string[];
  light: {
    ambient: number;
    hemiSky: string;
    hemiGround: string;
    hemi: number;
    windowColor: string;
    windowIntensity: number;
    fillColor: string;
    fill: number;
    fogDensity: number;
    exposure: number;
  };
  bloom: { strength: number; radius: number; threshold: number };
  grade: {
    vignette: number;
    grain: number;
    aberration: number;
    scanlines: number;
    barrel: number;
    tint: [number, number, number];
  };
  floorGloss: number; // 0..1 reflector visibility
  acrylic: boolean; // translucent rack side panels
}

export const DIRECTIONS: Record<DirectionId, Direction> = {
  noir: {
    id: 'noir',
    name: 'Night Shift',
    tagline: 'Neon-noir NOC: wet floor, rain-blue dark, magenta street light through the blinds.',
    render: 'lit',
    fonts: { display: 'Tektur', mono: 'JetBrains Mono' },
    palette: {
      void: '#04060b',
      floor: '#0a0f19',
      wall: '#0d1320',
      steel: '#151c2b',
      bezel: '#1d2536',
      trim: '#2a3550',
      primary: '#2ef2ff',
      secondary: '#ffb547',
      accent: '#ff2e97',
      alert: '#ff3b4e',
      screen: '#8dfcff',
      text: '#e6f0ff',
    },
    cables: ['#2ef2ff', '#ff2e97', '#ffb547', '#7c5cff', '#2ef2ff', '#e6f0ff'],
    light: {
      ambient: 0.5,
      hemiSky: '#2f4378',
      hemiGround: '#05070c',
      hemi: 1.3,
      windowColor: '#ff2e97',
      windowIntensity: 7,
      fillColor: '#2ef2ff',
      fill: 4,
      fogDensity: 0.04,
      exposure: 1.35,
    },
    bloom: { strength: 0.95, radius: 0.55, threshold: 0.18 },
    grade: { vignette: 0.55, grain: 0.05, aberration: 0.0016, scanlines: 0, barrel: 0, tint: [1.0, 0.98, 1.04] },
    floorGloss: 0.55,
    acrylic: false,
  },
  blacklight: {
    id: 'blacklight',
    name: 'Blacklight Y2K',
    tagline: 'UV after-hours: smoked-acrylic racks, chrome bezels, fluorescent cables that glow like a club.',
    render: 'lit',
    fonts: { display: 'Unbounded', mono: 'Space Mono' },
    palette: {
      void: '#08021a',
      floor: '#0e0522',
      wall: '#120730',
      steel: '#2b1666',
      bezel: '#c9cbe6',
      trim: '#8c7bff',
      primary: '#3cf7e6',
      secondary: '#b8ff3c',
      accent: '#ff3ec8',
      alert: '#ff8a1f',
      screen: '#b8ff3c',
      text: '#f3edff',
    },
    cables: ['#ff3ec8', '#b8ff3c', '#ff8a1f', '#3cf7e6', '#fff35c', '#ff3ec8'],
    light: {
      ambient: 0.3,
      hemiSky: '#7b2cff',
      hemiGround: '#12052b',
      hemi: 0.55,
      windowColor: '#7b2cff',
      windowIntensity: 9,
      fillColor: '#ff3ec8',
      fill: 0,
      fogDensity: 0.022,
      exposure: 1.12,
    },
    bloom: { strength: 0.8, radius: 0.6, threshold: 0.3 },
    grade: { vignette: 0.45, grain: 0.035, aberration: 0.0026, scanlines: 0, barrel: 0, tint: [1.03, 0.97, 1.06] },
    floorGloss: 0.7,
    acrylic: true,
  },
  phosphor: {
    id: 'phosphor',
    name: 'Phosphor Vector',
    tagline: 'The room as a green-screen wireframe: every edge drawn in phosphor, one red alarm, CRT glass over it all.',
    render: 'vector',
    fonts: { display: 'Doto', mono: 'IBM Plex Mono' },
    palette: {
      void: '#010402',
      floor: '#020803',
      wall: '#020803',
      steel: '#031007',
      bezel: '#03140a',
      trim: '#39ff7a',
      primary: '#39ff7a',
      secondary: '#b6ffcc',
      accent: '#39ff7a',
      alert: '#ff3b30',
      screen: '#39ff7a',
      text: '#c8ffd9',
    },
    cables: ['#39ff7a', '#1faf55', '#39ff7a', '#b6ffcc', '#1faf55', '#39ff7a'],
    light: {
      ambient: 0.0,
      hemiSky: '#000000',
      hemiGround: '#000000',
      hemi: 0,
      windowColor: '#39ff7a',
      windowIntensity: 0,
      fillColor: '#39ff7a',
      fill: 0,
      fogDensity: 0.055,
      exposure: 1.0,
    },
    bloom: { strength: 0.85, radius: 0.35, threshold: 0.08 },
    grade: { vignette: 0.7, grain: 0.06, aberration: 0.0012, scanlines: 0.22, barrel: 0.06, tint: [0.92, 1.05, 0.95] },
    floorGloss: 0,
    acrylic: false,
  },
};
