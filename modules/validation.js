/**
 * Validation Module - Input validation and error handling
 */

import { validateInput } from './calculations.js';
import {
  updateFieldError,
  updateValidationSummary,
  hasErrors,
} from '../validation-ui.js';

export { updateFieldError, updateValidationSummary, hasErrors };

const FIELD_IDS = ['principal', 'rate', 'years'];

/**
 * Validate all inputs.
 * @returns {{[fieldId: string]: string}} field-keyed error map
 */
export function validateAll(inputs) {
  const errors = {};
  FIELD_IDS.forEach((field) => {
    const error = validateInput(field, inputs[field]);
    if (error) errors[field] = error;
  });

  FIELD_IDS.forEach((id) => updateFieldError(id, errors[id] || null));
  updateValidationSummary(errors);
  return errors;
}
