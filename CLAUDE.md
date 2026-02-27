# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

n Shades of Colour is a static (HTML/CSS/JS) hue-shift tonal shade generator. It produces artist-style value scales where warm light creates cool shadows (and vice versa), operating in OKLCH colour space for perceptually uniform results.

## Constraints

- No frameworks, no JS libraries, no CSS frameworks
- Relative paths only (GitHub Pages compatible)
- Algorithm logic lives exclusively in `assets/js/colorModels/` — `app.js` must not embed it
- No new modules unless they clearly reduce complexity (see PLAN.md §1)

## Running Locally

No build step. Serve the repository root with any static file server:

```sh
python3 -m http.server 8000
# or
npx http-server -p 8000
```

Open `http://localhost:8000`. All JS uses ES module imports — a server is required (file:// won't work).

`shades-reference.html` — visual reference grid of generated shades; useful for eyeballing algorithm output

## Architecture

### Module responsibilities

| File | Role |
|---|---|
| `assets/js/colorModels/index.js` | Public API — `generateShades(baseHex, temperature, steps, mode)` → `string[]` (darkest to lightest); `steps` must be 3, 5, 9, or 11; also exports debug helpers (`validateShades`, `compareModes`, `debugGamut`, `debugHighlights`, `debugHue`) |
| `assets/js/colorModels/convert.js` | Colour space conversions: hex ↔ OKLCH, gamut clamping, OKLab utilities |
| `assets/js/colorModels/hueShift.js` | Core algorithm: OKLCH shade generation, perceptual ΔE spacing, hue convergence, chroma curves |
| `assets/js/history.js` | In-memory recent (max 10) / starred lists + single-level undo buffer; reads/writes via `storage.js`; also exports label/token helpers (`generateFactualLabel`, `generateTokenPrefix`) used by `app.js` |
| `assets/js/storage.js` | localStorage persistence under key `nShadesOfColour`, schema version 1 |
| `assets/js/app.js` | State ownership, DOM wiring, event handlers, render functions — orchestration only |

### Algorithm overview (`hueShift.js`)

1. Builds a perceptually-spaced lightness shade using arc-length reparameterization (cumulative ΔE in OKLab) so steps feel visually equidistant
2. For each step, applies a colour cast via `castStrength` (smoothstep S-curve from midpoint toward endpoints)
3. Hue shifts toward warm/cool anchor directions (WARM_ANCHOR_H = 65°, COOL_ANCHOR_H = 205°) using `blendHueDegrees`
4. Highlight convergence done in OKLab space (more stable than hue-angle blending at low chroma)
5. Near-neutral bases (C ≤ 0.03) take a special branch — chroma is generated from scratch rather than scaled

Mode differences are **only** `castStrength`: `conservative = 0.30`, `creative = 0.50`.

### State and data flow (`app.js`)

- **Input changes** → `updatePreview()` — regenerates shade live, no history mutation
- **"Generate" button** → `history.addToRecent(entry)` — commits snapshot, clears undo buffer
- **"×" remove** → `history.removeFromRecent(id)` — stores entry + index in undo buffer
- **Undo** → `history.undo()` — restores to original index, clears buffer
- Undo buffer is in-memory only; it is cleared on page reload, new generation, undo, and clear-all

### Storage schema

localStorage key `nShadesOfColour`, version 1:
```json
{ "version": 1, "recent": [...], "starred": [...] }
```
`HistoryEntry` fields: `id, customLabel, baseHex, temperature, steps, mode, shadesHexes[], tokenPrefix, createdAt`.

Older entries may carry a `label` field instead of `customLabel` — the render code in `app.js` handles this as a fallback.

### CSS export token formats

Two formats, both zero-indexed (0 = darkest, steps−1 = lightest):
- Short: `--{slug}-{step}: #hex;`
- Long: `--color-{slug}-{step}: #hex;`

Slug rules: lowercase, spaces to hyphens, remove non-alphanumeric, collapse repeated hyphens.

## Behavioural Contracts

See `BEHAVIOUR.md` for the full contract. Key hard invariants:
- OKLCH L must be **strictly monotonic** (darkest to lightest)
- Midpoint step must equal the **exact input hex** (pinned after OKLCH round-trip)
- No two adjacent steps may produce the same hex
- `temperature === 0` must produce **no intentional hue cast**
- `temperature !== 0` — endpoints must have C > 0.005

## Debug Helpers (browser console)

The debug functions are plain ES module exports from `colorModels/index.js`. Import directly in a `<script type="module">` against the local dev server:

```js
import { validateShades, compareModes, debugGamut, debugHighlights, debugHue }
  from './assets/js/colorModels/index.js';

validateShades(baseHex, temperature, steps, mode)  // logs per-step hue deltas, returns pass/fail
compareModes(baseHex, temperature, steps)          // conservative vs creative side-by-side
debugGamut(baseHex, temperature, steps, mode)      // gamut mapping before/after
debugHighlights(baseHex)                           // hue stability across 8 test cases
debugHue(baseHex, temperature, steps, mode)        // per-step H and Δh summary
```
