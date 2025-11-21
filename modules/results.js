/**
 * Results Rendering - Payment summary display
 * ARIA-live for screen reader announcements
 */

import { $ } from './utils.js';

let lastValues = null;

/**
 * Render payment summary results
 * @param {Object} result - Calculation results
 */
export function renderResults({ monthlyPayment, annualPayment, totalInterest, totalPaid }) {
  const content = $('#results-content');
  
  content.innerHTML = `
    <div class="results-grid">
      <div class="result-box result-box-monthly">
        <div class="result-value">${formatCurrency(monthlyPayment)}</div>
        <div class="result-title">Monthly Payment</div>
      </div>
      
      <div class="result-box result-box-interest">
        <div class="result-value">${formatCurrency(totalInterest)}</div>
        <div class="result-title">Total Interest</div>
      </div>
      
      <div class="result-box result-box-total">
        <div class="result-value">${formatCurrency(totalPaid)}</div>
        <div class="result-title">Total Paid</div>
      </div>
    </div>
  `;

  // Announce changes to screen readers
  if (lastValues !== null) {
    const changed = [];
    if (Math.abs(monthlyPayment - lastValues.monthlyPayment) > 0.01) {
      changed.push(`Monthly payment updated to ${formatCurrency(monthlyPayment)}`);
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
 * Format number as currency
 * @param {number} value - Number to format
 * @returns {string} - Formatted currency string
 */
function formatCurrency(value) {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  }).format(value);
}