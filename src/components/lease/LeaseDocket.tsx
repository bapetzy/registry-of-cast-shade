import { AnimatePresence, m } from 'motion/react'
import { useId } from 'react'
import type { LeaseRecord } from '../../lib/lease'
import { formatClock } from '../../lib/sun'
import { SpecimenArt } from '../registry/SpecimenArt'
import { SPECIMENS } from '../registry/specimens'

const stampDate = new Intl.DateTimeFormat('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })

function Stamp({ filedAt }: { filedAt: number }) {
  const pathId = useId()
  const date = stampDate.format(filedAt)
  return (
    <m.svg
      className="stamp"
      viewBox="0 0 200 200"
      aria-hidden="true"
      initial={{ scale: 1.7, rotate: -40, opacity: 0 }}
      animate={{ scale: 1, rotate: -14, opacity: 0.92 }}
      exit={{ opacity: 0 }}
      transition={{ type: 'spring', stiffness: 520, damping: 22, mass: 0.9 }}
    >
      <defs>
        <path id={pathId} d="M100 100 m-74 0 a74 74 0 1 1 148 0 a74 74 0 1 1 -148 0" />
      </defs>
      <circle cx="100" cy="100" r="94" fill="none" stroke="currentColor" strokeWidth="5" />
      <circle cx="100" cy="100" r="60" fill="none" stroke="currentColor" strokeWidth="2.5" />
      <text className="stamp__ring">
        {/* Stretched to exactly one lap of the ring (2π × 74). */}
        <textPath href={`#${pathId}`} textLength="458" lengthAdjust="spacing">
          Registry of Cast Shade, City of Vesk,
        </textPath>
      </text>
      <text className="stamp__word" x="100" y="108" textAnchor="middle">
        Filed
      </text>
      <text className="stamp__date" x="100" y="132" textAnchor="middle">
        {date}
      </text>
    </m.svg>
  )
}

export function LeaseDocket({ lease, filed }: { lease: LeaseRecord; filed: boolean }) {
  const specimen = SPECIMENS.find((s) => `specimen-${s.id}` === lease.target.key)

  return (
    <article
      key={filed ? lease.number : 'draft'}
      className="docket-paper"
      data-filed={filed || undefined}
      aria-label={filed ? `Lease ${lease.number}, filed` : 'Lease draft'}
    >
      <header className="docket-paper__head">
        <p className="tag">Registry of Cast Shade</p>
        <p className="docket-paper__form tag">Form R/4</p>
        <p className="docket-paper__number tag">{filed ? lease.number : 'Draft'}</p>
      </header>

      <div className="docket-paper__art">
        {specimen ? (
          <SpecimenArt specimen={specimen} />
        ) : (
          <p className="docket-paper__building tag">Building shadow No. {lease.target.registryNo}</p>
        )}
      </div>

      <h3 className="docket-paper__title">Lease of shadow</h3>
      <dl className="docket-paper__fields">
        <div>
          <dt>Shadow</dt>
          <dd>
            No. {lease.target.registryNo}, {lease.target.label}
          </dd>
        </div>
        <div>
          <dt>Days</dt>
          <dd>{lease.day}s, weekly</dd>
        </div>
        <div>
          <dt>Hours</dt>
          <dd>
            {formatClock(lease.from)} to {formatClock(lease.until)}
          </dd>
        </div>
        <div>
          <dt>Purpose</dt>
          <dd>{lease.purpose}</dd>
        </div>
      </dl>
      <p className="docket-paper__small">
        The lessee may stand, sit or lie in the shadow during these hours. The Registry does not promise sun. In
        cloud the lease is suspended, not refunded: nothing was cast.
      </p>

      <footer className="docket-paper__sign">
        <div>
          <span className="docket-paper__signature">{lease.lessee}</span>
          <span className="docket-paper__line">Lessee</span>
        </div>
        <div>
          <span className="docket-paper__signature">{filed ? 'pp. Registrar' : ''}</span>
          <span className="docket-paper__line">Clerk of the Register</span>
        </div>
      </footer>

      <AnimatePresence>{filed && <Stamp key={lease.number} filedAt={lease.filedAt} />}</AnimatePresence>
    </article>
  )
}
