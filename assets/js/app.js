/**
 * n Shades of Colour - Application
 *
 * Orchestrates UI, state, and event wiring.
 * Uses history.js and storage.js as source of truth for persisted lists.
 */

import { generateShades } from './colorModels/index.js';
import { hexToOklch } from './colorModels/convert.js';
import * as history from './history.js';
import { generateFactualLabel, generateTokenPrefix } from './history.js';

const ICON_STAR = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 640 640" width="1.7em" height="1.7em" aria-hidden="true"><path fill="currentColor" d="M320.1 32C329.1 32 337.4 37.1 341.5 45.1L415 189.3L574.9 214.7C583.8 216.1 591.2 222.4 594 231C596.8 239.6 594.5 249 588.2 255.4L473.7 369.9L499 529.8C500.4 538.7 496.7 547.7 489.4 553C482.1 558.3 472.4 559.1 464.4 555L320.1 481.6L175.8 555C167.8 559.1 158.1 558.3 150.8 553C143.5 547.7 139.8 538.8 141.2 529.8L166.4 369.9L52 255.4C45.6 249 43.4 239.6 46.2 231C49 222.4 56.3 216.1 65.3 214.7L225.2 189.3L298.8 45.1C302.9 37.1 311.2 32 320.2 32zM320.1 108.8L262.3 222C258.8 228.8 252.3 233.6 244.7 234.8L119.2 254.8L209 344.7C214.4 350.1 216.9 357.8 215.7 365.4L195.9 490.9L309.2 433.3C316 429.8 324.1 429.8 331 433.3L444.3 490.9L424.5 365.4C423.3 357.8 425.8 350.1 431.2 344.7L521 254.8L395.5 234.8C387.9 233.6 381.4 228.8 377.9 222L320.1 108.8z"/></svg>';
const ICON_STAR_SOLID = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 640 640" width="1.7em" height="1.7em" aria-hidden="true"><path fill="currentColor" d="M341.5 45.1C337.4 37.1 329.1 32 320.1 32C311.1 32 302.8 37.1 298.7 45.1L225.1 189.3L65.2 214.7C56.3 216.1 48.9 222.4 46.1 231C43.3 239.6 45.6 249 51.9 255.4L166.3 369.9L141.1 529.8C139.7 538.7 143.4 547.7 150.7 553C158 558.3 167.6 559.1 175.7 555L320.1 481.6L464.4 555C472.4 559.1 482.1 558.3 489.4 553C496.7 547.7 500.4 538.8 499 529.8L473.7 369.9L588.1 255.4C594.5 249 596.7 239.6 593.9 231C591.1 222.4 583.8 216.1 574.8 214.7L415 189.3L341.5 45.1z"/></svg>';
const ICON_XMARK = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 640 640" width="1.7em" height="1.7em" aria-hidden="true"><path fill="currentColor" d="M183.1 137.4C170.6 124.9 150.3 124.9 137.8 137.4C125.3 149.9 125.3 170.2 137.8 182.7L275.2 320L137.9 457.4C125.4 469.9 125.4 490.2 137.9 502.7C150.4 515.2 170.7 515.2 183.2 502.7L320.5 365.3L457.9 502.6C470.4 515.1 490.7 515.1 503.2 502.6C515.7 490.1 515.7 469.8 503.2 457.3L365.8 320L503.1 182.6C515.6 170.1 515.6 149.8 503.1 137.3C490.6 124.8 470.3 124.8 457.8 137.3L320.5 274.7L183.1 137.4z"/></svg>';

// ==========================================================================
// State
// ==========================================================================

const state = {
  input: {
    baseHex: '#129E8F',
    label: '',
    temperature: 0.25,
    steps: 9,
    mode: 'creative'
  },
  preview: {
    shadesHexes: null,
    tokenPrefix: null
  }
};

// ==========================================================================
// DOM References
// ==========================================================================

