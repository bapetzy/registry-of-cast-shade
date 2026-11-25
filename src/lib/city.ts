import {
  circlePolygon,
  convexHull,
  prismShadow,
  rectPolygon,
  type Vec,
} from './geometry'
import { seededRandom, type Random } from './random'
import { shadowOffset, type SunPosition } from './sun'

/**
 * Procedural plan of central Vesk. One world unit is one metre; x runs east,
 * y runs south. The seed is fixed so every visitor surveys the same city.
 */

export const CITY_SEED = 1904
export const WORLD = { width: 1600, height: 1000 }

export interface Rect {
  x: number
  y: number
  w: number
  h: number
}

export interface Street {
  name: string
  axis: 'ns' | 'ew'
  rect: Rect
}

export type StructureKind = 'building' | 'landmark' | 'tree'

export interface Structure {
  id: number
  registryNo: string
  kind: StructureKind
  name: string
  address: string
  height: number
  footprint: Vec[]
  /** Trees cast a canopy, not a prism. */
  canopy?: { center: Vec; radius: number; base: number }
  note: string
}

export interface City {
  streets: Street[]
  blocks: Rect[]
  park: Rect
  plaza: Rect
  canal: { halfWidth: number; centerline: Vec[] }
  structures: Structure[]
  lamps: Vec[]
}

const NS_NAMES = ['Ash', 'Cooper', 'Lantern', 'Tallow', 'Glazier', 'Mercy', 'Rook', 'Pewter', 'Saltpan', 'Vane', 'Ostler', 'Candle', 'Wick', 'Quill']
const EW_NAMES = ['Dial Lane', 'Brass Row', 'Linden Road', 'Weir Street', 'Sundry Lane', 'Chalk Row', 'Tanner’s Way', 'Kiln Road', 'Plover Street', 'Ferrous Lane']
const BOULEVARD = 'Meridian Boulevard'
const CANAL_NAME = 'Sallow Canal'

const NOTES = [
  'Shade leased on weekday afternoons to the café opposite.',
  'Unleased. Applications are welcome at the front desk.',
  'Shadow reaches the far kerb only in midwinter.',
  'Shelters a bench for most of the afternoon.',
  'Disputed: a neighbour claims the morning portion.',
  'Cats have been observed using the north-west corner.',
  'Held in trust for the school during exam weeks.',
  'Leased to a fruit seller, Saturdays only.',
  'The owner asked for it to be re-measured in 1998. It was the same.',
  'Shared by agreement with the building next door.',
]

const SMALL_KINDS = ['House', 'Narrow house', 'Bakery', 'Workshop', 'Laundry', 'Tobacconist', 'Cobbler', 'Corner shop', 'Boarding house']
const MID_KINDS = ['Tenement', 'Apartment block', 'Office building', 'Hotel', 'Lodging house', 'Pharmacy and flats']
const LARGE_KINDS = ['Warehouse', 'Printworks', 'Tram depot', 'Market hall', 'Bottling plant', 'Rope works']

export function canalY(x: number): number {
  return 650 + 70 * Math.sin(x / 230 + 0.6) + 22 * Math.sin(x / 83)
}

function lotTouchesCanal(r: Rect, halfWidth: number): boolean {
  for (let x = r.x; x <= r.x + r.w; x += 4) {
    const cy = canalY(x)
    const nearest = Math.max(r.y, Math.min(r.y + r.h, cy))
    if (Math.abs(nearest - cy) < halfWidth + 5) return true
  }
  return false
}

function splitLots(rng: Random, r: Rect, depth: number, out: Rect[]) {
  const area = r.w * r.h
  if (depth >= 4 || (depth > 1 && area < 1500) || r.w < 14 || r.h < 14) {
    out.push(r)
    return
  }
  const t = rng.range(0.35, 0.65)
  if (r.w >= r.h) {
    const w1 = r.w * t
    splitLots(rng, { ...r, w: w1 }, depth + 1, out)
    splitLots(rng, { ...r, x: r.x + w1, w: r.w - w1 }, depth + 1, out)
  } else {
    const h1 = r.h * t
    splitLots(rng, { ...r, h: h1 }, depth + 1, out)
    splitLots(rng, { ...r, y: r.y + h1, h: r.h - h1 }, depth + 1, out)
  }
}

function layoutAxis(rng: Random, length: number, boulevardAt: number | null) {
  const streets: { start: number; width: number }[] = []
  const blocks: { start: number; size: number }[] = []
  let cursor = -10
  let index = 0
  while (cursor < length) {
    const isBoulevard = boulevardAt !== null && index === boulevardAt
    const width = isBoulevard ? 34 : rng.range(12, 17)
    streets.push({ start: cursor, width })
    cursor += width
    const size = rng.range(78, 150)
    blocks.push({ start: cursor, size })
    cursor += size
    index++
  }
  return { streets, blocks }
}

