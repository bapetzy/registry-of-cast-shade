import type { ReactNode } from 'react'

/**
 * Specimens drawn in a ground-origin coordinate system: x is centred on 0,
 * the ground is y = 0 and everything stands in negative y. That lets every
 * cast shadow share one transform origin. Fills and strokes use currentColor
 * so the same drawing renders as ink (object) and as ultramarine (shadow).
 * Elements with className "detail" only appear on the object, never in its shadow.
 */

export type Category = 'Street furniture' | 'Living things' | 'Buildings' | 'Temporary'

export interface Specimen {
  id: string
  registryNo: string
  title: string
  where: string
  category: Category
  /** Tallest point of the drawing above the ground, in drawing units. */
  top: number
  castFrom: number
  castUntil: number
  note: string
  detail: string
  /** Why this shadow cannot be leased, if it cannot. */
  unavailable?: string
  art: ReactNode
}

const S = { fill: 'none', stroke: 'currentColor', strokeLinecap: 'round', strokeLinejoin: 'round' } as const

export const SPECIMENS: Specimen[] = [
  {
    id: 'lamppost',
    registryNo: '5012',
    title: 'Lamppost',
    where: 'Outside 9 Lantern Street',
    category: 'Street furniture',
    top: 214,
    castFrom: 6,
    castUntil: 20,
    note: 'Thin as a pencil line at noon. By seven in the evening it reaches the bakery door.',
    detail:
      'Cast iron, painted green in 1961 and black ever since. Its shadow is narrow enough that most lessees use it for one foot at a time, which the Registry allows.',
    art: (
      <g fill="currentColor">
        <rect x="-11" y="-26" width="22" height="26" />
        <rect x="-3.5" y="-204" width="7" height="190" />
        <rect x="-7" y="-212" width="14" height="10" />
        <path d="M0 -190 Q20 -210 42 -194 L42 -189 Q20 -202 0 -183 Z" />
        <rect x="35" y="-194" width="12" height="6" />
        <path d="M31 -188 h20 l-4 26 h-12 z" />
        <rect x="38" y="-160" width="6" height="4" />
      </g>
    ),
  },
  {
    id: 'umbrella',
    registryNo: '5108',
    title: 'Café umbrella and table',
    where: 'Gnomon Square, north side',
    category: 'Temporary',
    top: 168,
    castFrom: 10,
    castUntil: 18,
    note: 'Opened at ten, closed at six, taken in when it rains. The shade goes with it.',
    detail:
      'The café holds a standing lease on its own umbrella’s shadow, which the Registry considers unusual but not improper. Customers who sit outside the shadow are charged the same.',
    art: (
      <g fill="currentColor">
        <rect x="-2.5" y="-158" width="5" height="158" />
        <path d="M-88 -132 Q0 -182 88 -132 q-11 7 -22 0 q-11 7 -22 0 q-11 7 -22 0 q-11 7 -22 0 q-11 7 -22 0 q-11 7 -22 0 q-11 7 -22 0 q-11 7 -22 0 Z" />
        <rect x="-38" y="-62" width="76" height="6" />
        <rect x="-16" y="-4" width="32" height="4" />
        <path d="M-82 0 v-44 h-4 v-38 h5 v34 h22 v48 h-4 v-40 h-15 v40 z" />
        <path d="M82 0 v-44 h4 v-38 h-5 v34 h-22 v48 h4 v-40 h15 v40 z" />
      </g>
    ),
  },
  {
    id: 'plane-tree',
    registryNo: '5220',
    title: 'London plane',
    where: 'Umber Park, by the chess tables',
    category: 'Living things',
    top: 226,
    castFrom: 6,
    castUntil: 20,
    note: 'The largest leaf shadow in the city. Leased to the chess players on alternate afternoons.',
    detail:
      'A dappled shadow, which the Registry measures at sixty per cent of a solid one. In October the lease is renegotiated leaf by leaf, and by December there is nothing left to lease.',
    art: (
      <g fill="currentColor">
        <path d="M-10 0 L-7 -92 L-26 -128 L-18 -132 L-2 -104 L2 -140 L11 -138 L7 -98 L28 -124 L34 -118 L9 -86 L10 0 Z" />
        <circle cx="-46" cy="-160" r="40" />
        <circle cx="6" cy="-186" r="40" />
        <circle cx="52" cy="-152" r="38" />
        <circle cx="-8" cy="-140" r="36" />
        <circle cx="32" cy="-128" r="28" />
        <circle cx="-62" cy="-128" r="26" />
      </g>
    ),
  },
  {
    id: 'cat',
    registryNo: '5301',
    title: 'Cat',
    where: 'Steps of 41 Weir Street',
    category: 'Living things',
    top: 98,
    castFrom: 11,
    castUntil: 15,
    note: 'Registered under protest. Moves without notice.',
    detail:
      'The Registry measured this shadow on four occasions and got four different shapes. It is kept on file because the street asked for it, not because anyone can hold it still.',
    unavailable: 'Application refused. The cat has not agreed.',
    art: (
      <g fill="currentColor">
        <path d="M-26 0 C-32 -28 -28 -58 -14 -72 L-20 -96 L-7 -84 L4 -84 L13 -96 L12 -72 C22 -60 26 -30 22 0 Z" />
        <path d="M20 -2 C48 -4 58 -20 48 -40 C46 -28 36 -14 18 -12 Z" />
      </g>
    ),
  },
  {
    id: 'ladder',
    registryNo: '5377',
    title: 'Stepladder',
    where: 'Against 3 Brass Row',
    category: 'Temporary',
    top: 176,
    castFrom: 8,
    castUntil: 17,
    note: 'Left by a painter in April. Its shadow has been claimed by a pigeon.',
    detail:
      'Lessees should know the shadow is mostly gaps. The Registry charges for the rungs only, at the rate for street furniture.',
    art: (
      <g>
        <g {...S} strokeWidth="6">
          <path d="M-34 0 L-5 -156" />
          <path d="M34 0 L5 -156" />
          <path d="M-26 -42 H26 M-19 -82 H19 M-12 -120 H12" />
        </g>
        <g fill="currentColor">
          <rect x="-12" y="-162" width="24" height="8" />
          <rect x="2" y="-176" width="16" height="14" />
        </g>
      </g>
    ),
  },
  {
    id: 'bicycle',
    registryNo: '5410',
    title: 'Bicycle',
    where: 'Railings of the public library',
    category: 'Temporary',
    top: 112,
    castFrom: 8.5,
    castUntil: 17.5,
    note: 'Locked up most weekdays. Its shadow is largely holes.',
    detail:
      'The owner has been informed that the bicycle casts a registered shadow and has asked whether this affects the insurance. It does not.',
    art: (
      <g {...S} strokeWidth="5">
        <circle cx="-52" cy="-36" r="33" />
        <circle cx="52" cy="-36" r="33" />
        <path d="M-52 -36 L-8 -36 L28 -84 L-20 -84 Z M-8 -36 L-24 -96" />
        <path d="M52 -36 L32 -98 L50 -104" />
        <path d="M-36 -98 H-14" strokeWidth="7" />
      </g>
    ),
  },
  {
    id: 'pillar-box',
    registryNo: '5466',
    title: 'Pillar box',
    where: 'Corner of Kiln Road and Wick Street',
    category: 'Street furniture',
    top: 134,
    castFrom: 6,
    castUntil: 20,
    note: 'Collections at nine and four. The shadow is collected at sunset.',
    detail:
      'A dependable shadow, round and dark, about the width of a person. Popular with people waiting for someone who is late.',
    art: (
      <g fill="currentColor">
        <rect x="-24" y="-10" width="48" height="10" />
        <rect x="-20" y="-112" width="40" height="104" />
        <path d="M-25 -110 Q0 -144 25 -110 Z" />
        <rect className="detail" x="-12" y="-92" width="24" height="4" fill="var(--chalk)" />
      </g>
    ),
  },
  {
    id: 'clock-tower',
    registryNo: '0879',
    title: 'Clock tower',
    where: 'Gnomon Square',
    category: 'Buildings',
    top: 330,
    castFrom: 5,
    castUntil: 21,
    note: 'The longest regular shadow in the city, and its most reliable clock.',
    detail:
      'The square around the tower is marked with hour lines. Its shadow is leased by the half hour, like every other, and is never late.',
    art: (
      <g fill="currentColor">
        <rect x="-22" y="-12" width="44" height="12" />
        <rect x="-17" y="-262" width="34" height="252" />
        <rect x="-22" y="-282" width="44" height="22" />
        <path d="M-22 -282 L0 -330 L22 -282 Z" />
        <circle className="detail" cx="0" cy="-232" r="11" fill="var(--chalk)" />
      </g>
    ),
  },
  {
    id: 'waiting',
    registryNo: '5531',
    title: 'Man waiting for the 41 tram',
    where: 'Tram stop, Meridian Boulevard',
    category: 'Temporary',
    top: 196,
    castFrom: 7.5,
    castUntil: 8.5,
    note: 'Present on weekday mornings. The shadow leaves on the tram.',
    detail:
      'He has stood at this stop at the same time for long enough that the Registry gave his shadow a number. He was told, and said he did not mind as long as nobody stood in it.',
    art: (
      <g fill="currentColor">
        <circle cx="-14" cy="-150" r="10" />
        <rect x="-28" y="-163" width="28" height="4" />
        <rect x="-23" y="-178" width="18" height="16" />
        <path d="M-32 -138 L4 -138 L8 -58 L-1 -58 L-3 0 L-10 0 L-12 -58 L-16 -58 L-18 0 L-25 0 L-27 -58 L-36 -58 Z" />
        <rect x="34" y="-176" width="4" height="176" />
        <rect x="24" y="-196" width="24" height="20" />
      </g>
    ),
  },
  {
    id: 'washing',
    registryNo: '5604',
    title: 'Washing line',
    where: 'Courtyard behind 22 Tallow Street',
    category: 'Temporary',
    top: 160,
    castFrom: 9,
    castUntil: 16,
    note: 'Mondays only. Sheets give the best shade; socks are not worth applying for.',
    detail:
      'The shadow changes shape with the wash. Lessees are asked to accept whatever is hanging that day, and the Registry accepts no complaints about towels.',
    art: (
      <g>
        <g fill="currentColor">
          <rect x="-94" y="-158" width="5" height="158" />
          <rect x="89" y="-158" width="5" height="158" />
          <path d="M-74 -138 L-30 -133 L-28 -58 L-76 -64 Z" />
          <path d="M-18 -132 L-4 -132 L0 -126 L4 -132 L18 -132 L28 -116 L20 -110 L16 -116 L16 -86 L-14 -86 L-14 -116 L-20 -110 L-28 -116 Z" />
          <path d="M34 -132 L64 -134 L66 -98 L34 -96 Z" />
          <path d="M72 -136 L78 -136 L78 -120 L84 -116 L82 -112 L72 -116 Z" />
        </g>
        <path d="M-92 -152 Q0 -122 92 -152" {...S} strokeWidth="2" />
      </g>
    ),
  },
  {
    id: 'bench',
    registryNo: '5672',
    title: 'Bench',
    where: 'Meridian Boulevard, under the fourth lime tree',
    category: 'Street furniture',
    top: 84,
    castFrom: 15,
    castUntil: 20,
    note: 'Sits in a lime tree’s shadow until three. After that it casts its own.',
    detail:
      'Only the afternoon portion is registered; the morning belongs to the tree. People who lease both sit in two shadows at once.',
    art: (
      <g fill="currentColor">
        <rect x="-70" y="-44" width="140" height="7" />
        <rect x="-70" y="-78" width="140" height="7" />
        <rect x="-70" y="-64" width="140" height="7" />
        <rect x="-62" y="-78" width="5" height="78" />
        <rect x="57" y="-78" width="5" height="78" />
        <rect x="-74" y="-50" width="14" height="5" />
        <rect x="60" y="-50" width="14" height="5" />
      </g>
    ),
  },
  {
    id: 'weathervane',
    registryNo: '5733',
    title: 'Weathervane',
    where: 'Roof of the Chandlers’ Hall',
    category: 'Buildings',
    top: 196,
    castFrom: 6,
    castUntil: 20,
    note: 'Turns with the wind, so its shadow never falls the same way twice.',
    detail:
      'Measured from the roof ridge, not the street. The arrow’s shadow is leased by the half hour to the roofer, who uses it to tell which way to lean.',
    art: (
      <g fill="currentColor">
        <rect x="-26" y="-92" width="52" height="92" />
        <rect x="-30" y="-100" width="60" height="10" />
        <rect x="-10" y="-114" width="20" height="16" />
        <rect x="-2" y="-176" width="4" height="64" />
        <path d="M-48 -164 L28 -164 L28 -170 L50 -160 L28 -150 L28 -156 L-48 -156 L-56 -150 L-52 -160 L-56 -170 Z" />
        <rect x="-16" y="-136" width="32" height="3" />
        <circle cx="0" cy="-180" r="4" />
      </g>
    ),
  },
]

export const CATEGORIES: Category[] = ['Street furniture', 'Living things', 'Buildings', 'Temporary']

/** Every drawing shares one width so specimens stay at the same scale. */
export const ART = { halfWidth: 120, headroom: 18, foreground: 72 }

export const artAspect = (s: Specimen) => (s.top + ART.headroom + ART.foreground) / (ART.halfWidth * 2)
