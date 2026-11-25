import { AnimatePresence, m } from 'motion/react'
import { useEffect, useId, useMemo, useRef, useState } from 'react'
import { leaseNumber, useLeaseDesk, type LeaseRecord, type LeaseTarget } from '../../lib/lease'
import { formatClock } from '../../lib/sun'
import { SPECIMENS } from '../registry/specimens'
import { LeaseDocket } from './LeaseDocket'
import { SectionTitle } from '../SectionTitle'
import './Lease.css'

const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday']
const PURPOSES = ['Reading', 'Napping', 'Keeping a pram cool', 'Waiting for someone', 'Thinking']
const STORAGE_KEY = 'vesk-registry-leases'

const SPECIMEN_TARGETS: LeaseTarget[] = SPECIMENS.filter((s) => !s.unavailable).map((s) => ({
  key: `specimen-${s.id}`,
  registryNo: s.registryNo,
  label: `${s.title}, ${s.where}`,
  castFrom: s.castFrom,
  castUntil: s.castUntil,
}))

function halfHours(from: number, until: number) {
  const out: number[] = []
  for (let h = Math.ceil(from * 2) / 2; h <= until + 1e-6; h += 0.5) out.push(h)
  return out
}

function loadLeases(): LeaseRecord[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    return raw ? (JSON.parse(raw) as LeaseRecord[]) : []
  } catch {
    return []
  }
}

function saveLeases(leases: LeaseRecord[]) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(leases))
  } catch {
    // Private mode or storage disabled: leases simply last until the tab closes.
  }
}

type Errors = Partial<Record<'lessee' | 'hours', string>>

