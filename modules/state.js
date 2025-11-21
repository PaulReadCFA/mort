/**
 * Simple Observable State - Reactive state management
 * Follows the pattern from the simple calculator example
 */

export const state = {
  inputs: { 
    principal: 800000, 
    rate: 6, 
    years: 30 
  },
  view: 'chart',
  listeners: []
};

/**
 * Update state and notify listeners
 * @param {Object} updates - Partial state updates
 */
export function setState(updates) {
  Object.assign(state, updates);
  state.listeners.forEach(fn => fn(state));
}

/**
 * Subscribe to state changes
 * @param {Function} fn - Callback function
 */
export function subscribe(fn) {
  state.listeners.push(fn);
}