const dom = {
  // Inputs
  inputHex: document.getElementById('input-hex'),
  inputColorPicker: document.getElementById('input-color-picker'),
  inputLabel: document.getElementById('input-label'),
  inputTemperature: document.getElementById('input-temperature'),
  temperatureDisplay: document.getElementById('temperature-display'),
  btnSteps: document.querySelectorAll('[data-steps]'),
  btnModes: document.querySelectorAll('[data-mode]'),
  btnGenerate: document.getElementById('btn-generate'),

  // Preview
  previewShades: document.getElementById('preview-shades'),

  // History
  recentList: document.getElementById('recent-list'),
  recentEmpty: document.getElementById('recent-empty'),
  starredList: document.getElementById('starred-list'),
  starredEmpty: document.getElementById('starred-empty'),
  btnUndo: document.getElementById('btn-undo'),
  btnClearAll: document.getElementById('btn-clear-all'),

  // Export
  exportPanel: document.getElementById('export-panel'),
  exportFormatSelect: document.getElementById('export-format-select'),
  exportCode: document.getElementById('export-code'),
  btnCopy: document.getElementById('btn-copy'),
  copyFeedback: document.getElementById('copy-feedback'),

  // Feedback
  addFeedback: document.getElementById('add-feedback')
};

// ==========================================================================
// Utilities
// ==========================================================================

/**
 * Normalise hex input (ensure # prefix, lowercase)
 */
function normaliseHex(hex) {
  let cleaned = String(hex).trim();
  if (!cleaned.startsWith('#')) {
    cleaned = '#' + cleaned;
  }
  return cleaned.toLowerCase();
}

/**
 * Validate hex format
 */
function isValidHex(hex) {
  return /^#[0-9A-Fa-f]{6}$/.test(hex);
}

/**
 * Format temperature for display
 */
function formatTemperature(value) {
  const num = parseFloat(value);
  if (num > 0) return '+' + num.toFixed(2);
  if (num < 0) return num.toFixed(2);
  return '0.00';
}

/**
 * Sort hex array by OKLCH lightness (darkest to lightest)
 * Ensures monotonic perceived lightness after conversion artifacts
 */
function sortByLightness(hexArray) {
  return [...hexArray].sort((a, b) => {
    const aL = hexToOklch(a).L;
    const bL = hexToOklch(b).L;
    return aL - bL;
  });
}

// ==========================================================================
// Rendering
// ==========================================================================

/**
 * Render preview shades swatches
 */
function renderPreview() {
  const { shadesHexes } = state.preview;

  if (!shadesHexes || shadesHexes.length === 0) {
    dom.previewShades.innerHTML = '<p class="history-empty">Tweak settings to see your shades</p>';
    dom.exportPanel.hidden = true;
    return;
  }

  dom.previewShades.innerHTML = shadesHexes.map((hex, i) => `
    <div class="swatch" style="background-color: ${hex}">
      <span class="swatch__hex">${hex}</span>
    </div>
  `).join('');

  dom.exportPanel.hidden = false;
  renderExport();
}

/**
 * Render export code
 */
function renderExport() {
  const { shadesHexes, tokenPrefix } = state.preview;
  if (!shadesHexes || !tokenPrefix) return;

  const format = dom.exportFormatSelect.value;
  const prefix = format === 'long' ? '--color-' : '--';

  const lines = shadesHexes.map((hex, i) => `${prefix}${tokenPrefix}-${i}: ${hex};`);
  const half = Math.ceil(lines.length / 2);
  dom.exportCode.innerHTML =
    `<pre>${lines.slice(0, half).join('\n')}</pre><pre>${lines.slice(half).join('\n')}</pre>`;
}

/**
 * Render a mini swatch strip for history entries
 */
function renderSwatchStrip(shadesHexes) {
  return `
    <div class="swatch-strip">
      ${shadesHexes.map(hex => `<div class="swatch-mini" style="background-color: ${hex}"></div>`).join('')}
    </div>
  `;
}

/**
 * Render recent list
 */
