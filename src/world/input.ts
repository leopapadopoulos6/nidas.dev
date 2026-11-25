// Input state shared by the keyboard, the touch joystick and the packet controller.
// Plain mutable module state: written by event handlers, read every frame.

export const input = {
  x: 0, // -1 left .. 1 right (screen space)
  y: 0, // -1 down .. 1 up (screen space)
  boost: false,
  stick: { x: 0, y: 0, active: false },
  keys: new Set<string>(),
}

const MOVE: Record<string, [number, number]> = {
  KeyW: [0, 1],
  ArrowUp: [0, 1],
  KeyS: [0, -1],
  ArrowDown: [0, -1],
  KeyA: [-1, 0],
  ArrowLeft: [-1, 0],
  KeyD: [1, 0],
  ArrowRight: [1, 0],
}

export const isMoveKey = (code: string) => code in MOVE

export function updateFromKeys() {
  let x = 0
  let y = 0
  for (const k of input.keys) {
    const m = MOVE[k]
    if (m) {
      x += m[0]
      y += m[1]
    }
  }
  if (input.stick.active) {
    x += input.stick.x
    y += input.stick.y
  }
  const len = Math.hypot(x, y)
  if (len > 1) {
    x /= len
    y /= len
  }
  input.x = x
  input.y = y
  input.boost = input.keys.has('ShiftLeft') || input.keys.has('ShiftRight')
}

export const hasInput = () => Math.abs(input.x) + Math.abs(input.y) > 0.05
