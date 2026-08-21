/**
 * Utility Functions - DOM helpers, events, debounce
 * Reusable across all calculator tools
 */

/**
 * Query selector shorthand
 * @param {string} selector - CSS selector
 * @returns {HTMLElement} - DOM element
 */
export const $ = selector => document.querySelector(selector);

/**
 * Add event listener helper
 * @param {string|HTMLElement} selector - CSS selector or element
 * @param {string} event - Event name
 * @param {Function} handler - Event handler
 */
export const listen = (selector, event, handler) => {
  const element = typeof selector === 'string' ? $(selector) : selector;
  if (element) {
    element.addEventListener(event, handler);
  }
};

/**
 * Debounce function execution
 * @param {Function} fn - Function to debounce
 * @param {number} wait - Wait time in milliseconds
 * @returns {Function} - Debounced function
 */
export const debounce = (fn, wait = 300) => {
  let timeout;
  return (...args) => {
    clearTimeout(timeout);
    timeout = setTimeout(() => fn(...args), wait);
  };
};

export const NUMERIC_INPUT_MAX_CHARS = 6;
export const FORMATTED_NUMERIC_INPUT_MAX_CHARS = 10;

/**
 * @param {HTMLInputElement} input
 * @param {number} maxLen
 */
export function clampNumericInputLength(input, maxLen) {
  if (!input || input.value == null || maxLen <= 0) return;
  const raw = String(input.value);
  if (raw.length <= maxLen) return;
  const start = input.selectionStart;
  const end = input.selectionEnd;
  input.value = raw.slice(0, maxLen);
  if (typeof input.setSelectionRange === 'function') {
    const pos = Math.min(
      typeof start === 'number' && typeof end === 'number' ? Math.min(start, end) : maxLen,
      maxLen
    );
    input.setSelectionRange(pos, pos);
  }
}

/**
 * Format number as currency
 * @param {number} value - Number to format
 * @returns {string} - Formatted currency string
 */
export function formatCurrency(value) {
  return value.toLocaleString('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  });
}

/**
 * Format number as currency with USD prefix
 * @param {number} value - Number to format
 * @returns {string} - Formatted currency string with USD prefix
 */
export function formatCurrencyUSD(value) {
  return 'USD ' + formatCurrency(value);
}

/**
 * Mirror the implicit table semantics as explicit ARIA roles.
 *
 * Below 768px the shared base reflows rows into cards with display:block,
 * which makes browsers drop the implicit table/row/cell roles. Without these
 * attributes a screen reader reads the card as a flat run of text instead of
 * announcing row and column positions. Harmless at wider widths, where the
 * roles simply restate the native semantics.
 *
 * @param {Element|null} table - Table element to annotate
 */
export function applyTableRoles(table) {
  if (!table) return;

  table.setAttribute('role', 'table');
  table.querySelectorAll('thead, tbody, tfoot').forEach((group) => {
    group.setAttribute('role', 'rowgroup');
  });
  table.querySelectorAll('tr').forEach((row) => {
    row.setAttribute('role', 'row');
  });
  table.querySelectorAll('th').forEach((header) => {
    header.setAttribute(
      'role',
      header.getAttribute('scope') === 'row' ? 'rowheader' : 'columnheader'
    );
  });
  table.querySelectorAll('td').forEach((cell) => {
    cell.setAttribute('role', 'cell');
  });
  // colspan is ignored once the cells are display:block
  table.querySelectorAll('[colspan]').forEach((cell) => {
    cell.setAttribute('aria-colspan', cell.getAttribute('colspan'));
  });
}
