/**
 * A compact solar-position model (declination + hour angle), accurate to a
 * degree or so — plenty for casting shadows of an invented city.
 * All times are local solar time in decimal hours.
 */

const DEG = Math.PI / 180

/** Vesk sits on the 52nd parallel, roughly level with Amsterdam or Berlin. */
export const VESK_LATITUDE = 52.4

export type Season = 'midwinter' | 'equinox' | 'midsummer'

export const SEASON_DAY: Record<Season, number> = {
  midwinter: 355,
  equinox: 79,
  midsummer: 172,
}

export interface SunPosition {
  /** Angle above the horizon, radians. Negative after sunset. */
  altitude: number
  /** Compass bearing of the sun, radians clockwise from north. */
  azimuth: number
}

export function declination(dayOfYear: number): number {
  return -23.44 * DEG * Math.cos(((2 * Math.PI) / 365) * (dayOfYear + 10))
}

export function sunPosition(hours: number, dayOfYear: number, latitude = VESK_LATITUDE): SunPosition {
  const phi = latitude * DEG
  const delta = declination(dayOfYear)
  const h = (hours - 12) * 15 * DEG

  const sinAlt = Math.sin(phi) * Math.sin(delta) + Math.cos(phi) * Math.cos(delta) * Math.cos(h)
  const altitude = Math.asin(Math.max(-1, Math.min(1, sinAlt)))

  // Measured from south, positive towards west; rotate to a compass bearing.
  const fromSouth = Math.atan2(Math.sin(h), Math.cos(h) * Math.sin(phi) - Math.tan(delta) * Math.cos(phi))
  const azimuth = (fromSouth + Math.PI + 2 * Math.PI) % (2 * Math.PI)

  return { altitude, azimuth }
}

/** Sunrise and sunset in solar hours. Polar day/night are clamped to 0–24. */
export function daylight(dayOfYear: number, latitude = VESK_LATITUDE): { rise: number; set: number } {
  const phi = latitude * DEG
  const cosH0 = -Math.tan(phi) * Math.tan(declination(dayOfYear))
  if (cosH0 <= -1) return { rise: 0, set: 24 }
  if (cosH0 >= 1) return { rise: 12, set: 12 }
  const h0 = Math.acos(cosH0) / DEG / 15
  return { rise: 12 - h0, set: 12 + h0 }
}

/**
 * Ground-plane shadow of a vertical object of the given height, in plan view
 * with x = east and y = south (screen coordinates for a north-up map).
 * Returns null when the sun is down.
 */
export function shadowOffset(sun: SunPosition, height: number, maxLength = Infinity): { x: number; y: number } | null {
  if (sun.altitude <= 0.002) return null
  const length = Math.min(height / Math.tan(sun.altitude), maxLength)
  return { x: -Math.sin(sun.azimuth) * length, y: Math.cos(sun.azimuth) * length }
}

export function formatClock(hours: number): string {
  const wrapped = ((hours % 24) + 24) % 24
  let h = Math.floor(wrapped)
  let m = Math.round((wrapped - h) * 60)
  if (m === 60) {
    h = (h + 1) % 24
    m = 0
  }
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`
}

const COMPASS = ['north', 'north-east', 'east', 'south-east', 'south', 'south-west', 'west', 'north-west']

/** Plain-language compass direction for a bearing in radians. */
export function compassWord(bearing: number): string {
  const index = Math.round(((bearing / (2 * Math.PI)) * 8 + 8) % 8) % 8
  return COMPASS[index]
}

export const toDegrees = (radians: number) => radians / DEG
