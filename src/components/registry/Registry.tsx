import { AnimatePresence, LayoutGroup, m } from 'motion/react'
import { useEffect, useRef, useState } from 'react'
import { formatClock } from '../../lib/sun'
import { SpecimenArt } from './SpecimenArt'
import { SpecimenDialog } from './SpecimenDialog'
import { artAspect, CATEGORIES, SPECIMENS, type Category, type Specimen } from './specimens'
import { SectionTitle } from '../SectionTitle'
import './Registry.css'

type Filter = Category | 'All'

function useColumnCount(ref: React.RefObject<HTMLElement | null>) {
  const [count, setCount] = useState(3)
  useEffect(() => {
    const el = ref.current
    if (!el) return
    const ro = new ResizeObserver(([entry]) => {
      const w = entry.contentRect.width
      setCount(w >= 1180 ? 4 : w >= 760 ? 3 : 2)
    })
    ro.observe(el)
    return () => ro.disconnect()
  }, [ref])
  return count
}

/** Shortest-column-first: each card goes where the stack is lowest, by drawing height. */
function distribute(items: Specimen[], columns: number): Specimen[][] {
  const cols: Specimen[][] = Array.from({ length: columns }, () => [])
  const heights = new Array(columns).fill(0)
  for (const item of items) {
    const i = heights.indexOf(Math.min(...heights))
    cols[i].push(item)
    heights[i] += artAspect(item) + 0.62
  }
  return cols
}

export function Registry() {
  const [filter, setFilter] = useState<Filter>('All')
  const [openId, setOpenId] = useState<string | null>(null)
  const gridRef = useRef<HTMLDivElement>(null)
  const columns = useColumnCount(gridRef)

  const items = filter === 'All' ? SPECIMENS : SPECIMENS.filter((s) => s.category === filter)
  const open = SPECIMENS.find((s) => s.id === openId) ?? null
  const filters: { value: Filter; count: number }[] = [
    { value: 'All', count: SPECIMENS.length },
    ...CATEGORIES.map((c) => ({ value: c, count: SPECIMENS.filter((s) => s.category === c).length })),
  ]

  return (
    <section id="registry" className="registry" aria-labelledby="registry-title" data-sun-scope>
      <header className="registry__head">
        <SectionTitle id="registry-title">The register</SectionTitle>
        <p className="registry__intro lede">
          Twelve shadows from the register, drawn from life and lit by the hour. They lengthen as the day goes on.
        </p>
      </header>

      <div className="registry__filters" role="group" aria-label="Filter the register">
        {filters.map((f) => (
          <button
            key={f.value}
            type="button"
            className="registry__filter"
            aria-pressed={filter === f.value}
            onClick={() => setFilter(f.value)}
          >
            {f.value === 'All' ? 'Everything' : f.value}
            <span className="registry__count">{f.count}</span>
          </button>
        ))}
      </div>

      <LayoutGroup>
        <div className="registry__grid" ref={gridRef} style={{ '--cols': columns } as React.CSSProperties}>
          {distribute(items, columns).map((col, i) => (
            <div className="registry__col" key={i}>
              <AnimatePresence mode="popLayout" initial={false}>
                {col.map((s) => (
                  <m.article
                    key={s.id}
                    layoutId={s.id}
                    className="specimen relief"
                    initial={{ opacity: 0, scale: 0.94 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.94 }}
                    transition={{ type: 'spring', stiffness: 380, damping: 36 }}
                  >
                    <p className="specimen__strip tag">
                      <span>Shadow No. {s.registryNo}</span>
                      <span className="specimen__category">{s.category}</span>
                    </p>
                    <SpecimenArt specimen={s} />
                    <div className="specimen__text">
                      <h3 className="specimen__title">
                        <button type="button" className="specimen__open" onClick={() => setOpenId(s.id)}>
                          {s.title}
                        </button>
                      </h3>
                      <p className="specimen__where">{s.where}</p>
                      <p className="specimen__cast tag">
                        Cast {formatClock(s.castFrom)} to {formatClock(s.castUntil)}
                      </p>
                      <p className="specimen__note">{s.note}</p>
                    </div>
                  </m.article>
                ))}
              </AnimatePresence>
            </div>
          ))}
        </div>
      </LayoutGroup>

      <SpecimenDialog specimen={open} onClose={() => setOpenId(null)} />
    </section>
  )
}
