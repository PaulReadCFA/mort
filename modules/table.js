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
    // Note: aria-controls removed to avoid ARC errors - no single ID encompasses all month rows
    // The button's relationship to the rows is clear from context (same table row)
    let html = `
      <tr class="year-row" id="${yearRowId}">
        <td data-label="Year" style="white-space: nowrap;">
          ${hasMonthlyData ? `
            <button class="expand-btn" 
                    aria-expanded="false" 
                    aria-label="Expand year ${row.year}">
              <span class="expand-icon" aria-hidden="true">&#9654;</span>
            </button>
          ` : ''}
          <span style="display: inline-block; min-width: 3.5rem;">Year ${row.year}</span>
        </td>
        <td data-label="Principal amortization (PRN) (USD)"><span class="mobile-abbr" style="color: #b82937;">PRN</span><span style="color: #b82937; font-weight: 600;">${formatCurrency(row.principal)}</span></td>
        <td data-label="Interest cash flows (INT) (USD)"><span class="mobile-abbr" style="color: #0079a6;">INT</span><span style="color: #0079a6; font-weight: 600;">${formatCurrency(row.interest)}</span></td>
        <td data-label="Total mortgage cash flows (PMT) (USD)"><span class="mobile-abbr" style="color: #3c6ae5;">PMT</span><span style="color: #3c6ae5; font-weight: 600;">${formatCurrency(row.totalPayment)}</span></td>
        <td data-label="Remaining balance (USD)"><span>${formatCurrency(row.remainingBalance)}</span></td>
      </tr>
    `;
    
    // Monthly detail rows (hidden by default)
    if (hasMonthlyData) {
      monthsByYear[row.year].forEach(month => {
        html += `
          <tr class="month-row" id="${monthRowsId}-${month.monthInYear}" hidden>
            <td class="month-cell">Month ${month.monthInYear}</td>
            <td data-label="Principal amortization (PRN) (USD)"><span class="mobile-abbr" style="color: #b82937;">PRN</span><span style="color: #b82937;">${formatCurrency(month.principal)}</span></td>
            <td data-label="Interest cash flows (INT) (USD)"><span class="mobile-abbr" style="color: #0079a6;">INT</span><span style="color: #0079a6;">${formatCurrency(month.interest)}</span></td>
            <td data-label="Total mortgage cash flows (PMT) (USD)"><span class="mobile-abbr" style="color: #3c6ae5;">PMT</span><span style="color: #3c6ae5;">${formatCurrency(month.totalPayment)}</span></td>
            <td data-label="Remaining balance (USD)"><span>${formatCurrency(month.remainingBalance)}</span></td>
          </tr>
        `;
      });
    }
    
    return html;
  }).join('');
  
  // Add event listeners to expand buttons
  setupExpandButtons();
  
  // Setup keyboard navigation for year rows
  setupTableNavigation();
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
 * Setup keyboard navigation for table year rows
 * Navigation works when table has focus or when expand buttons have focus
 */
function setupTableNavigation() {
  const table = document.getElementById('data-table');
  if (!table) return;
  
  // Add navigation to expand buttons
  const buttons = document.querySelectorAll('.expand-btn');
  
  buttons.forEach(button => {
    button.addEventListener('keydown', function(e) {
      // Don't handle Enter/Space here - let setupExpandButtons handle it
      if (e.key === 'Enter' || e.key === ' ') {
        return;
      }
      
      handleTableNavigation(e, this);
    });
  });
  
  // Also allow navigation when table itself has focus (via skip link)
  table.addEventListener('keydown', function(e) {
    // Only handle if table itself is focused (not a child element)
    if (document.activeElement === table) {
      handleTableNavigation(e, null);
    }
  });
}

/**
 * Handle keyboard navigation within table
 * @param {KeyboardEvent} e - Keyboard event
 * @param {HTMLElement|null} currentButton - Currently focused button, or null if table focused
 */
function handleTableNavigation(e, currentButton) {
  const buttons = Array.from(document.querySelectorAll('.expand-btn'));
  if (buttons.length === 0) return;
  
  let currentIndex = currentButton ? buttons.indexOf(currentButton) : -1;
  let targetIndex = currentIndex;
  
  switch(e.key) {
    case 'Home':
      e.preventDefault();
      targetIndex = 0;
      break;
    
    case 'End':
      e.preventDefault();
      targetIndex = buttons.length - 1;
      break;
    
    case 'PageUp':
      e.preventDefault();
      targetIndex = Math.max(0, currentIndex - 5);
      break;
    
    case 'PageDown':
      e.preventDefault();
      targetIndex = Math.min(buttons.length - 1, currentIndex + 5);
      break;
    
    case 'ArrowUp':
      if (currentIndex > 0) {
        e.preventDefault();
        targetIndex = currentIndex - 1;
      }
      break;
    
    case 'ArrowDown':
      if (currentIndex < buttons.length - 1) {
        e.preventDefault();
        targetIndex = currentIndex + 1;
      } else if (currentIndex === -1) {
        // If table is focused and user presses down, go to first button
        e.preventDefault();
        targetIndex = 0;
      }
      break;
    
    default:
      return; // Don't handle other keys
  }
  
  // Focus and announce if we moved
  if (targetIndex >= 0 && targetIndex !== currentIndex) {
    const targetButton = buttons[targetIndex];
    targetButton.focus();
    
    // Scroll the row into view
    const row = targetButton.closest('tr');
    if (row) {
      row.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
    
    // Extract year number from button's aria-label
    const ariaLabel = targetButton.getAttribute('aria-label');
    const yearMatch = ariaLabel.match(/\d+/);
    const yearNum = yearMatch ? yearMatch[0] : targetIndex + 1;
    
    announceToScreenReader(`Year ${yearNum}`);
  }
}

/**
 * Toggle monthly rows visibility
 */
function toggleMonthlyRows(button) {
  const expanded = button.getAttribute('aria-expanded') === 'true';
  const icon = button.querySelector('.expand-icon');
  
  // Get year number from the button's aria-label (e.g., "Expand year 1" -> "1")
  const ariaLabel = button.getAttribute('aria-label');
  const yearNum = ariaLabel.match(/\d+/)[0];
  const targetId = `months-${yearNum}`;
  
  // Find all month rows for this year
  const monthRows = document.querySelectorAll(`[id^="${targetId}-"]`);
  
  if (expanded) {
    // Collapse
    button.setAttribute('aria-expanded', 'false');
    button.setAttribute('aria-label', `Expand year ${yearNum}`);
    monthRows.forEach(row => row.hidden = true);
    icon.textContent = '\u25B6';  // Right-pointing triangle
    announceToScreenReader(`Year ${yearNum} collapsed`);
  } else {
    // Expand
    button.setAttribute('aria-expanded', 'true');
    button.setAttribute('aria-label', `Collapse year ${yearNum}`);
    monthRows.forEach(row => row.hidden = false);
    icon.textContent = '\u25BC';  // Down-pointing triangle
    announceToScreenReader(`Year ${yearNum} expanded`);
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
 * @returns {string} - Formatted currency string (no USD prefix)
 */
function formatCurrency(value) {
  return value.toLocaleString('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  });
}