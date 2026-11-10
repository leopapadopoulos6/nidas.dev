// Direction B · Phosphor: a single green hue on a dark tube. Red (fault) only means ACCESS DENIED.
export const P = {
  tube: '#010502',
  glass: '#04140A',
  dim: '#0F4A22',
  mid: '#1A7A3A',
  phosphor: '#2BD45F',
  bright: '#8CFFAE',
  hot: '#E6FFEE',
  fault: '#FF4F4F',
} as const

export const theme = {
  background: P.tube,
  fogDensity: 0.0125,
  floorBase: P.tube,
  gridMinor: '#0B3A1B',
  gridMajor: P.mid,
  fill: P.tube,
  fillTop: '#021006',
  edge: P.phosphor,
  edgeOpacity: 0.95,
  windows: [P.phosphor, P.bright, P.phosphor],
  windowDensity: 0.07,
  link: P.mid,
  pulse: P.bright,
  ring: P.phosphor,
  active: P.hot,
  packetCore: P.hot,
  packetShell: P.bright,
  trailHead: '#B8FFCC',
  trailTail: P.phosphor,
  bloom: { intensity: 1.0, threshold: 0.5, smoothing: 0.3, radius: 0.6 },
  camera: { distance: 17, height: 15, fov: 50, lookAhead: 9 },
}

// Packet handling: snappy, digital.
export const DRIVE = {
  speed: 16, // m/s
  boost: 27,
  response: 11, // higher = snappier velocity response
  snapDeg: 10, // joystick directions within this many degrees of a 45° heading snap to it
  autopilotSpeed: 30,
  trailSeconds: 1.5,
}
