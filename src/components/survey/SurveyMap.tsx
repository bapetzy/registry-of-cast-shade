import { useEffect, useRef, useState } from 'react'
import type { City, Structure } from '../../lib/city'
import { pointInPolygon, type Vec } from '../../lib/geometry'
import { sunPosition, toDegrees } from '../../lib/sun'
import {
  computeView,
  createLayer,
  paintGround,
  paintHighlight,
  paintNight,
  paintRoofs,
  paintShadeHours,
  paintShadows,
  paintSundial,
  sampleShadeHours,
  toWorld,
  type ShadeHours,
  type View,
} from './renderCity'

export type SurveyMode = 'now' | 'hours'

interface Props {
  city: City
  hours: number
  day: number
  mode: SurveyMode
  shade: ShadeHours | null
  selectedId: number | null
  /** Called with the structure under a click; clicks on open ground are ignored. */
  onSelect: (id: number) => void
}

interface Hover {
  id: number | null
  /** Pointer position within the plan, and in the viewport (the tip is fixed so it clears the panels). */
  screen: Vec
  client: Vec
  shadeFraction: number | null
}

function hitTest(city: City, p: Vec): Structure | null {
  for (let i = city.structures.length - 1; i >= 0; i--) {
    const s = city.structures[i]
    if (s.canopy) {
      if (Math.hypot(p.x - s.canopy.center.x, p.y - s.canopy.center.y) <= s.canopy.radius + 1) return s
    } else if (pointInPolygon(p, s.footprint)) return s
  }
  return null
}

const formatDuration = (h: number) => {
  const mins = Math.round(h * 60)
  return `${Math.floor(mins / 60)} h ${String(mins % 60).padStart(2, '0')} min`
}

