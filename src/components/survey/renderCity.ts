import { castShadow, trunkShadow, WORLD, type City, type Structure } from '../../lib/city'
import type { Vec } from '../../lib/geometry'
import { daylight, shadowOffset, sunPosition, type SunPosition } from '../../lib/sun'

/**
 * Canvas painting for the survey. Ground and roofs never change, so they are
 * cached in offscreen layers; each frame only repaints shadows between them.
 */

export const PALETTE = {
  street: '#f4e5a4',
  lot: '#e8d073',
  roof: '#12173a',
  chalk: '#f8f7f1',
  shade: 'rgba(43, 59, 192, 0.7)',
  shadeSolid: '#2b3bc0',
  hover: '#2b3bc0',
  sodium: '#ff9a2e',
  ink: '#12173a',
}

const ROTATION = -9

export interface View {
  matrix: DOMMatrix
  inverse: DOMMatrix
  scale: number
  width: number
  height: number
  dpr: number
}

export function computeView(width: number, height: number, dpr: number, focus: Vec): View {
  const theta = (Math.abs(ROTATION) * Math.PI) / 180
  // Scale so the rotated city always covers the viewport, no bare corners.
  const scale = Math.max(
    (width * Math.cos(theta) + height * Math.sin(theta)) / WORLD.width,
    (width * Math.sin(theta) + height * Math.cos(theta)) / WORLD.height,
  ) * 1.04
  // Keep the focus point inside the visible part of the world.
  const halfW = width / scale / 2
  const halfH = height / scale / 2
  const fx = Math.min(Math.max(focus.x, halfW), WORLD.width - halfW)
  const fy = Math.min(Math.max(focus.y, halfH), WORLD.height - halfH)
  const matrix = new DOMMatrix().translate(width / 2, height / 2).rotate(ROTATION).scale(scale).translate(-fx, -fy)
  return { matrix, inverse: matrix.inverse(), scale, width, height, dpr }
}

export function toWorld(view: View, x: number, y: number): Vec {
  const p = view.inverse.transformPoint(new DOMPoint(x, y))
  return { x: p.x, y: p.y }
}

export function toScreen(view: View, p: Vec): Vec {
  const q = view.matrix.transformPoint(new DOMPoint(p.x, p.y))
  return { x: q.x, y: q.y }
}

export function applyView(ctx: CanvasRenderingContext2D, view: View) {
  ctx.setTransform(new DOMMatrix().scale(view.dpr).multiply(view.matrix))
}

function tracePolygon(ctx: CanvasRenderingContext2D, poly: Vec[]) {
  ctx.moveTo(poly[0].x, poly[0].y)
  for (let i = 1; i < poly.length; i++) ctx.lineTo(poly[i].x, poly[i].y)
  ctx.closePath()
}

export function createLayer(view: View): { canvas: HTMLCanvasElement; ctx: CanvasRenderingContext2D } {
  const canvas = document.createElement('canvas')
  canvas.width = Math.round(view.width * view.dpr)
  canvas.height = Math.round(view.height * view.dpr)
  const ctx = canvas.getContext('2d')!
  return { canvas, ctx }
}

