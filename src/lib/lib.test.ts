import { describe, expect, it } from 'vitest'
import { castShadow, generateCity, skyline } from './city'
import { convexHull, pointInPolygon, polygonArea, prismShadow, rectPolygon } from './geometry'
import { SEASON_DAY, daylight, formatClock, shadowOffset, sunPosition, toDegrees } from './sun'

describe('sun', () => {
  it('stands due south at solar noon, at 90° minus latitude on the equinox', () => {
    const noon = sunPosition(12, SEASON_DAY.equinox)
    expect(toDegrees(noon.azimuth)).toBeCloseTo(180, 0)
    expect(toDegrees(noon.altitude)).toBeGreaterThan(36)
    expect(toDegrees(noon.altitude)).toBeLessThan(39)
  })

  it('rises in the east in the morning and sets in the west', () => {
    expect(toDegrees(sunPosition(8, SEASON_DAY.equinox).azimuth)).toBeLessThan(180)
    expect(toDegrees(sunPosition(16, SEASON_DAY.equinox).azimuth)).toBeGreaterThan(180)
  })

  it('gives longer days in midsummer than midwinter', () => {
    const summer = daylight(SEASON_DAY.midsummer)
    const winter = daylight(SEASON_DAY.midwinter)
    expect(summer.set - summer.rise).toBeGreaterThan(16)
    expect(winter.set - winter.rise).toBeLessThan(8)
  })

  it('casts the noon shadow due north (negative y on a north-up plan)', () => {
    const off = shadowOffset(sunPosition(12, SEASON_DAY.equinox), 10)!
    expect(Math.abs(off.x)).toBeLessThan(0.01)
    expect(off.y).toBeLessThan(-12)
  })

  it('casts no shadow at night', () => {
    expect(shadowOffset(sunPosition(0, SEASON_DAY.equinox), 10)).toBeNull()
  })

  it('formats clock times', () => {
    expect(formatClock(6.5)).toBe('06:30')
    expect(formatClock(13.999)).toBe('14:00')
  })
})

describe('geometry', () => {
  it('builds the convex hull of a square with an interior point', () => {
    const hull = convexHull([...rectPolygon(0, 0, 10, 10), { x: 5, y: 5 }])
    expect(hull).toHaveLength(4)
    expect(polygonArea(hull)).toBe(100)
  })

  it('extrudes a prism shadow to footprint plus swept area', () => {
    const shadow = prismShadow(rectPolygon(0, 0, 10, 10), { x: 20, y: 0 })
    expect(polygonArea(shadow)).toBe(300)
  })

  it('tests points against polygons', () => {
    const square = rectPolygon(0, 0, 10, 10)
    expect(pointInPolygon({ x: 5, y: 5 }, square)).toBe(true)
    expect(pointInPolygon({ x: 15, y: 5 }, square)).toBe(false)
  })
})

describe('city', () => {
  const city = generateCity()

  it('is deterministic', () => {
    const again = generateCity()
    expect(again.structures.length).toBe(city.structures.length)
    expect(again.structures[42].footprint).toEqual(city.structures[42].footprint)
  })

  it('has a square, a park, a clock tower and a few hundred buildings', () => {
    expect(city.plaza).toBeDefined()
    expect(city.park).toBeDefined()
    expect(city.structures.find((s) => s.name.includes('clock tower'))).toBeDefined()
    expect(city.structures.filter((s) => s.kind === 'building').length).toBeGreaterThan(200)
  })

  it('files the clock tower under the same number the register uses', async () => {
    const { SPECIMENS } = await import('../components/registry/specimens')
    const tower = city.structures.find((s) => s.name.includes('clock tower'))!
    expect(SPECIMENS.find((s) => s.id === 'clock-tower')!.registryNo).toBe(tower.registryNo)
  })

  it('raises the clock tower above the skyline it belongs to', () => {
    const tower = city.structures.find((s) => s.name.includes('clock tower'))!
    const heights = skyline(city, 2)
    const towerX = Math.round(tower.footprint[0].x / 2) + 2
    expect(Math.max(...heights)).toBeGreaterThanOrEqual(tower.height)
    expect(heights[towerX]).toBe(tower.height)
  })

  it('casts tree shadows away from the sun', () => {
    const tree = city.structures.find((s) => s.kind === 'tree')!
    const shadow = castShadow(tree, sunPosition(12, SEASON_DAY.equinox))!
    const minY = Math.min(...shadow.map((p) => p.y))
    expect(minY).toBeLessThan(tree.canopy!.center.y - tree.canopy!.radius)
  })
})
