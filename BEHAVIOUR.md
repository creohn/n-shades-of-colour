# Tone Ladder — Behaviour Contract

Observable behavioural rules for the colour algorithm.
All algorithm changes must preserve these outcomes.
No rule may reference specific hues, hue ranges, or colour families.

---

## Tier 1 — Hard FAIL

These invariants must hold for every shade. A violation is a bug.

### 1.1 Monotonic lightness

OKLCH L must strictly increase from step 0 (darkest) to step N−1 (lightest).

### 1.2 Midpoint anchoring

The midpoint step (`Math.floor(steps / 2)`) must equal the exact input base hex, case-insensitive. The base colour is never altered.

### 1.3 No dead steps

No two adjacent steps may produce the same hex. Duplicate adjacent swatches indicate a collapsed region in the shades.

### 1.4 Gamut safety

Every output hex must represent a valid sRGB colour (all channels 0–255). The pipeline clamps to gamut, so this should hold inherently — assert it as a safety net.

### 1.5 Temperature-zero neutrality

When `temperature === 0`, the shades must not apply intentional hue cast. Residual hue drift from gamut clamping or round-trip precision is acceptable (< 2° and < 0.005 ΔE from a pure tonal shade). No cast layer, no anchor blending, no tint injection.

### 1.6 Tinted endpoints

When `temperature !== 0`, endpoint steps (first and last) must carry non-zero chroma (C > 0.005). Pure neutral endpoints under coloured light are a failure — the light should leave a trace.

> Threshold justification: C = 0.005 is below visibility but above floating-point noise. It asserts the algorithm attempted a tint, not that the tint is visible.

---

## Tier 2 — Soft WARN

These expectations log warnings for investigation. They do not block.

### 2.1 Control expressivity (temperature)

For bases with visible chroma (C ≥ 0.02 at midpoint), switching temperature between warm (+) and cool (−) at the same absolute value should produce a perceptible difference in at least one of the top 3 highlights or bottom 3 shadows, measured as OKLab ΔE ≥ 0.015.

If no compared pair exceeds the threshold, WARN.

> Chroma threshold: C ≥ 0.02 excludes near-neutrals where the base itself carries negligible colour information.
> ΔE threshold: 0.015 is "barely visible tint" — the floor for distinguishing two near-white swatches. Raised to 0.03 when both swatches have C > 0.01 and L < 0.95 (non-white, chromatic region where differences should be clearer).

### 2.2 Mode separation

For bases with visible chroma (C ≥ 0.02 at midpoint), switching between conservative and painterly at the same temperature should produce a perceptible difference in at least one of the top 3 highlights or bottom 3 shadows, using the same ΔE thresholds as §2.1.

If no compared pair exceeds the threshold, WARN.

### 2.3 Perceptual step spacing

Within each half of the shades (shadows: steps 0 → mid, highlights: mid → N−1), the ratio of the largest adjacent-step ΔE to the smallest adjacent-step ΔE should not exceed 4:1.

If it does, WARN with the ratio and the step pair responsible.

> Ratio threshold: 4:1 is generous. A perfectly even shade is 1:1. Values above 4:1 indicate visible clustering or a large perceptual jump. The previous worst case (light bases) reached 31:1 before the perceptual spacing fix.

---

## Principles (non-enforceable, for design intent)

### Temperature semantics

Temperature models coloured light, not hue rotation. Warm light biases highlights warm and shadows cool. Cool light does the reverse. The algorithm encodes this through anchor blending — the specific anchor hues are implementation detail, not QA.

### Near-neutral bases

When the base has negligible chroma, the light's colour becomes the dominant signal. Chroma is generated (not scaled from the base), peaks at endpoints, and collapses toward the midpoint. This activates only when base chroma is below an internal threshold and temperature is non-zero.

### Mode intent

- **Conservative**: restrained cast; usable without explanation.
- **Creative**: expressive cast; clearly demonstrates the lighting model, even if bold.

### Hue continuity

Hue should progress smoothly across the shades. Sharp categorical hue jumps (e.g. a single step appearing to belong to a different colour) are undesirable but are handled by algorithm design, not by per-family clamps. If continuity breaks for a given input, that is a signal to improve the general interpolation — not to add a hue-specific rule.
