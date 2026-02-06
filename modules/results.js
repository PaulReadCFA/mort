/**
 * Results Rendering - Payment summary display
 * ARIA-live for screen reader announcements
 */

import { $ } from './utils.js';

let lastValues = null;

/**
 * Render payment summary results - Now includes principal, rates, and totals
 * @param {Object} result - Calculation results
 * @param {Object} inputs - Input parameters for displaying rates
 */
export function renderResults({ monthlyPayment, annualPayment, totalInterest, totalPaid }, inputs) {
  const content = $('#results-content');
  
  // Calculate monthly rate from annual rate
  const monthlyRate = inputs.rate / 12;
  const principal = inputs.principal;
  
  content.innerHTML = `
    <div class="results-grid">
      <article class="result-box result-box-interest" tabindex="0" role="region"
               aria-label="Total interest paid: ${formatCurrencyWithDecimals(totalInterest)}. Annual rate ${inputs.rate.toFixed(2)} percent, Monthly rate ${monthlyRate.toFixed(4)} percent">
        <div class="result-title">Total Interest Paid</div>
        <div class="result-value" aria-live="polite">${formatCurrencyWithDecimals(totalInterest)}</div>
        <div class="result-detail">Annual interest rate: <strong>${inputs.rate.toFixed(2)}%</strong></div>
        <div class="result-detail">Monthly interest rate: <strong>${monthlyRate.toFixed(4)}%</strong></div>
        <div class="result-detail">Monthly rate equals the calculator input for annual rate divided by 12.</div>
      </article>
    </div>
  `;

  // Note: Removed redundant announcements here to reduce screen reader verbosity
  // The input change announcements in calculator.js are sufficient
  lastValues = { monthlyPayment, annualPayment, totalInterest, totalPaid };
}

/**
 * Format number as currency with 2 decimal places
 * @param {number} value - Number to format
 * @returns {string} - Formatted currency string with .00
 */
function formatCurrencyWithDecimals(value) {
  const formatted = new Intl.NumberFormat('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  }).format(value);
  return 'USD ' + formatted;
}