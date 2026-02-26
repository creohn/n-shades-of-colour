# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Tone Ladder is a static (HTML/CSS/JS) hue-shift tonal shade generator. It produces artist-style value scales where warm light creates cool shadows (and vice versa), operating in OKLCH colour space for perceptually uniform results.

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

## Architecture

### Module responsibilities

| File | Role |
|---|---|
| `assets/js/colorModels/index.js` | Public API — `generateshade(baseHex, temperature, steps, mode)` → `string[]` (darkest → lightest) |
| `assets/js/colorModels/convert.js` | Colour space conversions: hex ↔ OKLCH, gamut clamping, OKLab utilities |
| `assets/js/colorModels/hueShift.js` | Core algorithm: OKLCH shade generation, perceptual ΔE spacing, hue convergence, chroma curves |
| `assets/js/history.js` | In-memory recent/starred lists + single-level undo buffer; reads/writes via `storage.js` |
| `assets/js/storage.js` | localStorage persistence under key `toneLadder`, schema version 1 |
| `assets/js/app.js` | State ownership, DOM wiring, event handlers, render functions — orchestration only |

### Algorithm overview (`hueShift.js`)

1. Builds a perceptually-spaced lightness shade using arc-length reparameterization (cumulative ΔE in OKLab) so steps feel visually equidistant
2. For each step, applies a colour cast via `castStrength` (smoothstep S-curve from midpoint toward endpoints)
3. Hue shifts toward warm/cool anchor directions (WARM_ANCHOR_H = 65°, COOL_ANCHOR_H = 205°) using `blendHueDegrees`
4. Highlight convergence done in OKLab space (more stable than hue-angle blending at low chroma)
5. Near-neutral bases (C ≤ 0.03) take a special branch — chroma is generated from scratch rather than scaled

Mode differences are **only** `castStrength`: `conservative = 0.30`, `painterly = 0.50`.

### State and data flow (`app.js`)

- **Input changes** → `updatePreview()` — regenerates shade live, no history mutation
- **"Add to History"** → `history.addToRecent(entry)` — commits snapshot, clears undo buffer
- **"X" remove** → `history.removeFromRecent(id)` — stores entry + index in undo buffer
- **Undo** → `history.undo()` — restores to original index, clears buffer
- Undo buffer is in-memory only; it is cleared on page reload, new generation, undo, and clear-all

### Storage schema

localStorage key `toneLadder`, version 1:
```json
{ "version": 1, "recent": [...], "starred": [...] }
```
`HistoryEntry` fields: `id, customLabel, baseHex, temperature, steps, mode, shadeHexes[], tokenPrefix, createdAt`.

### CSS export token formats

Two formats, both zero-indexed (0 = darkest, steps−1 = lightest):
- Short: `--{slug}-{step}: #hex;`
- Long: `--color-{slug}-{step}: #hex;`

Slug rules: lowercase, spaces → hyphens, remove non-alphanumeric, collapse repeated hyphens.

## Behavioural Contracts

See `BEHAVIOUR.md` for the full contract. Key hard invariants:
- OKLCH L must be **strictly monotonic** (darkest → lightest)
- Midpoint step must equal the **exact input hex** (pinned after OKLCH round-trip)
- No two adjacent steps may produce the same hex
- `temperature === 0` must produce **no intentional hue cast**
- `temperature !== 0` — endpoints must have C > 0.005

## Debug Helpers (browser console)

The `colorModels/index.js` module exports these for validation work:

```js
// Exposed as ToneLadder.* if window-attached, or import directly
validateshade(baseHex, temperature, steps, mode)   // logs per-step hue deltas
compareModes(baseHex, temperature, steps)          // conservative vs painterly side-by-side
debugGamut(baseHex, temperature, steps, mode)      // gamut mapping before/after
debugHighlights(baseHex)                           // hue stability across 8 test cases
debugHue(baseHex, temperature, steps, mode)        // per-step H and Δh summary
```
