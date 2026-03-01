# Project Memory — n Shades of Colour

## Design System (from Figma yVx92b26f7uhs7qusRg3UE, node 2093:429)

### Colours
- `--primary`: `#9e1221` (used for H1, nav link, toggle active, btn-primary bg, slider thumb)
- `--primary-dark`: `#840f1b` (btn-primary border)
- Page background: `#e6e6e6`
- Panel background: `#ffffff`
- Panel/input border: `#cccccc`
- Dark text: `#1a1a1a`
- Mid/secondary text: `#808080`

### Typography
- H1: Poppins 900, 80px / 84px line-height, colour `#9e1221`
- H3/panel titles ("Settings", "Preview", "Export CSS Variables", "Recent", "Starred"): Lato 700, 32px / 34px line-height, colour `#1a1a1a`
- Section labels (Temperature, Shades, Mode): Lato 700, 24px / 32px line-height
- Body / field labels: Lato 400, 16px / 22px line-height
- Button text: Lato 600, 20px
- Monospace (hex values, export code, temp display): Menlo / "Courier New", 16px
- Google Fonts import: `Lato:wght@400;600;700` + `Poppins:wght@700;900`

### Layout
- Page padding: `32px 40px 40px` (body); content centers via `margin: 0 auto` on `.app` once viewport exceeds 1240px + 80px = 1320px
- `.app` grid: `minmax(0, 800px) 400px` columns, `40px` gap, `max-width: 1240px`
- All panels in `.main` fill the full column width (up to 800px); no `max-width` on `panel--input`
- Header: full-width (`grid-column: 1/-1`), flex row, `justify-content: space-between`
- Footer: inside `.app`, full-width, centred text
- Main panels: flex column, `40px` gap
- Sidebar panels: flex column, `24px` gap

### Components
- **Panels**: white bg, `1px solid #ccc`, `border-radius: 2px`, `padding: 25px 25px 41px`; history/starred panels: `padding-bottom: 65px`
- **Input fields**: `#e6e6e6` bg, `1px solid #ccc`, `border-radius: 2px`, `height: 40px`, `padding: 9px 17px`
- **Color picker**: white bg, `#e6e6e6` border, `border-radius: 8px`, inner swatch `border-radius: 4px`
- **Slider thumb**: rectangular (`border-radius: 4px`), `#9e1221`, `1px solid #ccc`, `box-shadow: 0 0 2px 0 #808080`
- **Slider track**: `2px` height, `#ccc` background
- **Toggle button group**: each button `border: 1px solid #ccc`, active: `bg #9e1221` / `color #e6e6e6`
- **Primary button**: `bg #9e1221`, `border: 1px solid #840f1b`, `border-radius: 2px`, `padding: 16px 32px`, Lato 600 20px
- **Secondary button**: `bg #e6e6e6`, `border: 1px solid #808080`, `border-radius: 0`, `padding: 16px 32px`, Lato 600 20px

### HTML Structure Notes
- Base Colour + Label inputs are on the same horizontal row (`.base-row`)
- Section heading labels (Temperature, Shades, Mode) use class `.section-label` (Lato Bold 24px)
- Field labels (Base Colour, Label (optional)) are regular 16px weight-400
- Action row is centred (`justify-content: center`)
- Export code (`<pre>`) has no box/border — plain Menlo text on transparent bg
- Export select uses CSS `appearance: none` + SVG chevron background-image
- Responsive breakpoint at 900px: single column, reduced font sizes

## Key File Paths
- `index.html` — main app page
- `assets/css/styles.css` — all styles (no preprocessor)
- `assets/js/app.js` — state, event wiring, render functions
- `assets/js/colorModels/index.js` — public API: `generateShades(hex, temp, steps, mode)`
- `assets/js/colorModels/hueShift.js` — core algorithm
- `assets/js/colorModels/convert.js` — colour space conversions
- `assets/js/history.js` — recent/starred lists + undo buffer
- `assets/js/storage.js` — localStorage persistence
- `shades-reference.html` — dev tool for eyeballing algorithm output
