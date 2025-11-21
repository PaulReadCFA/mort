/**
 * Validation Module - Input validation and error handling
 * Follows WCAG accessibility guidelines for form validation
 */

import { $, listen } from './utils.js';
import { validateInput } from './calculations.js';

const errors = {};

/**
 * Validate all inputs
 * @param {Object} inputs - Input values to validate
 * @returns {boolean} - True if all valid
 */
export function validateAll(inputs) {
  errors.principal = validateInput('principal', inputs.principal);
  errors.rate = validateInput('rate', inputs.rate);
  errors.years = validateInput('years', inputs.years);

  // Remove null values
  Object.keys(errors).forEach(key => {
    if (errors[key] === null) delete errors[key];
  });

  updateValidationSummary();
  return Object.keys(errors).length === 0;
}

/**
 * Update validation summary display
 */
function updateValidationSummary() {
  const summary = $('#validation-summary');
  const list = $('#validation-list');
  
  if (!summary || !list) return;

  if (Object.keys(errors).length > 0) {
    list.innerHTML = Object.entries(errors)
      .map(([field, message]) => `<li>${message}</li>`)
      .join('');
    summary.style.display = 'block';
    
    // Focus first invalid field
    const firstInvalidField = Object.keys(errors)[0];
    const element = $(`#${firstInvalidField}`);
    if (element) {
      element.setAttribute('aria-invalid', 'true');
      element.focus();
    }
  } else {
    summary.style.display = 'none';
    
    // Clear aria-invalid from all fields
    ['principal', 'rate', 'years'].forEach(field => {
      const element = $(`#${field}`);
      if (element) {
        element.removeAttribute('aria-invalid');
      }
    });
  }
}

/**
 * Setup real-time validation for a field
 * @param {string} fieldId - Input field ID
 * @param {Function} callback - Callback when validation passes
 */
export function setupFieldValidation(fieldId, callback) {
  const element = $(`#${fieldId}`);
  if (!element) return;

  listen(element, 'blur', () => {
    const value = Number(element.value);
    const error = validateInput(fieldId, value);
    
    if (error) {
      errors[fieldId] = error;
      element.setAttribute('aria-invalid', 'true');
    } else {
      delete errors[fieldId];
      element.removeAttribute('aria-invalid');
    }
    
    updateValidationSummary();
    
    if (!error && callback) {
      callback();
    }
  });
}