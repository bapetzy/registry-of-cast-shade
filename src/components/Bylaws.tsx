import { SectionTitle } from './SectionTitle'
import './Bylaws.css'

const ARTICLES = [
  {
    title: 'Ownership',
    text: 'Every shadow cast inside the city limits belongs to the city, and is held in trust for whoever is standing in it.',
  },
  {
    title: 'Hours',
    text: 'A shadow exists only between sunrise and sunset. After dark nobody owns the dark, and the Registry does not try.',
  },
  {
    title: 'Leasing',
    text: 'Shadows may be leased by the half hour. They may not be sold, moved, folded or taken indoors.',
  },
  {
    title: 'Overlap',
    text: 'Where two leased shadows overlap, the lessee of the larger shadow has right of way, unless the smaller one belongs to a tree.',
  },
  {
    title: 'Trespass',
    text: 'Nobody may stand in a leased shadow without the lessee’s permission, except to pass through it at walking pace.',
  },
  {
    title: 'Lapsed shadows',
    text: 'A shadow that has not been cast for a full year, because of demolition, felling or a change of heart, is struck from the register at the next solstice.',
  },
  {
    title: 'Cats',
    text: 'Cats are exempt from every article above.',
  },
]

export function Bylaws() {
  return (
    <section id="bylaws" className="bylaws" aria-labelledby="bylaws-title" data-sun-scope>
      <header className="bylaws__head">
        <SectionTitle id="bylaws-title">Bylaws</SectionTitle>
        <p className="bylaws__note">Adopted by the Council of Vesk on 4 May 1931. Amended whenever the sun does something new.</p>
      </header>
      <ol className="bylaws__list">
        {ARTICLES.map((a, i) => (
          <li key={a.title} className="bylaw">
            <span className="bylaw__number" aria-hidden="true">
              {i + 1}
            </span>
            <div>
              <h3 className="bylaw__title">
                <span className="visually-hidden">Article {i + 1}: </span>
                {a.title}
              </h3>
              <p className="bylaw__text">{a.text}</p>
            </div>
          </li>
        ))}
      </ol>
    </section>
  )
}
