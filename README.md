# Registry of Cast Shade

A fictional civic office in an invented city, Vesk, that surveys every shadow in town, gives it a number, and leases it by the half hour. It is a design and front-end experiment: the city, the office and its paperwork are made up, but the sun is not. Every shadow on the page comes from a real solar-position model for 52.4° north.

## What is on the page

- **Hero.** Relief letters on a limewashed wall. The pointer is the light source, and each letter's shadow is projected away from it.
- **The page's sun.** Scrolling runs a late-May day from 07:00 to just after sunset. The nav clock shows the time. The limewash wall changes with it (pale and green at dawn, sulfur at noon, amber by evening). Section titles stand on a ground line and cast the sun's shadow, as do relief elements and register drawings.
- **Sunset.** At the end of the page, Vesk is seen in elevation for the first time. The skyline is built from the survey's own buildings, and the page's sun sets behind it at its calculated altitude.
- **The survey.** A procedurally generated plan of central Vesk (about 880 buildings, a canal, a park, a boulevard of lime trees) drawn on canvas. Drag the sun along its altitude curve, change the season, or switch to *Hours of shade* to see a whole day integrated into one map. The clock tower on Gnomon Square has real sundial hour lines. Select any building to open its docket.
- **The register.** Twelve hand-drawn SVG specimens filed as index cards in a masonry grid. Their cast shadows are the same drawing sheared onto the ground by the page's sun.
- **Lease desk.** A working form with validation that produces a Form R/4 lease with ruled fields, a clerk's line and a dated stamp. Filed leases are listed and kept in `localStorage`.
- **Bylaws and night.** The last section goes dark, and a lamp under the pointer lights up the register's numbers.

## Running it

```sh
npm install
npm run dev       # http://localhost:5173
npm run build     # type-check and production build into dist/
npm run preview
npm run lint
npm test          # solar model, geometry and city generator
```

The npm scripts call `node` on each tool's entry file directly instead of using `node_modules/.bin` shims. The Windows `.cmd` shims break when the project path contains `&`.

## Structure

```
src/
  lib/
    sun.ts            solar position, daylight, shadow offsets
    geometry.ts       convex hull, prism shadows, hit testing
    city.ts           seeded city generator and shadow casting
    ambientSun.ts     scroll-driven sun; writes CSS custom properties to visible sections
    lease.ts          lease context, records and numbering
  components/
    Hero, Nav, Bylaws, NightFooter
    survey/           canvas renderer, sun dial, docket
    registry/         specimen drawings, masonry, dialog
    lease/            form, docket paper, stamp
```

## Notes

- The sun's custom properties are written only to `[data-sun-scope]` sections that are on screen, and only when the simulated minute changes. Writing them on `:root` made every element recompute its style on every scroll frame.
- The hero lamp moves cast letters with `translate`, not `text-shadow`, and reads geometry only on resize, so the light can move every frame without forcing layout. Its loop sleeps once the hero is only a strip under the fixed nav.
- *Hours of shade* integrates 48 sun positions with additive canvas blending. Each sample is filled in batches so the work can yield between frames, and the result is cached per season.
- Motion is loaded through `LazyMotion`; its layout-animation features arrive in a separate chunk.
- `prefers-reduced-motion` turns off the idle drift of the hero light, smooth scrolling and decorative transitions. Everything the reader drives still works.
- Fonts: Big Shoulders (variable, optical size) and Source Serif 4, self-hosted through Fontsource.
