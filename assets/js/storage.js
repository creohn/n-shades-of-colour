/**
 * n Shades of Colour Storage Module
 *
 * Handles localStorage persistence for history data.
 *
 * PERSISTED (in localStorage key "nShadesOfColour"):
 *   - version: schema version number
 *   - recent: array of recent HistoryEntry objects
 *   - starred: array of starred HistoryEntry objects
 *
 * NOT PERSISTED:
 *   - undo buffer (managed in-memory by history.js)
 *   - preview state
 *   - input field state
 */

const STORAGE_KEY = 'nShadesOfColour';
const CURRENT_VERSION = 1;

/**
 * Default empty data structure
 */
function createEmptyData() {
  return {
    version: CURRENT_VERSION,
    recent: [],
    starred: []
  };
}

/**
 * Validate that data has required structure
 * @param {any} data - Data to validate
 * @returns {boolean} True if valid
 */
function isValidData(data) {
  if (!data || typeof data !== 'object') {
    return false;
  }

  if (typeof data.version !== 'number') {
    return false;
  }

  if (!Array.isArray(data.recent) || !Array.isArray(data.starred)) {
    return false;
  }

  return true;
}

/**
 * Validate a single history entry has required fields
 * @param {any} entry - Entry to validate
 * @returns {boolean} True if valid
 */
function isValidEntry(entry) {
  if (!entry || typeof entry !== 'object') {
    return false;
  }

  // Required fields
  const requiredStrings = ['id', 'baseHex', 'mode'];
  const requiredNumbers = ['temperature', 'steps', 'createdAt'];

  for (const field of requiredStrings) {
    if (typeof entry[field] !== 'string') {
      return false;
    }
  }

  for (const field of requiredNumbers) {
    if (typeof entry[field] !== 'number') {
      return false;
    }
  }

  // shadesHexes must be array of strings
  if (!Array.isArray(entry.shadesHexes)) {
    return false;
  }

  for (const hex of entry.shadesHexes) {
    if (typeof hex !== 'string') {
      return false;
    }
  }

  return true;
}

/**
 * Filter array to only valid entries
 * @param {any[]} entries - Entries to filter
 * @returns {Object[]} Valid entries only
 */
function filterValidEntries(entries) {
  return entries.filter(isValidEntry);
}

/**
 * Load data from localStorage
 *
 * Returns valid data if found, or safe defaults if:
 *   - localStorage is empty
 *   - data is corrupt/unparseable
 *   - data fails validation
 *
 * Invalid entries within valid data are silently filtered out.
 *
 * @returns {{ version: number, recent: Object[], starred: Object[] }}
 */
export function load() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);

    if (!raw) {
      return createEmptyData();
    }

    const data = JSON.parse(raw);

    if (!isValidData(data)) {
      console.warn('n Shades of Colour: Invalid storage data, returning defaults');
      return createEmptyData();
    }

    // Filter out any invalid entries while preserving valid ones
    return {
      version: data.version,
      recent: filterValidEntries(data.recent),
      starred: filterValidEntries(data.starred)
    };
  } catch (e) {
    console.warn('n Shades of Colour: Failed to load storage, returning defaults', e);
    return createEmptyData();
  }
}

/**
 * Save data to localStorage
 *
 * Persists version, recent, and starred arrays.
 *
 * @param {{ version?: number, recent: Object[], starred: Object[] }} data
 */
export function save(data) {
  try {
    const toSave = {
      version: CURRENT_VERSION,
      recent: data.recent || [],
      starred: data.starred || []
    };

    localStorage.setItem(STORAGE_KEY, JSON.stringify(toSave));
  } catch (e) {
    console.error('n Shades of Colour: Failed to save to storage', e);
  }
}