export function LeaseDesk() {
  const { requested } = useLeaseDesk()
  const targets = useMemo(
    () => (requested && !SPECIMEN_TARGETS.some((t) => t.key === requested.key) ? [requested, ...SPECIMEN_TARGETS] : SPECIMEN_TARGETS),
    [requested],
  )

  const [targetKey, setTargetKey] = useState(SPECIMEN_TARGETS[0].key)
  const [day, setDay] = useState('Tuesday')
  const [from, setFrom] = useState(15)
  const [until, setUntil] = useState(16.5)
  const [purpose, setPurpose] = useState(PURPOSES[0])
  const [lessee, setLessee] = useState('')
  const [errors, setErrors] = useState<Errors>({})
  const [filed, setFiled] = useState<LeaseRecord | null>(null)
  const [status, setStatus] = useState('')
  const [leases, setLeases] = useState<LeaseRecord[]>(loadLeases)
  const nameRef = useRef<HTMLInputElement>(null)
  const fromRef = useRef<HTMLSelectElement>(null)
  const targetRef = useRef<HTMLSelectElement>(null)
  const paperRef = useRef<HTMLDivElement>(null)
  const fileTitleRef = useRef<HTMLHeadingElement>(null)
  const ids = { lessee: useId(), hours: useId(), target: useId() }

  const target = targets.find((t) => t.key === targetKey) ?? targets[0]

  // Keep the chosen hours inside the window this shadow is actually cast.
  const selectTarget = (key: string) => {
    const next = targets.find((t) => t.key === key) ?? targets[0]
    setTargetKey(next.key)
    setFiled(null)
    const f = Math.min(Math.max(from, next.castFrom), next.castUntil - 0.5)
    setFrom(f)
    setUntil(Math.min(Math.max(until, f + 0.5), next.castUntil))
  }

  // A shadow picked in the survey or the register arrives here pre-selected.
  const [seenRequest, setSeenRequest] = useState<LeaseTarget | null>(null)
  if (requested && requested !== seenRequest) {
    setSeenRequest(requested)
    setTargetKey(requested.key)
    setFiled(null)
    const f = Math.min(Math.max(from, requested.castFrom), requested.castUntil - 0.5)
    setFrom(f)
    setUntil(Math.min(Math.max(until, f + 0.5), requested.castUntil))
  }

  // Arriving from a docket or the register, the reader lands on the shadow they chose.
  // Deferred two frames: a closing <dialog> restores focus to its opener first.
  useEffect(() => {
    if (!seenRequest) return
    let inner = 0
    const outer = requestAnimationFrame(() => {
      inner = requestAnimationFrame(() => targetRef.current?.focus({ preventScroll: true }))
    })
    return () => {
      cancelAnimationFrame(outer)
      cancelAnimationFrame(inner)
    }
  }, [seenRequest])

  useEffect(() => saveLeases(leases), [leases])

  const number = leaseNumber([target.key, day, from, until, purpose, lessee.trim()])
  const draft: LeaseRecord = { number, target, day, from, until, purpose, lessee: lessee.trim(), filedAt: 0 }

  const edit = <T,>(setter: (v: T) => void) => (v: T) => {
    setter(v)
    setFiled(null)
    setStatus('')
  }

  const editHours = (setter: (v: number) => void) => (v: number) => {
    edit(setter)(v)
    if (errors.hours) setErrors((x) => ({ ...x, hours: undefined }))
  }

  const submit = (e: React.FormEvent) => {
    e.preventDefault()
    const next: Errors = {}
    if (!lessee.trim()) next.lessee = 'A lease must be made out to someone. Write a name.'
    if (until <= from) next.hours = `“Until” must come after “From”. This shadow is cast ${formatClock(target.castFrom)} to ${formatClock(target.castUntil)} only.`
    setErrors(next)
    if (next.lessee) return nameRef.current?.focus()
    if (next.hours) return fromRef.current?.focus()
    const existing = leases.find((l) => l.number === draft.number)
    if (existing) {
      setFiled(existing)
      setStatus(`Already on file as ${existing.number}.`)
    } else {
      const record = { ...draft, filedAt: Date.now() }
      setFiled(record)
      setLeases((prev) => [record, ...prev])
      setStatus(`Lease ${record.number} filed. In force from ${record.day}.`)
    }
    // On narrow screens the paper sits below the form: bring the stamp into view.
    const smooth = !window.matchMedia('(prefers-reduced-motion: reduce)').matches
    requestAnimationFrame(() => paperRef.current?.scrollIntoView({ block: 'nearest', behavior: smooth ? 'smooth' : 'auto' }))
  }

  const withdraw = (number: string) => {
    setLeases((prev) => prev.filter((x) => x.number !== number))
    if (filed?.number === number) setFiled(null)
    setStatus(`Lease ${number} withdrawn.`)
    fileTitleRef.current?.focus()
  }

  return (
    <section id="lease" className="lease" aria-labelledby="lease-title" data-sun-scope>
      <header className="lease__head">
        <SectionTitle id="lease-title">Lease a shadow</SectionTitle>
        <p className="lede">
          You are standing in the shade now. Choose a shadow, a day and the hours, and the Registry will make out
          the lease while you wait.
        </p>
      </header>

      <div className="lease__desk">
        <form className="lease__form" onSubmit={submit} noValidate>
          <div className="field">
            <label className="field__label" htmlFor={ids.target}>
              Shadow
            </label>
            <select ref={targetRef} id={ids.target} value={target.key} onChange={(e) => selectTarget(e.target.value)}>
              {targets.map((t) => (
                <option key={t.key} value={t.key}>
                  No. {t.registryNo}, {t.label}
                </option>
              ))}
            </select>
          </div>

          <fieldset className="field">
            <legend className="field__label">Day of the week</legend>
            <div className="chips">
              {DAYS.map((d) => (
                <label key={d} className="chip">
                  <input type="radio" name="day" value={d} checked={day === d} onChange={() => edit(setDay)(d)} />
                  <span>{d.slice(0, 3)}</span>
                </label>
              ))}
            </div>
          </fieldset>

          <fieldset className="field" aria-describedby={errors.hours ? ids.hours : undefined}>
            <legend className="field__label">Hours</legend>
            <div className="field__pair">
              <label>
                <span className="field__sub">From</span>
                <select
                  ref={fromRef}
                  value={from}
                  aria-invalid={!!errors.hours}
                  onChange={(e) => editHours(setFrom)(Number(e.target.value))}
                >
                  {halfHours(target.castFrom, target.castUntil - 0.5).map((h) => (
                    <option key={h} value={h}>
                      {formatClock(h)}
                    </option>
                  ))}
                </select>
              </label>
              <label>
                <span className="field__sub">Until</span>
                <select
                  value={until}
                  aria-invalid={!!errors.hours}
                  onChange={(e) => editHours(setUntil)(Number(e.target.value))}
                >
                  {halfHours(target.castFrom + 0.5, target.castUntil).map((h) => (
                    <option key={h} value={h}>
                      {formatClock(h)}
                    </option>
                  ))}
                </select>
              </label>
            </div>
            {errors.hours && (
              <p id={ids.hours} className="field__error">
                {errors.hours}
              </p>
            )}
          </fieldset>

          <fieldset className="field">
            <legend className="field__label">Purpose of lease</legend>
            <div className="chips">
              {PURPOSES.map((p) => (
                <label key={p} className="chip">
                  <input
                    type="radio"
                    name="purpose"
                    value={p}
                    checked={purpose === p}
                    onChange={() => edit(setPurpose)(p)}
                  />
                  <span>{p}</span>
                </label>
              ))}
            </div>
          </fieldset>

          <div className="field">
            <label className="field__label" htmlFor={ids.lessee}>
              Made out to
            </label>
            <input
              ref={nameRef}
              id={ids.lessee}
              type="text"
              maxLength={40}
              autoComplete="off"
              value={lessee}
              aria-invalid={!!errors.lessee}
              aria-describedby={errors.lessee ? `${ids.lessee}-error` : undefined}
              onChange={(e) => {
                edit(setLessee)(e.target.value)
                if (errors.lessee) setErrors((x) => ({ ...x, lessee: undefined }))
              }}
            />
            {errors.lessee && (
              <p id={`${ids.lessee}-error`} className="field__error">
                {errors.lessee}
              </p>
            )}
          </div>

          <div className="lease__submit">
            <button type="submit" className="button button--solid">
              File the lease
            </button>
            <p className="lease__status" role="status">
              {status}
            </p>
          </div>
        </form>

        <div className="lease__preview" ref={paperRef}>
          <LeaseDocket lease={filed ?? draft} filed={!!filed} />
        </div>
      </div>

      <div className="lease__file">
        <h3 className="lease__file-title" ref={fileTitleRef} tabIndex={-1}>
          Leases on file
        </h3>
        {leases.length === 0 ? (
          <p className="lease__empty">No leases on file. Filed leases are kept at this desk, in this browser.</p>
        ) : (
          <ul className="lease__list">
            <AnimatePresence initial={false}>
              {leases.map((l) => (
                <m.li
                  key={l.number}
                  layout
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                >
                  <div className="lease__row">
                    <span className="tag">{l.number}</span>
                    <span>
                      Shadow No. {l.target.registryNo}, {l.target.label}
                    </span>
                    <span>
                      {l.day}s, {formatClock(l.from)} until {formatClock(l.until)}
                    </span>
                    <button
                      type="button"
                      className="lease__withdraw"
                      onClick={() => withdraw(l.number)}
                    >
                      Withdraw<span className="visually-hidden"> lease {l.number}</span>
                    </button>
                  </div>
                </m.li>
              ))}
            </AnimatePresence>
          </ul>
        )}
      </div>
    </section>
  )
}
