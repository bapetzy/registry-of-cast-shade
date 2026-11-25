import { m } from 'motion/react'
import { useEffect, useId, useRef } from 'react'
import { useLeaseDesk } from '../../lib/lease'
import { formatClock } from '../../lib/sun'
import { SpecimenArt } from './SpecimenArt'
import type { Specimen } from './specimens'

const DAY_START = 4
const DAY_END = 22
const pct = (h: number) => `${((h - DAY_START) / (DAY_END - DAY_START)) * 100}%`

/** When in the day the shadow exists, on a 04–22 strip. */
function CastHours({ from, until }: { from: number; until: number }) {
  return (
    <figure className="cast-hours">
      <figcaption className="tag">
        Cast {formatClock(from)} to {formatClock(until)}
      </figcaption>
      <div className="cast-hours__strip" aria-hidden="true">
        <span className="cast-hours__span" style={{ left: pct(from), width: `calc(${pct(until)} - ${pct(from)})` }} />
      </div>
      <div className="cast-hours__ticks tag" aria-hidden="true">
        {[4, 8, 12, 16, 20].map((h) => (
          <span key={h} style={{ left: pct(h) }}>
            {String(h).padStart(2, '0')}
          </span>
        ))}
      </div>
    </figure>
  )
}

export function SpecimenDialog({ specimen, onClose }: { specimen: Specimen | null; onClose: () => void }) {
  const ref = useRef<HTMLDialogElement>(null)
  const titleId = useId()
  const { request } = useLeaseDesk()

  useEffect(() => {
    const dialog = ref.current
    if (!dialog) return
    if (specimen && !dialog.open) dialog.showModal()
    if (!specimen && dialog.open) dialog.close()
  }, [specimen])

  return (
    <dialog
      ref={ref}
      className="specimen-dialog"
      aria-labelledby={titleId}
      onClose={onClose}
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      {specimen && (
        <m.div
          key={specimen.id}
          className="specimen-dialog__body"
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.32, ease: [0.2, 0.8, 0.2, 1] }}
        >
          <div className="specimen-dialog__art">
            <SpecimenArt specimen={specimen} />
          </div>
          <div className="specimen-dialog__text">
            <p className="specimen__no tag">Shadow No. {specimen.registryNo}</p>
            <h3 id={titleId} className="specimen-dialog__title">
              {specimen.title}
            </h3>
            <p className="specimen__where">{specimen.where}</p>
            <p className="specimen-dialog__detail">{specimen.detail}</p>
            <CastHours from={specimen.castFrom} until={specimen.castUntil} />
            <div className="specimen-dialog__actions">
              {specimen.unavailable ? (
                <p className="specimen-dialog__unavailable">{specimen.unavailable}</p>
              ) : (
                <a
                  className="button button--solid"
                  href="#lease"
                  onClick={() => {
                    request({
                      key: `specimen-${specimen.id}`,
                      registryNo: specimen.registryNo,
                      label: `${specimen.title}, ${specimen.where}`,
                      castFrom: specimen.castFrom,
                      castUntil: specimen.castUntil,
                    })
                    onClose()
                  }}
                >
                  Lease this shadow
                </a>
              )}
              <button type="button" className="specimen-dialog__close" onClick={onClose}>
                Close
              </button>
            </div>
          </div>
        </m.div>
      )}
    </dialog>
  )
}
