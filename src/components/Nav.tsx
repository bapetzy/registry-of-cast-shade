import { useEffect, useId, useRef, useState } from 'react'
import { useAmbientSun } from '../lib/ambientSun'
import { formatClock, toDegrees } from '../lib/sun'
import './Nav.css'

const LINKS = [
  { href: '#survey', label: 'Survey' },
  { href: '#registry', label: 'Register' },
  { href: '#lease', label: 'Lease' },
  { href: '#bylaws', label: 'Bylaws' },
]

/** A tiny sun on its arc: how high the page's sun stands right now. */
function SunGlyph({ altitude, hours }: { altitude: number; hours: number }) {
  const t = Math.min(1, Math.max(0, (hours - 4.5) / 15.5))
  const x = 3 + t * 30
  const lift = Math.max(-0.15, toDegrees(altitude) / 60)
  const y = 17 - lift * 13
  return (
    <svg className="sun-glyph" viewBox="0 0 36 20" width="36" height="20" aria-hidden="true">
      <path d="M2 17 H34" />
      <circle cx={x} cy={y} r="3.4" className={altitude > 0 ? 'is-up' : 'is-down'} />
    </svg>
  )
}

function Clock() {
  const sun = useAmbientSun()
  const up = sun.altitude > 0
  return (
    <p className="nav__clock" aria-live="off">
      <SunGlyph altitude={sun.altitude} hours={sun.hours} />
      <span className="tag">{formatClock(sun.hours)}</span>
      <span className="visually-hidden">{up ? 'Sun is up' : 'Sun has set'}</span>
    </p>
  )
}

export function Nav() {
  const [open, setOpen] = useState(false)
  const menuId = useId()

  const sheetRef = useRef<HTMLDivElement>(null)
  const menuRef = useRef<HTMLButtonElement>(null)

  useEffect(() => {
    if (!open) return
    sheetRef.current?.querySelector('a')?.focus()
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== 'Escape') return
      setOpen(false)
      menuRef.current?.focus()
    }
    document.addEventListener('keydown', onKey)
    document.body.style.overflow = 'hidden'
    return () => {
      document.removeEventListener('keydown', onKey)
      document.body.style.overflow = ''
    }
  }, [open])

  // The sheet's link disappears with the sheet, so hand focus to the section it opened.
  const goTo = (href: string) => {
    setOpen(false)
    const target = document.querySelector<HTMLElement>(href)
    if (!target) return
    target.setAttribute('tabindex', '-1')
    target.focus({ preventScroll: true })
  }

  return (
    <header className="nav" data-sun-scope>
      <a className="nav__mark relief" href="#top" aria-label="Registry of Cast Shade, back to top">
        <span className="nav__mark-full">Registry of Cast Shade</span>
        <span className="nav__mark-short" aria-hidden="true">
          Registry of
          <br />
          Cast Shade
        </span>
      </a>

      <div className="nav__plate relief">
        <nav aria-label="Sections" className="nav__links">
          {LINKS.map((l) => (
            <a key={l.href} href={l.href}>
              {l.label}
            </a>
          ))}
        </nav>
        <Clock />
        <button
          ref={menuRef}
          className="nav__menu"
          type="button"
          aria-expanded={open}
          aria-controls={menuId}
          onClick={() => setOpen((v) => !v)}
        >
          {open ? 'Close' : 'Menu'}
        </button>
      </div>

      <div id={menuId} ref={sheetRef} className="nav__sheet" hidden={!open}>
        <nav aria-label="Sections">
          {LINKS.map((l) => (
            <a key={l.href} href={l.href} onClick={() => goTo(l.href)}>
              {l.label}
            </a>
          ))}
        </nav>
      </div>
    </header>
  )
}
