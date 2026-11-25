/**
 * A section heading mounted on a ground line. The aria-hidden copy is its
 * cast shadow, sheared by the page's sun (see .section-title__cast).
 */
export function SectionTitle({ id, children }: { id: string; children: string }) {
  return (
    <h2 id={id} className="section-title">
      <span className="section-title__cast" aria-hidden="true">
        {children}
      </span>
      <span className="section-title__text">{children}</span>
    </h2>
  )
}
