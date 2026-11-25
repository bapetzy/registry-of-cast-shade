import { useEffect, useRef, useState } from 'react'
import { getCity } from '../../lib/city'
import { daylight, SEASON_DAY, type Season } from '../../lib/sun'
import { Docket } from './Docket'
import { computeShadeHours, type ShadeHours } from './renderCity'
import { SunDial } from './SunDial'
import { SurveyMap, type SurveyMode } from './SurveyMap'
import { SectionTitle } from '../SectionTitle'
import './Survey.css'

const SEASONS: { value: Season; label: string }[] = [
  { value: 'midwinter', label: 'Midwinter' },
  { value: 'equinox', label: 'Equinox' },
  { value: 'midsummer', label: 'Midsummer' },
]

const MODES: { value: SurveyMode; label: string }[] = [
  { value: 'now', label: 'Shadows at this hour' },
  { value: 'hours', label: 'Hours of shade' },
]

export function Survey() {
  const city = getCity()
  const [season, setSeason] = useState<Season>('midsummer')
  const [hours, setHours] = useState(15.2)
  const [mode, setMode] = useState<SurveyMode>('now')
  const [selectedId, setSelectedId] = useState<number | null>(null)
  const [playing, setPlaying] = useState(false)
  const [shadeBySeason, setShadeBySeason] = useState<Partial<Record<Season, ShadeHours>>>({})
  const playFrom = useRef(hours)
  const day = SEASON_DAY[season]
  const light = daylight(day)

  const buildings = city.structures.filter((s) => s.kind === 'building').length
  const trees = city.structures.filter((s) => s.kind === 'tree').length

  // Hours-of-shade is a whole-day integration: compute it once per season, in slices so the page stays responsive.
  const shownShade = mode === 'hours' ? (shadeBySeason[season] ?? null) : null
  const needsShade = mode === 'hours' && !shadeBySeason[season]
  const [progress, setProgress] = useState(0)
  useEffect(() => {
    if (!needsShade) return
    const controller = new AbortController()
    computeShadeHours(city, day, { signal: controller.signal, onProgress: setProgress }).then((result) => {
      if (result) setShadeBySeason((prev) => ({ ...prev, [season]: result }))
    })
    return () => controller.abort()
  }, [needsShade, season, city, day])

  // Run the day: sunrise to sunset in twelve seconds, then stop.
  useEffect(() => {
    if (!playing) return
    const end = light.set + 0.5
    const rate = (end - light.rise) / 12
    let h = playFrom.current
    let last = performance.now()
    let frame = requestAnimationFrame(function step(now) {
      h = Math.min(end, h + ((now - last) / 1000) * rate)
      last = now
      setHours(h)
      if (h >= end) setPlaying(false)
      else frame = requestAnimationFrame(step)
    })
    return () => cancelAnimationFrame(frame)
  }, [playing, light.rise, light.set])

  const togglePlay = () => {
    if (mode === 'hours') return
    if (!playing) playFrom.current = hours >= light.set || hours < light.rise ? Math.max(4, light.rise - 0.3) : hours
    setPlaying((p) => !p)
  }

  const structure = selectedId ? city.structures[selectedId - 1] : null

  // On narrow screens the docket sits under the plan; bring it into view when a structure is picked there.
  const docketRef = useRef<HTMLElement>(null)
  const selectFromPlan = (id: number) => {
    setSelectedId(id)
    if (!window.matchMedia('(max-width: 1100px)').matches) return
    const smooth = !window.matchMedia('(prefers-reduced-motion: reduce)').matches
    requestAnimationFrame(() => docketRef.current?.scrollIntoView({ block: 'nearest', behavior: smooth ? 'smooth' : 'auto' }))
  }

  return (
    <section id="survey" className="survey" aria-labelledby="survey-title" data-sun-scope>
      <header className="survey__head">
        <SectionTitle id="survey-title">The survey</SectionTitle>
        <div className="survey__intro prose">
          <p className="lede">
            Central Vesk: {buildings} buildings, {trees} trees, one canal and a clock tower that doubles as a sundial.
          </p>
          <p>
            Every shadow is worked out for 52°24′ N, on the day and at the hour you choose. Hours of shade adds a
            whole day together, to show which streets stay cool.
          </p>
        </div>
      </header>

      <div className="survey__instrument">
        <SurveyMap
          city={city}
          hours={hours}
          day={day}
          mode={mode}
          shade={shownShade}
          selectedId={selectedId}
          onSelect={selectFromPlan}
        />

        {mode === 'hours' && (
          <div className="survey__legend relief" role="status">
            {!shownShade ? (
              <>
                <p className="tag">
                  Surveying the whole day<span aria-hidden="true">, {Math.round(progress * 100)}%</span>
                </p>
                <div className="survey__ramp survey__ramp--progress" aria-hidden="true">
                  <span style={{ width: `${progress * 100}%` }} />
                </div>
              </>
            ) : (
              <>
                <p className="tag">Hours in shade, {SEASONS.find((s) => s.value === season)!.label.toLowerCase()}</p>
                <div className="survey__ramp" aria-hidden="true" />
                <p className="survey__ramp-labels tag">
                  <span>Sun all day</span>
                  <span>Shade all day</span>
                </p>
              </>
            )}
          </div>
        )}

        <Docket
          ref={docketRef}
          city={city}
          structure={structure}
          hours={hours}
          day={day}
          mode={mode}
          onSelect={setSelectedId}
        />

        <div className="survey__controls relief">
          <SunDial
            hours={hours}
            day={day}
            wholeDay={mode === 'hours'}
            onChange={(h) => {
              setPlaying(false)
              setHours(h)
            }}
          />
          <div className="survey__row">
            <button
              type="button"
              className="button survey__play"
              onClick={togglePlay}
              aria-pressed={playing}
              disabled={mode === 'hours'}
            >
              {playing ? 'Stop the day' : 'Run the day'}
            </button>
            <fieldset className="segmented">
              <legend className="visually-hidden">Season</legend>
              {SEASONS.map((s) => (
                <label key={s.value}>
                  <input
                    type="radio"
                    name="season"
                    value={s.value}
                    checked={season === s.value}
                    onChange={() => setSeason(s.value)}
                  />
                  <span>{s.label}</span>
                </label>
              ))}
            </fieldset>
            <fieldset className="segmented">
              <legend className="visually-hidden">Show</legend>
              {MODES.map((m) => (
                <label key={m.value}>
                  <input
                    type="radio"
                    name="survey-mode"
                    value={m.value}
                    checked={mode === m.value}
                    onChange={() => setMode(m.value)}
                  />
                  <span>{m.label}</span>
                </label>
              ))}
            </fieldset>
          </div>
        </div>

      </div>
    </section>
  )
}
