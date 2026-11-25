import { useEffect, useRef } from 'react'
import './Hero.css'

const HEADLINE = [['The', 'city', 'keeps'], ['its', 'shadows'], ['on', 'file.']]
const MAX_CAST = 64

/**
 * Two identical layers of letters: shadows underneath, ink on top. Painting
 * them separately keeps one letter's shadow from falling across its neighbour's face.
 */
function Letters({ layer }: { layer: 'cast' | 'relief' }) {
  const attr = layer === 'cast' ? { 'data-cast': true } : { 'data-letter': true }
  return (
    <span className={`hero__layer hero__layer--${layer}`} aria-hidden="true">
      {HEADLINE.map((line, l) => (
        <span className="hero__line" key={l}>
          {line.map((word, w) => (
            <span className="hero__word" key={w}>
              {Array.from(word).map((ch, i) => (
                <span className="hero__letter" {...attr} key={i}>
                  {ch}
                </span>
              ))}
            </span>
          ))}
        </span>
      ))}
    </span>
  )
}

/**
 * The headline is a row of relief letters mounted off a limewashed wall.
 * The pointer is a lamp: each letter's shadow is projected away from it, so
 * shadows splay apart near the light and stretch out far from it.
 */
export function Hero() {
  const sectionRef = useRef<HTMLElement>(null)

  const glowRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const section = sectionRef.current
    const glow = glowRef.current
    if (!section || !glow) return
    const letters = Array.from(section.querySelectorAll<HTMLElement>('[data-letter]'))
    const casts = Array.from(section.querySelectorAll<HTMLElement>('[data-cast]'))
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches

    // Geometry is read only when the layout changes (resize, fonts), never per
    // frame: reading it after the per-frame style writes would force a layout.
    let centers: { x: number; y: number }[] = []
    const box = { w: 0, h: 0, pageLeft: 0, pageTop: 0 }
    const measure = () => {
      const base = section.getBoundingClientRect()
      box.w = base.width
      box.h = base.height
      box.pageLeft = base.left + window.scrollX
      box.pageTop = base.top + window.scrollY
      centers = letters.map((el) => {
        const r = el.getBoundingClientRect()
        return { x: r.left - base.left + r.width / 2, y: r.top - base.top + r.height * 0.55 }
      })
    }

    const light = { x: 0, y: 0 }
    const target = { x: 0, y: 0 }
    const placed = { x: NaN, y: NaN }
    let lastPointer = -Infinity
    let frame = 0
    let visible = true

    const place = (force = false) => {
      if (!force && Math.abs(light.x - placed.x) + Math.abs(light.y - placed.y) < 0.2) return
      placed.x = light.x
      placed.y = light.y
      glow.style.setProperty('--light-x', `${light.x.toFixed(1)}px`)
      glow.style.setProperty('--light-y', `${light.y.toFixed(1)}px`)
      for (let i = 0; i < letters.length; i++) {
        const c = centers[i]
        let dx = (c.x - light.x) * 0.055
        let dy = (c.y - light.y) * 0.055
        const len = Math.hypot(dx, dy)
        if (len > MAX_CAST) {
          dx *= MAX_CAST / len
          dy *= MAX_CAST / len
        }
        const s = casts[i].style
        s.setProperty('--lx', `${dx.toFixed(1)}px`)
        s.setProperty('--ly', `${dy.toFixed(1)}px`)
      }
    }

    const tick = (now: number) => {
      frame = 0
      if (!visible) return
      const idle = now - lastPointer > 2600
      if (idle && !reduced) {
        // With nobody holding it, the sun drifts on a slow ellipse.
        const t = now / 5200
        target.x = box.w * (0.5 + 0.38 * Math.cos(t))
        target.y = box.h * (0.42 + 0.3 * Math.sin(t * 1.3))
      }
      const ease = reduced ? 1 : 0.12
      light.x += (target.x - light.x) * ease
      light.y += (target.y - light.y) * ease
      place()
      if (!reduced || Math.abs(target.x - light.x) > 0.5) frame = requestAnimationFrame(tick)
    }
    const kick = () => {
      if (!frame && visible) frame = requestAnimationFrame(tick)
    }

    const onPointer = (e: PointerEvent) => {
      target.x = e.pageX - box.pageLeft
      target.y = e.pageY - box.pageTop
      lastPointer = performance.now()
      kick()
    }

    // Ignore the strip hidden under the fixed nav, so the loop sleeps once the
    // reader has moved on even if a sliver of the hero is technically on screen.
    const io = new IntersectionObserver(
      ([entry]) => {
        visible = entry.isIntersecting
        if (visible) kick()
      },
      { rootMargin: '-110px 0px 0px 0px' },
    )
    const refresh = () => {
      measure()
      place(true)
    }
    const ro = new ResizeObserver(refresh)

    measure()
    target.x = light.x = box.w * 0.18
    target.y = light.y = box.h * 0.1
    place(true)
    io.observe(section)
    ro.observe(section)
    section.addEventListener('pointermove', onPointer)
    section.addEventListener('pointerdown', onPointer)
    document.fonts?.ready.then(refresh)
    kick()

    return () => {
      cancelAnimationFrame(frame)
      io.disconnect()
      ro.disconnect()
      section.removeEventListener('pointermove', onPointer)
      section.removeEventListener('pointerdown', onPointer)
    }
  }, [])

  return (
    <section className="hero" ref={sectionRef} aria-labelledby="hero-title" data-sun-scope>
      <div className="hero__glow" ref={glowRef} aria-hidden="true" />
      <h1 id="hero-title" className="hero__title display" aria-label={HEADLINE.flat().join(' ')}>
        <Letters layer="cast" />
        <Letters layer="relief" />
      </h1>

      <div className="hero__foot">
        <p className="hero__lede lede">
          The Registry of Cast Shade surveys every shadow inside the city limits of Vesk, gives it a number, and
          leases it by the half hour to anyone who wants to get out of the sun.
        </p>
        <div className="hero__actions">
          <a className="button button--solid" href="#survey">
            Open the survey
          </a>
          <a className="button" href="#lease">
            Lease a shadow
          </a>
        </div>
        <p className="hero__hint">
          <span className="hero__hint-pointer">You are holding the sun. Move it around.</span>
          <span className="hero__hint-touch">Touch the wall to move the sun.</span>
        </p>
      </div>

      <p className="hero__plaque relief">
        <span className="tag">City of Vesk</span>
        <span>52°24′ N, Gnomon Ward. The Registry is open from sunrise to sunset.</span>
      </p>
    </section>
  )
}