export function paintGround(ctx: CanvasRenderingContext2D, city: City, view: View) {
  ctx.setTransform(1, 0, 0, 1, 0, 0)
  ctx.fillStyle = PALETTE.street
  ctx.fillRect(0, 0, ctx.canvas.width, ctx.canvas.height)
  applyView(ctx, view)
  const px = 1 / view.scale

  ctx.fillStyle = PALETTE.lot
  for (const b of city.blocks) {
    if (b === city.plaza || b === city.park) continue
    ctx.fillRect(b.x, b.y, b.w, b.h)
  }

  // Park: a stipple of ink dots on the lot colour.
  const { park, plaza } = city
  ctx.fillStyle = PALETTE.lot
  ctx.fillRect(park.x, park.y, park.w, park.h)
  ctx.fillStyle = 'rgba(18, 23, 58, 0.28)'
  for (let y = park.y + 4; y < park.y + park.h; y += 7) {
    for (let x = park.x + 4 + ((y / 7) % 2) * 3.5; x < park.x + park.w; x += 7) {
      ctx.beginPath()
      ctx.arc(x, y, 0.75, 0, Math.PI * 2)
      ctx.fill()
    }
  }

  // Square: chalk paving in a fine grid.
  ctx.fillStyle = PALETTE.chalk
  ctx.fillRect(plaza.x, plaza.y, plaza.w, plaza.h)
  ctx.strokeStyle = 'rgba(18, 23, 58, 0.1)'
  ctx.lineWidth = px
  ctx.beginPath()
  for (let x = plaza.x; x <= plaza.x + plaza.w; x += 6) {
    ctx.moveTo(x, plaza.y)
    ctx.lineTo(x, plaza.y + plaza.h)
  }
  for (let y = plaza.y; y <= plaza.y + plaza.h; y += 6) {
    ctx.moveTo(plaza.x, y)
    ctx.lineTo(plaza.x + plaza.w, y)
  }
  ctx.stroke()

  // Canal: chalk water engraved with ink hatching, clipped to the channel.
  const { centerline, halfWidth } = city.canal
  ctx.save()
  ctx.beginPath()
  centerline.forEach((p, i) => (i ? ctx.lineTo(p.x, p.y - halfWidth) : ctx.moveTo(p.x, p.y - halfWidth)))
  for (let i = centerline.length - 1; i >= 0; i--) ctx.lineTo(centerline[i].x, centerline[i].y + halfWidth)
  ctx.closePath()
  ctx.fillStyle = PALETTE.chalk
  ctx.fill()
  ctx.strokeStyle = PALETTE.ink
  ctx.lineWidth = Math.max(px * 1.4, 0.8)
  ctx.stroke()
  ctx.clip()
  ctx.strokeStyle = 'rgba(18, 23, 58, 0.35)'
  ctx.lineWidth = px
  ctx.beginPath()
  for (let off = -halfWidth + 4; off < halfWidth; off += 4) {
    centerline.forEach((p, i) => (i ? ctx.lineTo(p.x, p.y + off) : ctx.moveTo(p.x, p.y + off)))
  }
  ctx.stroke()
  ctx.restore()
}

export function paintRoofs(ctx: CanvasRenderingContext2D, city: City, view: View) {
  applyView(ctx, view)
  ctx.fillStyle = PALETTE.roof
  ctx.beginPath()
  for (const s of city.structures) if (s.kind !== 'tree') tracePolygon(ctx, s.footprint)
  ctx.fill()

  // Canopies: ink rings with a lighter crown, so trees read as soft, not built.
  for (const s of city.structures) {
    if (!s.canopy) continue
    const { center, radius } = s.canopy
    ctx.beginPath()
    ctx.arc(center.x, center.y, radius, 0, Math.PI * 2)
    ctx.fillStyle = 'rgba(18, 23, 58, 0.82)'
    ctx.fill()
    ctx.beginPath()
    ctx.arc(center.x - radius * 0.25, center.y - radius * 0.25, radius * 0.45, 0, Math.PI * 2)
    ctx.fillStyle = 'rgba(248, 247, 241, 0.16)'
    ctx.fill()
  }
}

export function paintShadows(ctx: CanvasRenderingContext2D, city: City, sun: SunPosition, view: View) {
  applyView(ctx, view)
  ctx.beginPath()
  for (const s of city.structures) {
    const poly = castShadow(s, sun)
    if (poly) tracePolygon(ctx, poly)
  }
  // One path, nonzero fill: overlapping shadows union instead of darkening.
  ctx.fillStyle = PALETTE.shade
  ctx.fill('nonzero')

  ctx.strokeStyle = PALETTE.shade
  ctx.lineWidth = 1.1
  ctx.beginPath()
  for (const s of city.structures) {
    const trunk = trunkShadow(s, sun)
    if (!trunk) continue
    ctx.moveTo(trunk[0].x, trunk[0].y)
    ctx.lineTo(trunk[1].x, trunk[1].y)
  }
  ctx.stroke()
}

