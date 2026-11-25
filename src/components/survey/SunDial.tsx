import { useId, useMemo } from 'react'
import { compassWord, formatClock, sunPosition, toDegrees } from '../../lib/sun'

const START = 4
const END = 22
const W = 600
const BASE = 104
const X = (h: number) => 24 + ((h - START) / (END - START)) * (W - 48)
const Y = (altDeg: number) => BASE - (altDeg / 66) * 92

interface Props {
  hours: number
  day: number
  onChange: (hours: number) => void
  /** Hours-of-shade mode: the whole day counts, so the dial shows the span instead of an hour. */
  wholeDay?: boolean
}

/**
 * The time control is the sun's own path: a plot of its altitude through the
 * chosen day. A native range input sits over it, so dragging, clicking and
 * the arrow keys all work without custom pointer code.
 */
export function SunDial({ hours, day, onChange, wholeDay = false }: Props) {
  const labelId = useId()
  const { up, down, span } = useMemo(() => {
    // Daylight is drawn solid, night dotted; each run starts with a move.
    // `span` closes the daylight run against the horizon: the area of a whole day.
    const paths = { up: '', down: '', span: '' }
    let prev: 'up' | 'down' | null = null
    for (let h = START; h <= END + 0.001; h += 0.1) {
      const alt = toDegrees(sunPosition(h, day).altitude)
      const run = alt >= 0 ? 'up' : 'down'
      const pt = `${X(h).toFixed(1)} ${Y(alt).toFixed(1)}`
      if (prev && prev !== run) paths[prev] += `L${pt}`
      paths[run] += `${run === prev ? 'L' : 'M'}${pt}`
      if (run === 'up') paths.span += paths.span ? `L${pt}` : `M${X(h).toFixed(1)} ${BASE}L${pt}`
      prev = run
    }
    paths.span += `V${BASE}Z`
    return paths
  }, [day])

  const sun = sunPosition(hours, day)
  const alt = toDegrees(sun.altitude)
  const isUp = alt > 0
  const x = X(hours)
  const y = Y(alt)
  const valueText = isUp
    ? `${formatClock(hours)}, sun ${Math.round(alt)} degrees above the ${compassWord(sun.azimuth)} horizon`
    : `${formatClock(hours)}, sun below the horizon`

  return (
    <div className="sundial">
      <p id={labelId} className="sundial__label tag">
        {wholeDay ? (
          <>
            Sunrise to sunset <span className="sundial__time">All day</span>
          </>
        ) : (
          <>
            Drag the sun to set the hour <span className="sundial__time">{formatClock(hours)}</span>
          </>
        )}
      </p>
      <div className="sundial__plot">
        <svg viewBox={`0 0 ${W} 150`} aria-hidden="true">
          <line className="sundial__horizon" x1="0" x2={W} y1={BASE} y2={BASE} />
          {Array.from({ length: (END - START) / 2 + 1 }, (_, i) => START + i * 2).map((h) => (
            <g key={h}>
              <line className="sundial__tick" x1={X(h)} x2={X(h)} y1={BASE} y2={BASE + 6} />
              <text className="sundial__hour" x={X(h)} y={146} textAnchor="middle">
                {String(h).padStart(2, '0')}
              </text>
            </g>
          ))}
          {wholeDay && <path className="sundial__span" d={span} />}
          <path className="sundial__night" d={down} />
          <path className="sundial__path" d={up} />
          {!wholeDay && (
            <g>
              <line className="sundial__stick" x1={x} x2={x} y1={Math.min(y, BASE)} y2={BASE} />
              {/* Grip arrows: the sun slides along its path. */}
              <path className="sundial__grip" d={`M${x - 19} ${y}l7 -6v12z M${x + 19} ${y}l-7 -6v12z`} />
              <circle className={isUp ? 'sundial__sun' : 'sundial__sun is-down'} cx={x} cy={y} r="10" />
            </g>
          )}
        </svg>
        <input
          className="sundial__input"
          type="range"
          min={START}
          max={END}
          step={1 / 60}
          value={hours}
          aria-labelledby={labelId}
          aria-valuetext={valueText}
          disabled={wholeDay}
          onChange={(e) => onChange(Number(e.target.value))}
        />
      </div>
    </div>
  )
}