export function SurveyMap({ city, hours, day, mode, shade, selectedId, onSelect }: Props) {
  const wrapRef = useRef<HTMLDivElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const viewRef = useRef<View | null>(null)
  const layersRef = useRef<{ ground: HTMLCanvasElement; roofs: HTMLCanvasElement } | null>(null)
  const [size, setSize] = useState({ w: 0, h: 0 })
  const [hover, setHover] = useState<Hover | null>(null)

  const tower = city.structures.find((s) => s.name.includes('clock tower'))!

  // Size the canvas to its box; rebuild the cached ground and roof layers.
  useEffect(() => {
    const wrap = wrapRef.current!
    const ro = new ResizeObserver(([entry]) => {
      const { width, height } = entry.contentRect
      setSize({ w: Math.round(width), h: Math.round(height) })
    })
    ro.observe(wrap)
    return () => ro.disconnect()
  }, [])

  useEffect(() => {
    if (!size.w || !size.h) return
    const canvas = canvasRef.current!
    const dpr = Math.min(window.devicePixelRatio || 1, 2)
    canvas.width = Math.round(size.w * dpr)
    canvas.height = Math.round(size.h * dpr)
    // Narrow screens see a slice of the city; keep the square in it.
    const narrow = size.w < 700
    const focus = narrow
      ? { x: city.plaza.x + city.plaza.w * 0.3, y: city.plaza.y + city.plaza.h * 0.6 }
      : { x: 800, y: 500 }
    const view = computeView(size.w, size.h, dpr, focus)
    viewRef.current = view
    const ground = createLayer(view)
    paintGround(ground.ctx, city, view)
    const roofs = createLayer(view)
    paintRoofs(roofs.ctx, city, view)
    layersRef.current = { ground: ground.canvas, roofs: roofs.canvas }
  }, [size, city])

  // Repaint: one frame per change of time, mode, selection or hover.
  const hoverId = hover?.id ?? null
  useEffect(() => {
    const view = viewRef.current
    const layers = layersRef.current
    const canvas = canvasRef.current
    if (!view || !layers || !canvas) return
    const frame = requestAnimationFrame(() => {
      const ctx = canvas.getContext('2d')!
      const sun = sunPosition(hours, day)
      ctx.setTransform(1, 0, 0, 1, 0, 0)
      ctx.drawImage(layers.ground, 0, 0)
      if (mode === 'hours' && shade) {
        paintShadeHours(ctx, shade, view)
      } else {
        paintShadows(ctx, city, sun, view)
        paintSundial(ctx, tower, day, view)
      }
      ctx.setTransform(1, 0, 0, 1, 0, 0)
      ctx.drawImage(layers.roofs, 0, 0)
      // In hours mode there is no single hour to cast from, so only footprints are marked.
      const castNow = mode === 'now'
      const hovered = hoverId !== null && hoverId !== selectedId ? city.structures[hoverId - 1] : null
      if (hovered) paintHighlight(ctx, hovered, sun, view, false, castNow)
      if (selectedId !== null) paintHighlight(ctx, city.structures[selectedId - 1], sun, view, true, castNow)
      if (castNow) {
        const altitude = toDegrees(sun.altitude)
        paintNight(ctx, city, Math.min(1, Math.max(0, (3 - altitude) / 9)), view)
      }
    })
    return () => cancelAnimationFrame(frame)
  }, [city, tower, hours, day, mode, shade, selectedId, hoverId, size])

  const locate = (e: { clientX: number; clientY: number }) => {
    const view = viewRef.current
    if (!view) return null
    const rect = canvasRef.current!.getBoundingClientRect()
    const screen = { x: e.clientX - rect.left, y: e.clientY - rect.top }
    return { screen, client: { x: e.clientX, y: e.clientY }, world: toWorld(view, screen.x, screen.y) }
  }

  const onPointerMove = (e: React.PointerEvent) => {
    if (e.pointerType === 'touch') return
    const at = locate(e)
    if (!at) return
    const hit = hitTest(city, at.world)
    setHover({
      id: hit?.id ?? null,
      screen: at.screen,
      client: at.client,
      shadeFraction: mode === 'hours' && shade ? sampleShadeHours(shade, at.world) : null,
    })
  }

  const onClick = (e: React.MouseEvent) => {
    const at = locate(e)
    if (!at) return
    const hit = hitTest(city, at.world)
    if (mode === 'hours' && shade) {
      setHover({ id: hit?.id ?? null, screen: at.screen, client: at.client, shadeFraction: sampleShadeHours(shade, at.world) })
    }
    if (hit) onSelect(hit.id)
  }

  const hovered = hover?.id ? city.structures[hover.id - 1] : null
  let tip: string | null = null
  if (mode === 'hours' && hover?.shadeFraction != null && shade) {
    tip = `In shade ${formatDuration(hover.shadeFraction * shade.daylightHours)} of ${formatDuration(shade.daylightHours)} daylight`
  } else if (mode === 'now' && hovered) {
    tip = `Shadow No. ${hovered.registryNo}, ${hovered.name}`
  }

  return (
    <div
      className="survey-map"
      ref={wrapRef}
      data-pointer={hovered ? 'select' : 'survey'}
      onPointerMove={onPointerMove}
      onPointerLeave={() => setHover(null)}
      onClick={onClick}
    >
      <canvas
        ref={canvasRef}
        role="img"
        aria-label="Plan of central Vesk: buildings in ink, their shadows in ultramarine. Select any structure to open its docket, or use the landmark list beside the plan."
      />
      {tip && hover && (
        <p
          className="survey-map__tip tag"
          style={{
            // Flip to the left of the pointer near the right edge, where the docket sits.
            transform:
              hover.screen.x > size.w * 0.6
                ? `translate(${hover.client.x - 16}px, ${hover.client.y + 18}px) translateX(-100%)`
                : `translate(${hover.client.x + 16}px, ${hover.client.y + 18}px)`,
          }}
          aria-hidden="true"
        >
          {tip}
        </p>
      )}
    </div>
  )
}
