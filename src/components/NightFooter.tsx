import { useMemo, useRef } from 'react'
import { getCity, skyline, WORLD } from '../lib/city'
import { seededRandom } from '../lib/random'
import { SPECIMENS } from './registry/specimens'
import './NightFooter.css'

const STEP = 2
const SKY_HEIGHT = 80

/** The skyline as one stepped path, plus a scatter of lit windows. */
function useSkyline() {
  return useMemo(() => {
    const heights = skyline(getCity(), STEP)
    let d = `M0 0`
    heights.forEach((h, i) => (d += `V${(-h).toFixed(1)}H${(i + 1) * STEP}`))
    d += 'V0Z'
    const rng = seededRandom(1931)
    const windows: { x: number; y: number }[] = []
    for (let tries = 0; windows.length < 90 && tries < 2000; tries++) {
      const i = rng.int(0, heights.length - 1)
      if (heights[i] < 14) continue
      windows.push({ x: i * STEP, y: -heights[i] * rng.range(0.25, 0.8) })
    }
    return { d, windows }
  }, [])
}

/** Every number on file, in register order, unfiled for the night. */
function useNumbers() {
  return useMemo(() => {
    const all = [...getCity().structures.map((s) => s.registryNo), ...SPECIMENS.map((s) => s.registryNo)]
    return all.map((n) => `No. ${n}`).join('   ')
  }, [])
}

/**
 * Sunset. The city is seen for the first time in elevation, its skyline
 * built from the same buildings as the survey, and the page's sun goes down
 * behind it as the reader scrolls. After that the pointer carries a lamp.
 */
export function NightFooter() {
  const ref = useRef<HTMLElement>(null)
  const { d, windows } = useSkyline()
  const numbers = useNumbers()

  const move = (e: React.PointerEvent) => {
    const el = ref.current
    if (!el) return
    const r = el.getBoundingClientRect()
    el.style.setProperty('--lamp-x', `${e.clientX - r.left}px`)
    el.style.setProperty('--lamp-y', `${e.clientY - r.top}px`)
  }

  return (
    <footer ref={ref} className="night" onPointerMove={move} onPointerDown={move} data-sun-scope>
      <div className="night__sky" aria-hidden="true">
        <div className="night__sun" />
        <svg className="night__skyline" viewBox={`0 ${-SKY_HEIGHT} ${WORLD.width} ${SKY_HEIGHT}`} preserveAspectRatio="none">
          <path d={d} />
          {windows.map((w, i) => (
            <rect key={i} className="night__window" x={w.x} y={w.y} width="2.4" height="2.2" />
          ))}
        </svg>
      </div>

      <div className="night__body">
        <div className="night__field" aria-hidden="true">
          <p className="night__numbers">{numbers}</p>
          <p className="night__numbers night__numbers--lit">{numbers}</p>
        </div>

        <div className="night__content">
          <p className="night__title display">The Registry closes at sunset.</p>
          <p className="night__lede">
            After dark no shadow is cast, so none can be filed.{' '}
            <span className="night__hint-pointer">Carry the lamp about if you want to read the register anyway.</span>
            <span className="night__hint-touch">Touch the dark to carry a lamp and read the register anyway.</span>
          </p>
          <nav className="night__nav" aria-label="Back to the sections">
            <a href="#survey">The survey</a>
            <a href="#registry">The register</a>
            <a href="#lease">Lease a shadow</a>
            <a href="#bylaws">Bylaws</a>
            <a href="#top">Back to sunrise</a>
          </nav>
          <p className="night__colophon">
            Vesk and its shadows on file are invented. The sun is not: its position is calculated for 52°24′ N.
            Type: Big Shoulders and Source Serif 4.
          </p>
        </div>
      </div>
    </footer>
  )
}
