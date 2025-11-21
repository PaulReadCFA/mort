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