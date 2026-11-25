import { ART, type Specimen } from './specimens'

/**
 * The object stands on a ground line; its shadow is the same drawing,
 * flattened onto the ground and sheared by the page's sun (see .specimen-art__cast).
 */
export function SpecimenArt({ specimen, className }: { specimen: Specimen; className?: string }) {
  const top = specimen.top + ART.headroom
  return (
    <svg
      className={className ? `specimen-art ${className}` : 'specimen-art'}
      viewBox={`${-ART.halfWidth} ${-top} ${ART.halfWidth * 2} ${top + ART.foreground}`}
      aria-hidden="true"
    >
      <g className="specimen-art__cast">{specimen.art}</g>
      <line className="specimen-art__ground" x1={-ART.halfWidth} x2={ART.halfWidth} y1="0" y2="0" />
      <g className="specimen-art__body">{specimen.art}</g>
    </svg>
  )
}
