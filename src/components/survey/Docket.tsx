import { AnimatePresence, m, useReducedMotion } from 'motion/react'
import { castShadow, shadowLength, type City, type Structure } from '../../lib/city'
import { polygonArea } from '../../lib/geometry'
import { roundToHalfHour, useLeaseDesk } from '../../lib/lease'
import { compassWord, daylight, formatClock, sunPosition } from '../../lib/sun'

interface Props {
  city: City
  structure: Structure | null
  hours: number
  day: number
  /** In hours-of-shade mode there is no chosen hour, so the docket reports solar noon. */
  mode: 'now' | 'hours'
  onSelect: (id: number | null) => void
  ref?: React.Ref<HTMLElement>
}

const LANDMARKS = ['Gnomon Square clock tower', 'Registry of Cast Shade']

const number = new Intl.NumberFormat('en-GB', { maximumFractionDigits: 0 })

export function Docket({ city, structure, hours, day, mode, onSelect, ref }: Props) {
  const { request } = useLeaseDesk()
  const reduce = useReducedMotion()
  const atNoon = mode === 'hours'
  const sun = sunPosition(atNoon ? 12 : hours, day)
  const light = daylight(day)

  const landmarks = city.structures.filter((s) => LANDMARKS.includes(s.name))
  const pickRandom = () => {
    const buildings = city.structures.filter((s) => s.kind === 'building')
    onSelect(buildings[Math.floor(Math.random() * buildings.length)].id)
  }

  let body: React.ReactNode
  if (!structure) {
    body = (
      <m.div
        key="empty"
        className="docket__empty"
        initial={reduce ? false : { opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
      >
        <p>Select any building or tree on the plan to open its docket.</p>
        <div className="docket__picks">
          {landmarks.map((s) => (
            <button key={s.id} type="button" className="docket__pick" onClick={() => onSelect(s.id)}>
              {s.name}
            </button>
          ))}
          <button type="button" className="docket__pick" onClick={pickRandom}>
            A building at random
          </button>
        </div>
      </m.div>
    )
  } else {
    const length = shadowLength(structure, sun)
    const shadow = castShadow(structure, sun)
    const area = shadow ? polygonArea(shadow) - polygonArea(structure.footprint) : 0
    const pointing = (sun.azimuth + Math.PI) % (2 * Math.PI)
    body = (
      <m.div
        key={structure.id}
        initial={reduce ? false : { opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -8 }}
        transition={{ duration: 0.25, ease: [0.2, 0.8, 0.2, 1] }}
      >
        <p className="docket__no tag">Shadow No. {structure.registryNo}</p>
        <h3 className="docket__name">{structure.name}</h3>
        <p className="docket__address">{structure.address}</p>
        <dl className="docket__facts">
          <div>
            <dt>Height</dt>
            <dd>{structure.height} m</dd>
          </div>
          <div>
            <dt>Shadow at {atNoon ? 'solar noon' : formatClock(hours)}</dt>
            <dd>{length === null ? 'None, the sun is down' : `${number.format(length)} m, falling ${compassWord(pointing)}`}</dd>
          </div>
          <div>
            <dt>Ground covered</dt>
            <dd>{shadow ? `${number.format(area)} m²` : 'None'}</dd>
          </div>
          <div>
            <dt>Cast between</dt>
            <dd>
              {formatClock(light.rise)} and {formatClock(light.set)}
            </dd>
          </div>
        </dl>
        <p className="docket__note">{structure.note}</p>
        <div className="docket__actions">
          <a
            className="button button--solid"
            href="#lease"
            onClick={() =>
              request({
                key: `structure-${structure.id}`,
                registryNo: structure.registryNo,
                label: `${structure.name}, ${structure.address}`,
                castFrom: roundToHalfHour(light.rise, 'up'),
                castUntil: roundToHalfHour(light.set, 'down'),
              })
            }
          >
            Lease this shadow
          </a>
          <button type="button" className="docket__close" onClick={() => onSelect(null)}>
            Close docket
          </button>
        </div>
      </m.div>
    )
  }

  return (
    <aside ref={ref} className="docket relief" aria-label="Docket">
      <AnimatePresence mode="wait" initial={false}>
        {body}
      </AnimatePresence>
    </aside>
  )
}
