/**
 * Table Rendering - Annual amortization schedule
 * Semantic, accessible alternative to chart
 * Shows 30 annual rows (not 360 monthly - that's for the chart)
 */

import { $ } from './utils.js';

/**
 * Render annual amortization table with expandable monthly details
 * @param {Object} result - Calculation results with annualSchedule and monthlySchedule
 */
export function renderTable({ annualSchedule, monthlySchedule }) {
  const tbody = $('#table-body');
  
  if (!annualSchedule || annualSchedule.length === 0) {
    tbody.innerHTML = '<tr><td colspan="5" style="text-align:center;padding:1rem;">No data available</td></tr>';
    return;
  }

  // Group monthly data by year
  const monthsByYear = {};
  if (monthlySchedule) {
    monthlySchedule.forEach(month => {
      if (!monthsByYear[month.year]) {
        monthsByYear[month.year] = [];
      }
      monthsByYear[month.year].push(month);
    });
  }

  tbody.innerHTML = annualSchedule.map(row => {
    const hasMonthlyData = monthsByYear[row.year] && monthsByYear[row.year].length > 0;
    const yearRowId = `year-${row.year}`;
    const monthRowsId = `months-${row.year}`;
    
    // Annual summary row with expand button
    let html = `
      <tr class="year-row" id="${yearRowId}">
        <td data-label="Year" style="white-space: nowrap;">
          ${hasMonthlyData ? `
            <button class="expand-btn" 
                    aria-expanded="false" 
                    aria-controls="${monthRowsId}"
                    aria-label="Expand to show monthly details for year ${row.year}">
              <span class="expand-icon" aria-hidden="true">▶</span>
            </button>
          ` : ''}
          <span style="display: inline-block; min-width: 3.5rem;">Year ${row.year}</span>
        </td>
        <td data-label="Principal amortization"><span class="mobile-abbr" style="color: #b82937;">PRN</span><span style="color: #b82937; font-weight: 600;">USD ${formatCurrency(row.principal)}</span></td>
        <td data-label="Interest cash flows"><span class="mobile-abbr" style="color: #0079a6;">INT</span><span style="color: #0079a6; font-weight: 600;">USD ${formatCurrency(row.interest)}</span></td>
        <td data-label="Total mortgage cash flows"><span class="mobile-abbr" style="color: #3c6ae5;">PMT</span><span style="color: #3c6ae5; font-weight: 600;">USD ${formatCurrency(row.totalPayment)}</span></td>
        <td data-label="Remaining balance"><span>USD ${formatCurrency(row.remainingBalance)}</span></td>
      </tr>
    `;
    
    // Monthly detail rows (hidden by default)
    if (hasMonthlyData) {
      monthsByYear[row.year].forEach(month => {
        html += `
          <tr class="month-row" id="${monthRowsId}-${month.monthInYear}" hidden>
            <td class="month-cell">Month ${month.monthInYear}</td>
            <td data-label="Principal amortization"><span class="mobile-abbr" style="color: #b82937;">PRN</span><span style="color: #b82937;">USD ${formatCurrency(month.principal)}</span></td>
            <td data-label="Interest cash flows"><span class="mobile-abbr" style="color: #0079a6;">INT</span><span style="color: #0079a6;">USD ${formatCurrency(month.interest)}</span></td>
            <td data-label="Total mortgage cash flows"><span class="mobile-abbr" style="color: #3c6ae5;">PMT</span><span style="color: #3c6ae5;">USD ${formatCurrency(month.totalPayment)}</span></td>
            <td data-label="Remaining balance"><span>USD ${formatCurrency(month.remainingBalance)}</span></td>
          </tr>
        `;
      });
    }
    
    return html;
  }).join('');
  
  // Add event listeners to expand buttons
  setupExpandButtons();
}

/**
 * Setup expand/collapse button functionality
 */
function setupExpandButtons() {
  const buttons = document.querySelectorAll('.expand-btn');
  
  buttons.forEach(button => {
    button.addEventListener('click', function(e) {
      e.stopPropagation();
      toggleMonthlyRows(this);
    });
    
    // Keyboard support
    button.addEventListener('keydown', function(e) {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        toggleMonthlyRows(this);
      }
    });
  });
}

/**
 * Toggle monthly rows visibility
 */
function toggleMonthlyRows(button) {
  const expanded = button.getAttribute('aria-expanded') === 'true';
  const targetId = button.getAttribute('aria-controls');
  const icon = button.querySelector('.expand-icon');
  
  // Find all month rows for this year
  const monthRows = document.querySelectorAll(`[id^="${targetId}-"]`);
  
  // Extract year number from targetId (e.g., "months-1" -> "1")
  const yearNum = targetId.split('-')[1];
  
  if (expanded) {
    // Collapse
    button.setAttribute('aria-expanded', 'false');
    const label = button.getAttribute('aria-label');
    button.setAttribute('aria-label', label.replace('Collapse', 'Expand'));
    monthRows.forEach(row => row.hidden = true);
    icon.textContent = '▶';
    announceToScreenReader(`Year ${yearNum} monthly details collapsed`);
  } else {
    // Expand
    button.setAttribute('aria-expanded', 'true');
    const label = button.getAttribute('aria-label');
    button.setAttribute('aria-label', label.replace('Expand', 'Collapse'));
    monthRows.forEach(row => row.hidden = false);
    icon.textContent = '▼';
    announceToScreenReader(`Year ${yearNum} expanded, showing ${monthRows.length} months of detailed data`);
  }
}

/**
 * Announce message to screen readers
 */
function announceToScreenReader(message) {
  const announcement = $('#table-announcement');
  if (announcement) {
    announcement.textContent = message;
    setTimeout(() => announcement.textContent = '', 2000);
  }
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