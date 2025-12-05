/**
 * Table Rendering - Annual amortization schedule
 * Semantic, accessible alternative to chart
 * Shows 30 annual rows (not 360 monthly - that's for the chart)
 */

import { $ } from './utils.js';

/**
 * Render annual amortization table
 * @param {Object} result - Calculation results with annualSchedule
 */
export function renderTable({ annualSchedule }) {
  const tbody = $('#table-body');
  
  if (!annualSchedule || annualSchedule.length === 0) {
    tbody.innerHTML = '<tr><td colspan="5" style="text-align:center;padding:1rem;">No data available</td></tr>';
    return;
  }

  tbody.innerHTML = annualSchedule.map(row => `
    <tr>
      <td data-label="Year">Year ${row.year}</td>
      <td data-label="Principal"><span>$${formatCurrency(row.principal)}</span></td>
      <td data-label="Interest"><span>$${formatCurrency(row.interest)}</span></td>
      <td data-label="Total Payment"><span>$${formatCurrency(row.totalPayment)}</span></td>
      <td data-label="Remaining Balance"><span>$${formatCurrency(row.remainingBalance)}</span></td>
    </tr>
  `).join('');
}

/**
 * Format number as currency
 * @param {number} value - Number to format
 * @returns {string} - Formatted currency string
 */
function formatCurrency(value) {
  return value.toLocaleString('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  });
}