export function generateCity(seed = CITY_SEED): City {
  const rng = seededRandom(seed)
  const cols = layoutAxis(rng, WORLD.width, 5)
  const rows = layoutAxis(rng, WORLD.height, null)
  const canalHalfWidth = 15

  const streets: Street[] = [
    ...cols.streets.map((s, i) => ({
      name: i === 5 ? BOULEVARD : `${NS_NAMES[i % NS_NAMES.length]} Street`,
      axis: 'ns' as const,
      rect: { x: s.start, y: -20, w: s.width, h: WORLD.height + 40 },
    })),
    ...rows.streets.map((s, i) => ({
      name: EW_NAMES[i % EW_NAMES.length],
      axis: 'ew' as const,
      rect: { x: -20, y: s.start, w: WORLD.width + 40, h: s.width },
    })),
  ]

  const blocks: Rect[] = []
  for (const c of cols.blocks) for (const r of rows.blocks) blocks.push({ x: c.start, y: r.start, w: c.size, h: r.size })

  const center = { x: WORLD.width / 2, y: WORLD.height * 0.45 }
  const distanceTo = (r: Rect) => Math.hypot(r.x + r.w / 2 - center.x, r.y + r.h / 2 - center.y)
  const boulevard = cols.streets[5]

  // The square sits just east of the boulevard, the park just west of it, both clear of the canal.
  const dry = blocks.filter((b) => !lotTouchesCanal(b, canalHalfWidth) && b.y + b.h < 560)
  const plaza = dry
    .filter((b) => b.x > boulevard.start)
    .sort((a, b) => distanceTo(a) - distanceTo(b))[0]
  const park = dry
    .filter((b) => b.x + b.w < boulevard.start && b !== plaza)
    .sort((a, b) => distanceTo(a) - distanceTo(b))[0]

  const structures: Structure[] = []
  const streetCounters = new Map<string, number>()
  const addressOn = (street: string) => {
    const n = (streetCounters.get(street) ?? 0) + 1
    streetCounters.set(street, n)
    return `${n} ${street}`
  }
  const nearestStreetName = (block: Rect, lot: Rect) => {
    const ci = cols.blocks.findIndex((c) => c.start === block.x)
    const ri = rows.blocks.findIndex((r) => r.start === block.y)
    const options = [
      { d: lot.x - block.x, name: streets[ci].name },
      { d: block.x + block.w - (lot.x + lot.w), name: ci + 1 < cols.streets.length ? streets[ci + 1].name : streets[ci].name },
      { d: lot.y - block.y, name: streets[cols.streets.length + ri].name },
      { d: block.y + block.h - (lot.y + lot.h), name: streets[cols.streets.length + ri + 1]?.name ?? streets[cols.streets.length + ri].name },
    ]
    return options.sort((a, b) => a.d - b.d)[0].name
  }

  const push = (s: Omit<Structure, 'id' | 'registryNo'>) => {
    const id = structures.length + 1
    structures.push({ ...s, id, registryNo: String(id).padStart(4, '0') })
  }

  for (const block of blocks) {
    if (block === plaza || block === park) continue
    const lots: Rect[] = []
    splitLots(rng, { x: block.x + 3, y: block.y + 3, w: block.w - 6, h: block.h - 6 }, 0, lots)
    for (const lot of lots) {
      if (lotTouchesCanal(lot, canalHalfWidth) || rng.chance(0.07)) continue
      const inset = rng.range(0.6, 2.4)
      const r = { x: lot.x + inset, y: lot.y + inset, w: lot.w - inset * 2, h: lot.h - inset * 2 }
      if (r.w < 6 || r.h < 6) continue
      const closeness = 1 - Math.min(1, distanceTo(r) / 900)
      let height = 7 + closeness * 17 + rng.range(-4, 6)
      const isTower = rng.chance(0.025)
      if (isTower) height = rng.range(44, 66)
      const area = r.w * r.h
      const kind = isTower ? 'Tower' : area > 3200 ? rng.pick(LARGE_KINDS) : height > 22 ? rng.pick(MID_KINDS) : rng.pick(SMALL_KINDS)
      const street = nearestStreetName(block, lot)
      push({
        kind: 'building',
        name: kind,
        address: addressOn(street),
        height: Math.round(height),
        footprint: rectPolygon(r.x, r.y, r.w, r.h),
        note: rng.pick(NOTES),
      })
    }
  }

  // Landmarks.
  const plazaCenter = { x: plaza.x + plaza.w / 2, y: plaza.y + plaza.h / 2 }
  push({
    kind: 'landmark',
    name: 'Gnomon Square clock tower',
    address: 'Gnomon Square',
    height: 72,
    footprint: rectPolygon(plazaCenter.x - 5, plazaCenter.y - 5, 10, 10),
    note: 'The square was paved so that the tower’s shadow could be read as a sundial. It runs about four minutes fast in February.',
  })
  push({
    kind: 'landmark',
    name: 'Registry of Cast Shade',
    address: '1 Gnomon Square',
    height: 26,
    footprint: rectPolygon(plaza.x + 6, plaza.y + plaza.h - 34, plaza.w * 0.42, 28),
    note: 'This office. Its own shadow is registered, numbered and, on Thursdays, leased back to itself.',
  })

  // Trees: two rows along the boulevard, a scattering in the park.
  const addTree = (center: Vec, radius: number, height: number, address: string, name: string) => {
    push({
      kind: 'tree',
      name,
      address,
      height,
      footprint: circlePolygon(center.x, center.y, radius, 12),
      canopy: { center, radius, base: height * 0.38 },
      note: rng.pick([
        'Leaf shade only: thins out from October.',
        'Pruned in March, which costs it about a fifth of its shadow.',
        'The most requested shadow on the street in July.',
        'Measured with the leaves on. The winter figure is filed separately.',
      ]),
    })
  }
  for (let y = 12; y < WORLD.height; y += 24) {
    if (Math.abs(canalY(boulevard.start + 17) - y) < canalHalfWidth + 6) continue
    for (const x of [boulevard.start + 5, boulevard.start + boulevard.width - 5]) {
      addTree({ x, y: y + rng.range(-2, 2) }, rng.range(4.5, 6.5), Math.round(rng.range(11, 16)), BOULEVARD, 'Lime tree')
    }
  }
  for (let i = 0; i < 26; i++) {
    const r = rng.range(5, 11)
    const c = { x: rng.range(park.x + r + 4, park.x + park.w - r - 4), y: rng.range(park.y + r + 4, park.y + park.h - r - 4) }
    addTree(c, r, Math.round(r * 2 + rng.range(2, 8)), 'Umber Park', rng.pick(['Plane tree', 'Copper beech', 'Horse chestnut', 'Lime tree']))
  }

  // Street lamps for after dark: every 46 m along both kerbs of every street.
  const lamps: Vec[] = []
  for (const s of streets) {
    const { x, y, w, h } = s.rect
    if (s.axis === 'ns') {
      for (let t = y + 20; t < y + h; t += 46) lamps.push({ x: x + 2, y: t }, { x: x + w - 2, y: t + 23 })
    } else {
      for (let t = x + 20; t < x + w; t += 46) lamps.push({ x: t, y: y + 2 }, { x: t + 23, y: y + h - 2 })
    }
  }

  const centerline: Vec[] = []
  for (let x = -20; x <= WORLD.width + 20; x += 10) centerline.push({ x, y: canalY(x) })

  return {
    streets,
    blocks,
    park,
    plaza,
    canal: { halfWidth: canalHalfWidth, centerline },
    structures,
    lamps: lamps.filter((l) => Math.abs(canalY(l.x) - l.y) > canalHalfWidth + 2),
  }
}

