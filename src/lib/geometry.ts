export interface Vec {
  x: number
  y: number
}

const cross = (o: Vec, a: Vec, b: Vec) => (a.x - o.x) * (b.y - o.y) - (a.y - o.y) * (b.x - o.x)

/** Andrew's monotone chain. Returns the hull counter-clockwise without repeats. */
export function convexHull(points: Vec[]): Vec[] {
  if (points.length < 3) return points.slice()
  const sorted = points.slice().sort((a, b) => a.x - b.x || a.y - b.y)
  const lower: Vec[] = []
  for (const p of sorted) {
    while (lower.length >= 2 && cross(lower[lower.length - 2], lower[lower.length - 1], p) <= 0) lower.pop()
    lower.push(p)
  }
  const upper: Vec[] = []
  for (let i = sorted.length - 1; i >= 0; i--) {
    const p = sorted[i]
    while (upper.length >= 2 && cross(upper[upper.length - 2], upper[upper.length - 1], p) <= 0) upper.pop()
    upper.push(p)
  }
  upper.pop()
  lower.pop()
  return lower.concat(upper)
}

/**
 * The shadow a convex prism casts on the ground is the hull of its footprint
 * and the footprint translated by the shadow offset.
 */
export function prismShadow(footprint: Vec[], offset: Vec): Vec[] {
  return convexHull(footprint.concat(footprint.map((p) => ({ x: p.x + offset.x, y: p.y + offset.y }))))
}

export function pointInPolygon(p: Vec, poly: Vec[]): boolean {
  let inside = false
  for (let i = 0, j = poly.length - 1; i < poly.length; j = i++) {
    const a = poly[i]
    const b = poly[j]
    if (a.y > p.y !== b.y > p.y && p.x < ((b.x - a.x) * (p.y - a.y)) / (b.y - a.y) + a.x) inside = !inside
  }
  return inside
}

export function polygonArea(poly: Vec[]): number {
  let sum = 0
  for (let i = 0, j = poly.length - 1; i < poly.length; j = i++) sum += (poly[j].x + poly[i].x) * (poly[j].y - poly[i].y)
  return Math.abs(sum) / 2
}

export function rectPolygon(x: number, y: number, w: number, h: number): Vec[] {
  return [
    { x, y },
    { x: x + w, y },
    { x: x + w, y: y + h },
    { x, y: y + h },
  ]
}

export function circlePolygon(cx: number, cy: number, r: number, sides = 10): Vec[] {
  return Array.from({ length: sides }, (_, i) => {
    const a = (i / sides) * Math.PI * 2
    return { x: cx + Math.cos(a) * r, y: cy + Math.sin(a) * r }
  })
}

export function centroid(poly: Vec[]): Vec {
  const n = poly.length
  return poly.reduce((acc, p) => ({ x: acc.x + p.x / n, y: acc.y + p.y / n }), { x: 0, y: 0 })
}
