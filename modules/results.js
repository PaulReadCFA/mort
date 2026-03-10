/**
 * Results Rendering - Payment summary display
 * ARIA-live for screen reader announcements
 */

import { $, formatCurrencyUSD } from './utils.js';

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
               aria-label="Interest data summary">
        <div class="result-title">Total Interest Paid</div>
        <div class="result-value">${formatCurrencyUSD(totalInterest)}</div>
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