function renderRecent() {
  const recent = history.getRecent();

  const recentPanel = dom.recentList.closest('.panel');
  if (recent.length === 0) {
    dom.recentList.innerHTML = '';
    dom.recentEmpty.hidden = false;
    recentPanel.classList.remove('has-entries');
    return;
  }

  dom.recentEmpty.hidden = true;
  recentPanel.classList.add('has-entries');
  dom.recentList.innerHTML = recent.map(entry => {
    const starred = history.isStarred(entry);
    const factualLabel = generateFactualLabel(entry);
    const customLabel = entry.customLabel || entry.label || null; // Legacy support
    const hasCustomLabel = customLabel && customLabel.trim();

    return `
      <li class="history-entry" data-id="${entry.id}">
        <div class="history-entry__header">
          <div class="history-entry__info">
            <div class="history-entry__label">${escapeHtml(factualLabel)}</div>
            ${hasCustomLabel ? `<div class="history-entry__custom">${escapeHtml(customLabel)}</div>` : ''}
          </div>
          <div class="history-entry__actions">
            <button type="button" class="btn-icon btn-icon--star ${starred ? 'is-starred' : ''}"
                    data-action="star" data-id="${entry.id}"
                    title="${starred ? 'Unstar' : 'Star'}">
              ${starred ? ICON_STAR_SOLID : ICON_STAR}
            </button>
            <button type="button" class="btn-icon btn-icon--remove"
                    data-action="remove" data-id="${entry.id}"
                    title="Remove">
              ${ICON_XMARK}
            </button>
          </div>
        </div>
        ${renderSwatchStrip(entry.shadesHexes)}
      </li>
    `;
  }).join('');
}

/**
 * Render starred list
 */
function renderStarred() {
  const starred = history.getStarred();

  const starredPanel = dom.starredList.closest('.panel');
  if (starred.length === 0) {
    dom.starredList.innerHTML = '';
    dom.starredEmpty.hidden = false;
    starredPanel.classList.remove('has-entries');
    return;
  }

  dom.starredEmpty.hidden = true;
  starredPanel.classList.add('has-entries');
  dom.starredList.innerHTML = starred.map(entry => {
    const factualLabel = generateFactualLabel(entry);
    const customLabel = entry.customLabel || entry.label || null; // Legacy support
    const hasCustomLabel = customLabel && customLabel.trim();

    return `
      <li class="history-entry" data-id="${entry.id}" data-source="starred">
        <div class="history-entry__header">
          <div class="history-entry__info">
            <div class="history-entry__label">${escapeHtml(factualLabel)}</div>
            ${hasCustomLabel ? `<div class="history-entry__custom">${escapeHtml(customLabel)}</div>` : ''}
          </div>
          <div class="history-entry__actions">
            <button type="button" class="btn-icon btn-icon--star is-starred"
                    data-action="unstar" data-id="${entry.id}"
                    title="Unstar">
              ${ICON_STAR_SOLID}
            </button>
          </div>
        </div>
        ${renderSwatchStrip(entry.shadesHexes)}
      </li>
    `;
  }).join('');
}

/**
 * Render undo button visibility
 */
function renderUndo() {
  dom.btnUndo.hidden = !history.canUndo();
}

/**
 * Escape HTML to prevent XSS
 */
