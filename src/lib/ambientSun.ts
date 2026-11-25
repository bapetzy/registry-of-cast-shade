import { useSyncExternalStore } from 'react'
import { daylight, sunPosition } from './sun'

/**
 * The page has one sun. Scrolling from top to bottom runs a late-May day in
 * Vesk from 07:00 to just after sunset. Relief elements and specimens read
 * their shadows from the CSS custom properties written here.
 *
 * The properties are written to each [data-sun-scope] element that is on
 * screen, never to :root, and only when the simulated minute changes (about
 * every 8 px of scroll). A root write on every frame made every element in
 * the document recompute its style while scrolling.
 *
 * --daylight is the colour of the limewash under that sun: greener and paler
 * in the morning, full sulfur at midday, amber towards evening.
 */

export const AMBIENT_DAY = 140
const START = 7
const END = daylight(AMBIENT_DAY).set + 0.6

export interface AmbientState {
  hours: number
  altitude: number
  azimuth: number
}

let state: AmbientState = { hours: START, ...sunPosition(START, AMBIENT_DAY) }
const listeners = new Set<() => void>()
const visibleScopes = new Set<HTMLElement>()
let vars: [string, string][] = []

function apply(el: HTMLElement) {
  for (const [name, value] of vars) {
    if (el.style.getPropertyValue(name) !== value) el.style.setProperty(name, value)
  }
}

const clamp = (v: number, min: number, max: number) => Math.min(max, Math.max(min, v))

const DAYLIGHT: [hours: number, rgb: [number, number, number]][] = [
  [7, [235, 229, 166]],
  [10, [241, 222, 142]],
  [15, [241, 222, 142]],
  [17.5, [242, 207, 114]],
  [19.2, [238, 183, 92]],
  [20.4, [217, 154, 85]],
]

function daylightAt(hours: number): string {
  let i = 1
  while (i < DAYLIGHT.length - 1 && hours > DAYLIGHT[i][0]) i++
  const [h0, a] = DAYLIGHT[i - 1]
  const [h1, b] = DAYLIGHT[i]
  const t = clamp((hours - h0) / (h1 - h0), 0, 1)
  return `rgb(${a.map((v, k) => Math.round(v + (b[k] - v) * t)).join(' ')})`
}

const smoothstep = (a: number, b: number, v: number) => {
  const t = clamp((v - a) / (b - a), 0, 1)
  return t * t * (3 - 2 * t)
}

let writtenMinute = NaN

function write(hours: number) {
  const minute = Math.round(hours * 60)
  if (minute === writtenMinute) return
  writtenMinute = minute
  const sun = sunPosition(hours, AMBIENT_DAY)
  const strength = smoothstep(-0.01, 0.14, sun.altitude)
  // Cotangent of altitude: how many units of shadow per unit of height.
  const reach = 1 / Math.tan(Math.max(sun.altitude, 0.12))
  // Elevation view facing south: screen-right is west, the near ground is north.
  const sx = clamp(Math.sin(sun.azimuth) * reach, -3.2, 3.2)
  const sy = clamp(-Math.cos(sun.azimuth) * reach * 0.3, 0.14, 1.1)
  vars = [
    ['--sun-x', sx.toFixed(3)],
    ['--sun-y', sy.toFixed(3)],
    ['--sun-strength', strength.toFixed(3)],
    ['--wall-x', clamp(sx * 0.45, -1.3, 1.3).toFixed(3)],
    ['--wall-y', clamp(0.3 + reach * 0.16, 0.3, 1.2).toFixed(3)],
    ['--daylight', daylightAt(hours)],
    ['--sun-alt', ((sun.altitude * 180) / Math.PI).toFixed(2)],
  ]
  visibleScopes.forEach(apply)

  state = { hours, ...sun }
  listeners.forEach((l) => l())
}

export function startAmbientSun(): () => void {
  let frame = 0
  const update = () => {
    frame = 0
    const max = document.documentElement.scrollHeight - window.innerHeight
    const progress = max > 0 ? clamp(window.scrollY / max, 0, 1) : 0
    write(START + (END - START) * progress)
  }
  const schedule = () => {
    if (!frame) frame = requestAnimationFrame(update)
  }
  const io = new IntersectionObserver((entries) => {
    for (const entry of entries) {
      const el = entry.target as HTMLElement
      if (entry.isIntersecting) {
        visibleScopes.add(el)
        apply(el)
      } else visibleScopes.delete(el)
    }
  })
  document.querySelectorAll<HTMLElement>('[data-sun-scope]').forEach((el) => io.observe(el))

  update()
  window.addEventListener('scroll', schedule, { passive: true })
  window.addEventListener('resize', schedule)
  return () => {
    io.disconnect()
    visibleScopes.clear()
    writtenMinute = NaN
    cancelAnimationFrame(frame)
    window.removeEventListener('scroll', schedule)
    window.removeEventListener('resize', schedule)
  }
}

const subscribe = (listener: () => void) => {
  listeners.add(listener)
  return () => listeners.delete(listener)
}
const snapshot = () => state

/** Re-renders once per simulated minute. */
export function useAmbientSun(): AmbientState {
  return useSyncExternalStore(subscribe, snapshot, snapshot)
}
