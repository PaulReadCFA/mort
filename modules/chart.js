/**
 * Chart.js - Stacked Bar Chart for Annual Principal/Interest
 * Includes roving tabindex, keyboard navigation, and tooltips
 */

import { $ } from './utils.js';

let chart = null;
let barButtons = [];
let currentIndex = 0;

/**
 * Render stacked bar chart showing principal and interest by year
 * @param {Object} result - Calculation results with schedule
 * @param {Object} inputs - Input parameters for interest rate
 */
export function renderChart({ schedule }, inputs) {
  const container = $('#chart-container');
  const canvas = $('#chart');
  if (!canvas || !schedule || schedule.length === 0) return;

  // Clean up existing buttons
  barButtons.forEach(b => b.remove());
  barButtons = [];
  currentIndex = 0;
  canvas.tabIndex = -1;

 // Get interest rate from inputs
  const annualRate = inputs?.rate || 6;

  // Add or update legend
  let legend = container.parentElement.querySelector('.chart-legend');
  if (!legend) {
    legend = document.createElement('div');
    legend.className = 'chart-legend';
    container.parentElement.insertBefore(legend, container);
  }
  
  legend.innerHTML = `
    <span class="legend-item">
      <span class="legend-color" style="background-color: #3c6ae5;"></span>
      Interest Payment
    </span>
    <span class="legend-item">
      <span class="legend-color" style="background-color: #047857;"></span>
      Principal Amortization
    </span>
    <span class="legend-item">
      <span class="legend-color" style="background-color: #7a46ff; border: 3px dashed #7a46ff; background: transparent;"></span>
      Interest Rate (<strong style="color: #7a46ff;">${annualRate}%</strong>)
    </span>
  `;

  // Destroy existing chart
  if (chart) chart.destroy();

  // Prepare data for stacked bar chart
  const labels = schedule.map(row => `Year ${row.year}`);
  const principalData = schedule.map(row => row.principal);
  const interestData = schedule.map(row => row.interest);

 
  
  // Create stacked bar chart
  chart = new Chart(canvas, {
    type: 'bar',
    data: {
      labels: labels,
      datasets: [
        {
          label: 'Interest Payment',
          data: interestData,
          backgroundColor: '#3c6ae5',
          borderWidth: 0,
          order: 2  // Draw behind the line
        },
        {
          label: 'Principal Amortization',
          data: principalData,
          backgroundColor: '#047857',
          borderWidth: 0,
          order: 2  // Draw behind the line
        },
        // Interest rate horizontal line
        {
          label: 'Interest Rate (r)',
          data: labels.map(() => annualRate),
          type: 'line',
          borderColor: '#7a46ff',
          borderWidth: 5,  // Increased from 4 to 5 for better visibility
          borderDash: [10, 5],  // Longer dashes for better visibility
          pointRadius: 5,  // Larger points
          pointHoverRadius: 7,  // Larger hover radius
          pointBackgroundColor: '#7a46ff',
          pointBorderColor: '#ffffff',
          pointBorderWidth: 2,
          fill: false,
          yAxisID: 'y2',
          order: 0  // Draw on top of bars
        }
      ]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      interaction: {
        mode: 'index',
        intersect: false
      },
      scales: {
        x: {
          stacked: true,
          title: {
            display: true,
            text: 'Years'
          },
          grid: {
            display: false
          },
          ticks: {
            maxRotation: 45,
            minRotation: 0
          }
        },
        y: {
          stacked: true,
          beginAtZero: true,
          position: 'left',
          title: {
            display: true,
            text: 'Payment Amount ($)'
          },
          ticks: {
            callback: function(value) {
              return '$' + value.toLocaleString();
            }
          }
        },
        y2: {
          position: 'right',
          min: 0,
          max: Math.max(12, annualRate * 1.5),
          title: {
            display: true,
            text: 'Rate (%)',
            color: '#7a46ff'
          },
          ticks: {
            callback: function(value) {
              return value.toFixed(1) + '%';
            },
            color: '#7a46ff'
          },
          grid: {
            display: false
          }
        }
      },
      plugins: {
        legend: {
          display: false,
          text: `Amortization Schedule: ${formatCurrency(inputs.principal)} loan, ${inputs.years} years, ${inputs.rate}% annual`,
      font: { size: 16, weight: 'bold' },
          position: 'top'
        },
        tooltip: {
          enabled: true,
          callbacks: {
            title: function(context) {
              return context[0].label;
            },
            label: function(context) {
              const label = context.dataset.label || '';
              const value = context.parsed.y;
              return `${label}: $${value.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
            },
            afterBody: function(context) {
              const index = context[0].dataIndex;
              const total = schedule[index].totalPayment;
              return `Total: $${total.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
            }
          }
        }
      },
      onClick: (e, elements) => {
        if (elements.length > 0) {
          const index = elements[0].index;
          if (barButtons[index]) {
            barButtons[index].focus();
          }
        }
      }
    }
  });

  // Add keyboard-accessible button overlays after chart renders
  requestAnimationFrame(() => {
    requestAnimationFrame(() => {
      createBarButtons(schedule, container);
      
      // Add educational note if not already present
      const parentCard = container.closest('.card');
      if (parentCard && !parentCard.querySelector('.educational-note')) {
        const note = document.createElement('div');
        note.className = 'educational-note';
        note.innerHTML = '<strong>Mortgage Amortization:</strong> Early payments are mostly interest; principal portion increases over time as balance decreases.';
        parentCard.appendChild(note);
      }
    });
  });
}

/**
 * Create accessible button overlays for each bar
 * @param {Array} schedule - Annual schedule data
 * @param {HTMLElement} container - Chart container element
 */
function createBarButtons(schedule, container) {
  schedule.forEach((row, index) => {
    const meta = chart.getDatasetMeta(0);
    const bar = meta.data[index];
    if (!bar) return;

    const btn = document.createElement('button');
    btn.className = 'chart-bar-button';
    btn.tabIndex = index === 0 ? 0 : -1;
    btn.setAttribute('aria-label', 
      `Year ${row.year}: Interest $${formatCurrency(row.interest)}, Principal $${formatCurrency(row.principal)}, Total $${formatCurrency(row.totalPayment)}`
    );

    // Position button over the entire stacked bar
    const interestMeta = chart.getDatasetMeta(1);
    const interestBar = interestMeta.data[index];
    
    btn.style.left = `${bar.x - bar.width / 2}px`;
    btn.style.top = `${interestBar.y}px`;
    btn.style.width = `${bar.width}px`;
    btn.style.height = `${bar.base - interestBar.y}px`;

    container.appendChild(btn);
    barButtons.push(btn);

    // Click handler
    btn.addEventListener('click', e => {
      e.stopPropagation();
      btn.focus();
    });

    // Focus handler
    btn.addEventListener('focus', () => {
      currentIndex = index;
      barButtons.forEach((b, idx) => {
        b.tabIndex = idx === index ? 0 : -1;
      });
      highlightBar(index);
      showTooltip(index);
      announceBar(row, index);
    });

    // Keyboard navigation
    btn.addEventListener('keydown', e => {
      let nextIndex = null;
      
      if (e.key === 'ArrowRight' && index < schedule.length - 1) {
        nextIndex = index + 1;
      } else if (e.key === 'ArrowLeft' && index > 0) {
        nextIndex = index - 1;
      } else if (e.key === 'Home') {
        nextIndex = 0;
      } else if (e.key === 'End') {
        nextIndex = schedule.length - 1;
      }
      
      if (nextIndex !== null) {
        e.preventDefault();
        barButtons[nextIndex].focus();
      }
    });
  });
}

/**
 * Highlight specific bar
 * @param {number} index - Bar index to highlight
 */
function highlightBar(index) {
  // Update interest dataset (blue)
  const interestDataset = chart.data.datasets[0];
  interestDataset.backgroundColor = interestDataset.data.map((_, i) => 
    i === index ? '#2563eb' : '#3c6ae5'
  );
  
  // Update principal dataset (green)
  const principalDataset = chart.data.datasets[1];
  principalDataset.backgroundColor = principalDataset.data.map((_, i) => 
    i === index ? '#065f46' : '#047857'
  );
  
  chart.update('none');
}

/**
 * Show tooltip for specific bar
 * @param {number} index - Bar index
 */
function showTooltip(index) {
  const meta = chart.getDatasetMeta(0);
  chart.tooltip.setActiveElements([
    { datasetIndex: 0, index: index },
    { datasetIndex: 1, index: index }
  ], {
    x: meta.data[index].x,
    y: meta.data[index].y
  });
  chart.update('none');
}

/**
 * Announce bar data to screen readers
 * @param {Object} row - Schedule row data
 * @param {number} index - Row index
 */
function announceBar(row, index) {
  const region = $('#chart-announcement');
  region.textContent = `Year ${row.year}: Interest $${formatCurrency(row.interest)}, Principal $${formatCurrency(row.principal)}, Total $${formatCurrency(row.totalPayment)}`;
  setTimeout(() => region.textContent = '', 2000);
}

/**
 * Destroy chart and clean up
 */
export function destroyChart() {
  if (chart) {
    chart.destroy();
    chart = null;
  }
  barButtons.forEach(b => b.remove());
  barButtons = [];
  
  // Clean up legend
  const legend = document.querySelector('.chart-legend');
  if (legend) legend.remove();
  
  // Clean up educational note from visualization card
  const vizCard = document.querySelector('#visualization-card');
  if (vizCard) {
    const note = vizCard.querySelector('.educational-note');
    if (note) note.remove();
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