/** Hour lines on Gnomon Square: where the tower's shadow tip falls at each hour. */
export function paintSundial(ctx: CanvasRenderingContext2D, tower: Structure, day: number, view: View) {
  applyView(ctx, view)
  const base = {
    x: tower.footprint.reduce((a, p) => a + p.x, 0) / 4,
    y: tower.footprint.reduce((a, p) => a + p.y, 0) / 4,
  }
  const { rise, set } = daylight(day)
  ctx.strokeStyle = 'rgba(18, 23, 58, 0.45)'
  ctx.lineWidth = 1 / view.scale
  ctx.setLineDash([3 / view.scale, 3 / view.scale])
  ctx.beginPath()
  const ends: { h: number; p: Vec }[] = []
  for (let h = Math.ceil(rise + 0.5); h <= Math.floor(set - 0.5); h++) {
    const off = shadowOffset(sunPosition(h, day), tower.height, 120)
    if (!off) continue
    const p = { x: base.x + off.x, y: base.y + off.y }
    ctx.moveTo(base.x, base.y)
    ctx.lineTo(p.x, p.y)
    ends.push({ h, p })
  }
  ctx.stroke()
  ctx.setLineDash([])

  // Numerals stay upright on screen; draw them unrotated.
  ctx.setTransform(view.dpr, 0, 0, view.dpr, 0, 0)
  ctx.fillStyle = 'rgba(18, 23, 58, 0.75)'
  ctx.font = `600 ${Math.max(9, Math.min(13, view.scale * 9))}px "Big Shoulders Variable", sans-serif`
  ctx.textAlign = 'center'
  ctx.textBaseline = 'middle'
  for (const { h, p } of ends) {
    if (h % 2) continue
    const s = toScreen(view, p)
    ctx.fillText(String(h), s.x, s.y)
  }
}

export function paintHighlight(
  ctx: CanvasRenderingContext2D,
  s: Structure,
  sun: SunPosition,
  view: View,
  strong: boolean,
  withShadow = true,
) {
  applyView(ctx, view)
  const shadow = withShadow ? castShadow(s, sun) : null
  if (shadow) {
    ctx.beginPath()
    tracePolygon(ctx, shadow)
    ctx.fillStyle = strong ? PALETTE.shadeSolid : 'rgba(29, 42, 148, 0.55)'
    ctx.fill()
    ctx.strokeStyle = PALETTE.ink
    ctx.lineWidth = 1.5 / view.scale
    ctx.stroke()
  }
  ctx.beginPath()
  tracePolygon(ctx, s.footprint)
  ctx.fillStyle = strong ? PALETTE.chalk : PALETTE.hover
  ctx.fill()
  ctx.strokeStyle = PALETTE.ink
  ctx.lineWidth = 2 / view.scale
  ctx.stroke()
}

export function paintNight(ctx: CanvasRenderingContext2D, city: City, darkness: number, view: View) {
  if (darkness <= 0) return
  ctx.setTransform(1, 0, 0, 1, 0, 0)
  ctx.fillStyle = `rgba(18, 23, 58, ${0.86 * darkness})`
  ctx.fillRect(0, 0, ctx.canvas.width, ctx.canvas.height)
  applyView(ctx, view)
  ctx.globalCompositeOperation = 'lighter'
  ctx.globalAlpha = darkness
  const r = 14
  const glow = lampGlow()
  for (const l of city.lamps) ctx.drawImage(glow, l.x - r, l.y - r, r * 2, r * 2)
  ctx.globalAlpha = 1
  ctx.globalCompositeOperation = 'source-over'
}

let glowSprite: HTMLCanvasElement | null = null

