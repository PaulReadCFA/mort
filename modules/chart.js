/**
 * Chart.js - Stacked Bar Chart for Annual Principal/Interest
 * Includes roving tabindex, keyboard navigation, and tooltips
 */

import { $ } from './utils.js';

let chart = null;
let barButtons = [];
let currentIndex = 0;

/**
 * Render stacked bar chart showing principal and interest by MONTH (360 bars)
 * @param {Object} result - Calculation results with monthlySchedule
 * @param {Object} inputs - Input parameters for interest rate
 */
export function renderChart({ monthlySchedule }, inputs) {
  const container = $('#chart-container');
  const canvas = $('#chart');
  if (!canvas || !monthlySchedule || monthlySchedule.length === 0) return;

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
      Interest Payment (INT)
    </span>
    <span class="legend-item">
      <span class="legend-color" style="background-color: #047857;"></span>
      Principal Amortization (PRN)
    </span>
    <span class="legend-item">
      <span class="legend-color" style="background-color: #7a46ff; box-shadow: 0 0 0 2px white, 0 0 0 3px #7a46ff; border-radius: 2px;"></span>
      Interest Rate (<strong style="color: #7a46ff;">${annualRate}%</strong>)
    </span>
  `;

  // Destroy existing chart
  if (chart) chart.destroy();

  // Prepare data for stacked bar chart - MONTHLY (360 bars)
  const labels = monthlySchedule.map(row => {
    // Show year markers every 12 months, otherwise just month number
    if (row.monthInYear === 1) {
      return `Y${row.year}`;
    }
    return '';  // Empty label for other months to reduce clutter
  });
  
  const principalData = monthlySchedule.map(row => row.principal);
  const interestData = monthlySchedule.map(row => row.interest);

 
  
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
        // Interest rate line - White border (background)
        {
          label: '',  // Hidden from legend
          data: labels.map(() => annualRate),
          type: 'line',
          borderColor: 'rgba(255, 255, 255, 1)',  // Fully opaque white
          borderWidth: 7,  // Thicker for border effect
          pointRadius: 0,
          fill: false,
          yAxisID: 'y2',
          order: 1  // Draw first (behind purple)
        },
        // Interest rate line - Purple foreground
        {
          label: 'Interest Rate (r)',
          data: labels.map(() => annualRate),
          type: 'line',
          borderColor: '#7a46ff',
          borderWidth: 4,  // Visible purple line
          pointRadius: 0,
          fill: false,
          yAxisID: 'y2',
          order: 0  // Draw last (on top)
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
            text: 'Months (Year markers shown)'
          },
          grid: {
            display: false
          },
          ticks: {
            maxRotation: 0,
            minRotation: 0,
            autoSkip: true,
            maxTicksLimit: 30,  // Show ~30 year markers
            font: {
              size: 10
            }
          }
        },
        y: {
          stacked: true,
          beginAtZero: true,
          position: 'left',
          title: {
            display: false  // We draw this manually at top
          },
          ticks: {
            maxRotation: 0,
            minRotation: 0,
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
            display: false  // We draw this manually at top
          },
          ticks: {
            maxRotation: 0,
            minRotation: 0,
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
          filter: function(tooltipItem) {
            // Hide the white border line (empty label)
            return tooltipItem.dataset.label !== '';
          },
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
      },
      onClick: (e, elements) => {
        if (elements.length > 0) {
          const index = elements[0].index;
          if (barButtons[index]) {
            barButtons[index].focus();
          }
        }
      }
    },
    plugins: [
      {
        // Custom plugin to draw horizontal Y-axis titles at top (like bond chart)
        id: 'horizontalYTitles',
        afterDraw: (chart) => {
          const ctx = chart.ctx;
          const chartArea = chart.chartArea;
          
          ctx.save();
          
          // Left Y-axis title (Payment Amount)
          ctx.fillStyle = '#374151';
          ctx.font = 'bold 12px sans-serif';
          ctx.textAlign = 'left';
          ctx.textBaseline = 'top';
          ctx.fillText('Payment Amount ($)', chartArea.left, chartArea.top - 25);
          
          // Right Y-axis title (Rate %)
          ctx.fillStyle = '#7a46ff';
          ctx.textAlign = 'right';
          ctx.fillText('Rate (%)', chartArea.right, chartArea.top - 25);
          
          ctx.restore();
        }
      }
    ]
  });

  // Add keyboard-accessible button overlays after chart renders
  requestAnimationFrame(() => {
    requestAnimationFrame(() => {
      createBarButtons(monthlySchedule, container);
      
      // Add educational note if not already present
      const parentCard = container.closest('.card');
      if (parentCard && !parentCard.querySelector('.educational-note')) {
        const note = document.createElement('div');
        note.className = 'educational-note';
        note.innerHTML = '<strong>Mortgage Amortization:</strong> Early payments are mostly interest; principal portion increases over time as balance decreases. Chart shows monthly cash flows.';
        parentCard.appendChild(note);
      }
    });
  });
}

/**
 * Create accessible button overlays for each bar
 * @param {Array} monthlySchedule - Monthly schedule data (360 rows)
 * @param {HTMLElement} container - Chart container element
 */
function createBarButtons(monthlySchedule, container) {
  monthlySchedule.forEach((row, index) => {
    const meta = chart.getDatasetMeta(0);
    const bar = meta.data[index];
    if (!bar) return;

    const btn = document.createElement('button');
    btn.className = 'chart-bar-button';
    btn.tabIndex = index === 0 ? 0 : -1;
    btn.setAttribute('aria-label', 
      `Year ${row.year}, Month ${row.monthInYear}: Interest $${formatCurrency(row.interest)}, Principal $${formatCurrency(row.principal)}, Total $${formatCurrency(row.totalPayment)}`
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
      const scheduleLength = monthlySchedule.length;
      
      // Basic navigation
      if (e.key === 'ArrowRight' && index < scheduleLength - 1) {
        nextIndex = index + 1;
      } else if (e.key === 'ArrowLeft' && index > 0) {
        nextIndex = index - 1;
      } 
      // Jump to start/end
      else if (e.key === 'Home') {
        nextIndex = 0;
      } else if (e.key === 'End') {
        nextIndex = scheduleLength - 1;
      }
      // Year jumping - 12 months at a time
      else if (e.key === 'PageDown') {
        nextIndex = Math.min(index + 12, scheduleLength - 1);
      } else if (e.key === 'PageUp') {
        nextIndex = Math.max(index - 12, 0);
      }
      // Help - focus the table
      else if (e.key === 't' || e.key === 'T') {
        e.preventDefault();
        const table = document.getElementById('data-table');
        if (table) {
          table.focus();
          const announcement = document.getElementById('chart-announcement');
          if (announcement) {
            announcement.textContent = 'Focused on data table';
            setTimeout(() => announcement.textContent = '', 2000);
          }
        }
        return;
      }
      
      if (nextIndex !== null) {
        e.preventDefault();
        barButtons[nextIndex].focus();
      }
    });
  });
  
  // Add keyboard help message after first focus
  let helpShown = false;
  if (barButtons.length > 0) {
    barButtons[0].addEventListener('focus', () => {
      if (!helpShown) {
        helpShown = true;
        const announcement = document.getElementById('chart-announcement');
        if (announcement) {
          announcement.textContent = 'Use arrow keys to navigate months, Page Up/Down to jump by year, T for table, Home/End for first/last';
          setTimeout(() => announcement.textContent = '', 5000);
        }
      }
    }, { once: true });
  }
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
 * Throttled to avoid overwhelming users during rapid navigation
 * @param {Object} row - Schedule row data (monthly)
 * @param {number} index - Row index
 */
let announceTimeout = null;
function announceBar(row, index) {
  const region = $('#chart-announcement');
  
  // Clear any pending announcement
  if (announceTimeout) {
    clearTimeout(announceTimeout);
  }
  
  // Throttle announcements - only announce after user pauses
  announceTimeout = setTimeout(() => {
    // Announce monthly data: "Year X, Month Y: Interest $XXX, Principal $XXX, Total $XXX"
    region.textContent = `Year ${row.year}, Month ${row.monthInYear}: Interest $${formatCurrency(row.interest)}, Principal $${formatCurrency(row.principal)}, Total $${formatCurrency(row.totalPayment)}`;
    
    // Clear announcement after it's been read
    setTimeout(() => {
      region.textContent = '';
      announceTimeout = null;
    }, 2000);
  }, 150); // 150ms throttle - only announce if user pauses
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