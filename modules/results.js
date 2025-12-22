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
               aria-label="Total interest paid: ${formatCurrencyWithDecimals(totalInterest)}. Monthly rate ${monthlyRate.toFixed(4)} percent, Yearly rate ${inputs.rate.toFixed(2)} percent">
        <div class="result-title">Total Interest Paid</div>
        <div class="result-value" aria-live="polite">${formatCurrencyWithDecimals(totalInterest)}</div>
        <div class="result-detail">Monthly rate: <strong>${monthlyRate.toFixed(4)}%</strong></div>
        <div class="result-detail">Yearly rate: <strong>${inputs.rate.toFixed(2)}%</strong></div>
      </article>
    </div>
  `;

  // Announce changes to screen readers
  if (lastValues !== null) {
    const changed = [];
    if (Math.abs(monthlyPayment - lastValues.monthlyPayment) > 0.01) {
      changed.push(`Monthly payment updated to ${formatCurrencyWithDecimals(monthlyPayment)}`);
    }
    
    if (changed.length > 0) {
      const announcement = $('#result-announcement');
      announcement.textContent = changed.join('. ');
      setTimeout(() => announcement.textContent = '', 2000);
    }
  }

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