function escapeHtml(text) {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

/**
 * Render all history-related UI
 */
function renderHistory() {
  renderRecent();
  renderStarred();
  renderUndo();
}

// ==========================================================================
// State Updates
// ==========================================================================

/**
 * Update preview from current input state
 */
function updatePreview() {
  const { baseHex, label, temperature, steps, mode } = state.input;

  // Validate hex
  if (!isValidHex(baseHex)) {
    dom.inputHex.classList.add('is-invalid');
    return;
  }
  dom.inputHex.classList.remove('is-invalid');

  // Generate shades for preview
  // Temperature mapping is handled internally by the color model
  // Shades are generated in correct order (darkest → lightest) by construction
  try {
    const rawShades = generateShades(baseHex, temperature, steps, mode);
    state.preview.shadesHexes = rawShades;
    state.preview.tokenPrefix = generateTokenPrefix(label, baseHex, temperature, mode, steps);
    renderPreview();
  } catch (e) {
    console.error('Failed to generate shades:', e);
  }
}

/**
 * Load an entry into the input/preview state (does not generate)
 */
function loadEntry(entry) {
  // Get custom label (with legacy support)
  const customLabel = entry.customLabel || entry.label || '';

  // Update state
  state.input.baseHex = entry.baseHex;
  state.input.label = customLabel;
  state.input.temperature = entry.temperature;
  state.input.steps = entry.steps;
  state.input.mode = entry.mode;

  // Load the stored shades directly (do not regenerate)
  state.preview.shadesHexes = entry.shadesHexes;
  // Use stored tokenPrefix or generate from entry settings (legacy support)
  state.preview.tokenPrefix = entry.tokenPrefix ||
    generateTokenPrefix(entry.customLabel || entry.label, entry.baseHex, entry.temperature, entry.mode, entry.steps);

  // Update UI inputs
  dom.inputHex.value = entry.baseHex;
  dom.inputColorPicker.value = entry.baseHex;
  dom.inputLabel.value = customLabel;
  dom.inputTemperature.value = entry.temperature;
  dom.temperatureDisplay.textContent = formatTemperature(entry.temperature);

  // Update toggle buttons
  dom.btnSteps.forEach(btn => {
    btn.setAttribute('aria-pressed', btn.dataset.steps === String(entry.steps));
  });
  dom.btnModes.forEach(btn => {
    btn.setAttribute('aria-pressed', btn.dataset.mode === entry.mode);
  });

  renderPreview();
}

// ==========================================================================
// Event Handlers
// ==========================================================================

/**
 * Handle hex input change
 */
function handleHexInput(e) {
  let value = e.target.value.trim();
  if (value && !value.startsWith('#')) {
    value = '#' + value;
  }
  state.input.baseHex = value.toUpperCase();

  // Sync colour picker if valid
  if (isValidHex(state.input.baseHex)) {
    dom.inputColorPicker.value = state.input.baseHex;
  }

  updatePreview();
}

/**
 * Handle colour picker change
 */
function handleColorPicker(e) {
  state.input.baseHex = e.target.value.toUpperCase();
  dom.inputHex.value = state.input.baseHex;
  updatePreview();
}

/**
 * Handle label input change
 */
function handleLabelInput(e) {
  state.input.label = e.target.value;
  const { baseHex, temperature, steps, mode } = state.input;
  state.preview.tokenPrefix = generateTokenPrefix(e.target.value, baseHex, temperature, mode, steps);
  renderExport();
}

/**
 * Handle temperature slider change
 */
function handleTemperatureChange(e) {
  state.input.temperature = parseFloat(e.target.value);
  dom.temperatureDisplay.textContent = formatTemperature(state.input.temperature);
  updatePreview();
}

/**
 * Handle steps toggle
 */
function handleStepsToggle(e) {
  const btn = e.target.closest('[data-steps]');
  if (!btn) return;

  const steps = parseInt(btn.dataset.steps, 10);
  state.input.steps = steps;

  dom.btnSteps.forEach(b => {
    b.setAttribute('aria-pressed', b.dataset.steps === String(steps));
  });

  updatePreview();
}

/**
 * Handle mode toggle
 */
function handleModeToggle(e) {
  const btn = e.target.closest('[data-mode]');
  if (!btn) return;

  const mode = btn.dataset.mode;
  state.input.mode = mode;

  dom.btnModes.forEach(b => {
    b.setAttribute('aria-pressed', b.dataset.mode === mode);
  });

  updatePreview();
}

/**
 * Handle "Add to History" button - saves current preview as a snapshot
 */
function handleAddToHistory() {
  const { baseHex, label, temperature, steps, mode } = state.input;

  // Validate hex only (label is optional)
  if (!isValidHex(baseHex)) {
    dom.inputHex.focus();
    return;
  }

  // Use current preview shades (already generated live)
  const shadesHexes = state.preview.shadesHexes;
  if (!shadesHexes || shadesHexes.length === 0) {
    return;
  }

  // Create entry and add to history
  // Label is optional - pass trimmed value or empty string
  const entry = history.createEntry(label.trim(), baseHex, temperature, steps, mode, shadesHexes);
  const wasAdded = history.addToRecent(entry);

  if (wasAdded) {
    // Update token prefix in preview state
    state.preview.tokenPrefix = entry.tokenPrefix;

    renderPreview();
    renderHistory();

    // Show brief feedback
    dom.addFeedback.hidden = false;
    setTimeout(() => {
      dom.addFeedback.hidden = true;
    }, 1500);
  }
  // If not added (duplicate), silent no-op
}

/**
 * Handle clicking on a history entry (load into preview)
 */
function handleHistoryClick(e) {
  // Don't load if clicking an action button
  if (e.target.closest('[data-action]')) return;

  const entryEl = e.target.closest('.history-entry');
  if (!entryEl) return;

  const id = entryEl.dataset.id;
  const entry = history.findEntry(id);

  if (entry) {
    loadEntry(entry);
  }
}

/**
 * Handle history action buttons (star, unstar, remove)
 */
function handleHistoryAction(e) {
  const btn = e.target.closest('[data-action]');
  if (!btn) return;

  e.stopPropagation();

  const action = btn.dataset.action;
  const id = btn.dataset.id;

  switch (action) {
    case 'star':
      if (history.isStarred(history.findEntry(id))) {
        history.unstar(id);
      } else {
        history.star(id);
      }
      break;
    case 'unstar':
      history.unstar(id);
      break;
    case 'remove':
      history.removeFromRecent(id);
      break;
  }

  renderHistory();
}

/**
 * Handle undo button
 */
function handleUndo() {
  history.undo();
  renderHistory();
}

/**
 * Handle clear all button
 */
function handleClearAll() {
  if (confirm('Are you sure? This will clear all recent and starred shades.')) {
    history.clearAll();
    renderHistory();
  }
}

/**
 * Handle export format change
 */
function handleExportFormatChange() {
  renderExport();
}

/**
 * Handle copy to clipboard
 */
async function handleCopy() {
  const code = Array.from(dom.exportCode.querySelectorAll('pre'))
    .map(pre => pre.textContent)
    .join('\n');

  try {
    await navigator.clipboard.writeText(code);
    dom.copyFeedback.hidden = false;
    setTimeout(() => {
      dom.copyFeedback.hidden = true;
    }, 2000);
  } catch (e) {
    console.error('Failed to copy:', e);
    // Fallback for older browsers
    const textarea = document.createElement('textarea');
    textarea.value = code;
    document.body.appendChild(textarea);
    textarea.select();
    document.execCommand('copy');
    document.body.removeChild(textarea);
    dom.copyFeedback.hidden = false;
    setTimeout(() => {
      dom.copyFeedback.hidden = true;
    }, 2000);
  }
}

// ==========================================================================
// Initialisation
// ==========================================================================

function init() {
  // Load history from storage
  history.init();

  // Set initial input values
  dom.inputHex.value = state.input.baseHex;
  dom.inputColorPicker.value = state.input.baseHex;
  dom.inputLabel.value = state.input.label;
  dom.inputTemperature.value = state.input.temperature;
  dom.temperatureDisplay.textContent = formatTemperature(state.input.temperature);

  // Generate initial preview
  updatePreview();

  // Render history
  renderHistory();

  // Bind events - Inputs
  dom.inputHex.addEventListener('input', handleHexInput);
  dom.inputColorPicker.addEventListener('input', handleColorPicker);
  dom.inputLabel.addEventListener('input', handleLabelInput);
  dom.inputTemperature.addEventListener('input', handleTemperatureChange);

  dom.btnSteps.forEach(btn => {
    btn.addEventListener('click', handleStepsToggle);
  });

  dom.btnModes.forEach(btn => {
    btn.addEventListener('click', handleModeToggle);
  });

  dom.btnGenerate.addEventListener('click', handleAddToHistory);

  // Bind events - History
  dom.recentList.addEventListener('click', handleHistoryClick);
  dom.recentList.addEventListener('click', handleHistoryAction);
  dom.starredList.addEventListener('click', handleHistoryClick);
  dom.starredList.addEventListener('click', handleHistoryAction);
  dom.btnUndo.addEventListener('click', handleUndo);
  dom.btnClearAll.addEventListener('click', handleClearAll);

  // Bind events - Export
  dom.exportFormatSelect.addEventListener('change', handleExportFormatChange);
  dom.btnCopy.addEventListener('click', handleCopy);
}

// Start app
init();
