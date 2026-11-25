import { createContext, useContext } from 'react'

/** Anything that casts a shadow the Registry will lease. */
export interface LeaseTarget {
  key: string
  registryNo: string
  label: string
  /** Hours (decimal, local solar time) during which the shadow exists. */
  castFrom: number
  castUntil: number
}

export interface LeaseRecord {
  number: string
  target: LeaseTarget
  day: string
  from: number
  until: number
  purpose: string
  lessee: string
  filedAt: number
}

export interface LeaseDesk {
  /** Shadows picked elsewhere on the page that the desk should offer first. */
  requested: LeaseTarget | null
  request: (target: LeaseTarget) => void
}

export const LeaseContext = createContext<LeaseDesk>({ requested: null, request: () => {} })

export const useLeaseDesk = () => useContext(LeaseContext)

export const roundToHalfHour = (h: number, direction: 'up' | 'down') =>
  direction === 'up' ? Math.ceil(h * 2) / 2 : Math.floor(h * 2) / 2

/** Deterministic lease number from its terms, so the same lease reads the same. */
export function leaseNumber(parts: (string | number)[]): string {
  let h = 2166136261
  for (const ch of parts.join('|')) {
    h ^= ch.charCodeAt(0)
    h = Math.imul(h, 16777619)
  }
  return `L-${String((h >>> 0) % 100000).padStart(5, '0')}`
}