/** One sodium glow, drawn once and stamped at every lamp. */
function lampGlow(): HTMLCanvasElement {
  if (glowSprite) return glowSprite
  const size = 64
  glowSprite = document.createElement('canvas')
  glowSprite.width = glowSprite.height = size
  const g = glowSprite.getContext('2d')!
  const gradient = g.createRadialGradient(size / 2, size / 2, 0, size / 2, size / 2, size / 2)
  gradient.addColorStop(0, 'rgba(255, 154, 46, 0.55)')
  gradient.addColorStop(1, 'rgba(255, 154, 46, 0)')
  g.fillStyle = gradient
  g.fillRect(0, 0, size, size)
  return glowSprite
}

export interface ShadeHours {
  canvas: HTMLCanvasElement
  data: ImageData
  daylightHours: number
}

const SHADE_SCALE = 0.5

/**
 * Sum the shadows of a whole day. Each sample adds 1/N of opaque shade with
 * additive blending, so a pixel's final alpha is exactly the fraction of
 * daylight it spent in shadow. The work is sliced across frames so the page
 * keeps responding; `onProgress` reports 0–1 and the signal cancels it.
 */
export async function computeShadeHours(
  city: City,
  day: number,
  { samples = 48, signal, onProgress }: { samples?: number; signal?: AbortSignal; onProgress?: (p: number) => void } = {},
): Promise<ShadeHours | null> {
  const w = WORLD.width * SHADE_SCALE
  const h = WORLD.height * SHADE_SCALE
  const acc = document.createElement('canvas')
  acc.width = w
  acc.height = h
  const actx = acc.getContext('2d', { willReadFrequently: true })!
  const step = document.createElement('canvas')
  step.width = w
  step.height = h
  const sctx = step.getContext('2d')!
  sctx.setTransform(SHADE_SCALE, 0, 0, SHADE_SCALE, 0, 0)
  sctx.fillStyle = PALETTE.shadeSolid

  const { rise, set } = daylight(day)
  actx.globalCompositeOperation = 'lighter'
  actx.globalAlpha = 1 / samples
  onProgress?.(0)
  // Each sample is filled in batches. The fill is opaque, so batches still
  // union exactly, and the loop can yield between them instead of holding the
  // main thread for a whole sample. (A prism's shadow hull already contains
  // its footprint, so footprints need no separate pass.)
  const BATCH = 200
  let sliceStart = performance.now()
  for (let i = 0; i < samples; i++) {
    const hours = rise + ((i + 0.5) / samples) * (set - rise)
    const sun = sunPosition(hours, day)
    sctx.clearRect(0, 0, WORLD.width, WORLD.height)
    for (let from = 0; from < city.structures.length; from += BATCH) {
      sctx.beginPath()
      for (const s of city.structures.slice(from, from + BATCH)) {
        const poly = castShadow(s, sun, 400)
        if (poly) tracePolygon(sctx, poly)
      }
      sctx.fill('nonzero')
      if (performance.now() - sliceStart > 10) {
        onProgress?.((i + from / city.structures.length) / samples)
        await new Promise((r) => requestAnimationFrame(r))
        if (signal?.aborted) return null
        sliceStart = performance.now()
      }
    }
    actx.drawImage(step, 0, 0)
  }
  onProgress?.(1)
  return { canvas: acc, data: actx.getImageData(0, 0, w, h), daylightHours: set - rise }
}

/** Fraction of daylight a world point spends in shade, 0–1. */
export function sampleShadeHours(shade: ShadeHours, p: Vec): number | null {
  const x = Math.floor(p.x * SHADE_SCALE)
  const y = Math.floor(p.y * SHADE_SCALE)
  if (x < 0 || y < 0 || x >= shade.data.width || y >= shade.data.height) return null
  return shade.data.data[(y * shade.data.width + x) * 4 + 3] / 255
}

export function paintShadeHours(ctx: CanvasRenderingContext2D, shade: ShadeHours, view: View) {
  applyView(ctx, view)
  ctx.imageSmoothingEnabled = true
  ctx.globalAlpha = 0.92
  ctx.drawImage(shade.canvas, 0, 0, WORLD.width, WORLD.height)
  ctx.globalAlpha = 1
}