export const CITY_NAMES = { canal: CANAL_NAME, boulevard: BOULEVARD }

let cityOfRecord: City | null = null

/** The city of record: generated once and shared by the survey and the skyline. */
export function getCity(): City {
  cityOfRecord ??= generateCity()
  return cityOfRecord
}

/**
 * Vesk in elevation, seen from the south: the tallest thing standing over
 * each strip of ground. Trees are rounded to their canopy.
 */
export function skyline(city: City, step = 2): number[] {
  const heights = new Array<number>(Math.ceil(WORLD.width / step)).fill(0)
  for (const s of city.structures) {
    const xs = s.footprint.map((p) => p.x)
    const from = Math.max(0, Math.floor(Math.min(...xs) / step))
    const to = Math.min(heights.length - 1, Math.floor(Math.max(...xs) / step))
    for (let i = from; i <= to; i++) {
      let h = s.height
      if (s.canopy) {
        const u = (i * step - s.canopy.center.x) / s.canopy.radius
        h = s.canopy.base + (s.height - s.canopy.base) * Math.sqrt(Math.max(0, 1 - u * u))
      }
      if (h > heights[i]) heights[i] = h
    }
  }
  return heights
}

/** Ground shadow of one structure for the given sun, or null after dark. */
export function castShadow(s: Structure, sun: SunPosition, maxLength = 700): Vec[] | null {
  const full = shadowOffset(sun, s.height, maxLength)
  if (!full) return null
  if (!s.canopy) return prismShadow(s.footprint, full)
  const { center, radius, base } = s.canopy
  const k = base / s.height
  const canopy = circlePolygon(0, 0, radius, 12)
  const low = canopy.map((p) => ({ x: center.x + p.x + full.x * k, y: center.y + p.y + full.y * k }))
  const high = canopy.map((p) => ({ x: center.x + p.x + full.x, y: center.y + p.y + full.y }))
  return convexHull(low.concat(high))
}

/** Trunk shadow as a thin line from the foot of the tree to the canopy shadow. */
export function trunkShadow(s: Structure, sun: SunPosition): [Vec, Vec] | null {
  if (!s.canopy) return null
  const off = shadowOffset(sun, s.canopy.base, 700)
  if (!off) return null
  const c = s.canopy.center
  return [c, { x: c.x + off.x, y: c.y + off.y }]
}

export function shadowLength(s: Structure, sun: SunPosition): number | null {
  const off = shadowOffset(sun, s.height)
  return off ? Math.hypot(off.x, off.y) : null
}
