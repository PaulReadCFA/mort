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
  
  // Make canvas keyboard focusable
  canvas.tabIndex = 0;
  canvas.setAttribute('role', 'application');
  canvas.setAttribute('aria-label', 'Mortgage amortization chart. Use arrow keys to navigate months, Page Up/Down to jump by year, T to focus table, Home/End for first/last month.');

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
      <span class="legend-color" style="background-color: #0079a6;"></span>
      Interest cash flows (<strong style="color: #0079a6;">INT</strong>)
    </span>
    <span class="legend-item">
      <span class="legend-color" style="background-color: #b82937;"></span>
      Principal amortization (<strong style="color: #b82937;">PRN</strong>)
    </span>
    <span class="legend-item">
      <span class="legend-color" style="background-color: #60a5fa; height: 3px; width: 20px;"></span>
      Total mortgage cash flows (<strong style="color: #3c6ae5;">PMT</strong>)
    </span>
    <span class="legend-item">
      <span class="legend-color" style="background: repeating-linear-gradient(90deg, #7a46ff 0px, #7a46ff 5px, transparent 5px, transparent 10px); height: 3px; width: 20px;"></span>
      Interest rate (<strong style="color: #7a46ff;">r</strong>) <strong style="color: #7a46ff;">${annualRate}%</strong>
    </span>
  `;

  // Destroy existing chart
  if (chart) chart.destroy();

  // Prepare data for stacked bar chart - MONTHLY (360 bars)
  const labels = monthlySchedule.map(row => {
    // Show year markers every 6 months for better readability
    if (row.monthInYear === 1) {
      return `Y${row.year}`;
    } else if (row.monthInYear === 7) {
      return `Y${row.year}.5`;
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
          label: 'Interest cash flows (INT)',
          data: interestData,
          backgroundColor: 'rgba(0, 121, 166, 0.3)',  /* Teal semi-transparent */
          borderWidth: 0,
          yAxisID: 'y',
          order: 2  // Draw first (behind)
        },
        {
          label: 'Principal amortization (PRN)',
          data: principalData,
          backgroundColor: '#b82937',  /* Red solid */
          borderWidth: 0,
          yAxisID: 'y',
          order: 1  // Draw second (on top of INT)
        },
        // Monthly payment (PMT) constant line - shows total payment stays constant
        {
          label: 'Total mortgage cash flows (PMT)',
          data: labels.map(() => monthlySchedule[0].totalPayment),
          type: 'line',
          borderColor: '#60a5fa',  // Light blue
          backgroundColor: 'rgba(96, 165, 250, 0.1)',
          borderWidth: 2,
          pointRadius: 0,
          fill: false,
          yAxisID: 'y',
          order: 0  // Draw on top
        },
        // Interest rate horizontal line
        {
          label: 'Interest rate (r)',
          data: labels.map(() => annualRate),
          type: 'line',
          borderColor: '#7a46ff',
          borderWidth: 3,
          borderDash: [5, 5],
          pointRadius: 0,
          fill: false,
          yAxisID: 'y2',
          order: 0  // Draw on top
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
          stacked: false,  // NOT stacked - overlay mode
          beginAtZero: true,
          position: 'left',
          title: {
            display: false  // We draw this manually at top
          },
          ticks: {
            maxRotation: 0,
            minRotation: 0,
            callback: function(value) {
              return value.toLocaleString();  // No $ - unit in title
            }
          }
        },
        y2: {
          position: 'right',
          min: 0,
          max: Math.max(12, annualRate * 1.5),
          title: {
            display: false
          },
          ticks: {
            maxRotation: 0,
            minRotation: 0,
            callback: function(value) {
              return value.toFixed(1);  // No % - unit in title
            },
            color: '#7a46ff'
          },
          grid: {
            display: false
          }
        }
      },
      layout: {
        padding: {
          top: 30,  // Space for Y-axis titles
          right: 10,
          bottom: 10,
          left: 20  // Reduced padding - label is positioned outside chartArea
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
              const index = context[0].dataIndex;
              if (monthlySchedule[index]) {
                return `Year ${monthlySchedule[index].year}, month ${monthlySchedule[index].monthInYear}`;
              }
              return context[0].label;
            },
            label: function(context) {
              const label = context.dataset.label || '';
              const value = context.parsed.y;
              
              // Interest rate should show % not $
              if (label.includes('Interest rate')) {
                return `${label}: ${value.toFixed(1)}%`;
              }
              
              // Everything else shows $
              return `${label}: $${value.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
            },
            afterBody: function(context) {
              // Don't show "Total (PMT)" - it's redundant with the PMT line dataset
              return '';
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
        // Custom plugin to draw horizontal Y-axis title at top
        id: 'horizontalYTitle',
        afterDraw: (chart) => {
          const ctx = chart.ctx;
          const chartArea = chart.chartArea;
          
          ctx.save();
          
          // Left Y-axis title (Cash flows) - positioned over the Y-axis
          ctx.fillStyle = '#374151';
          ctx.font = 'bold 12px sans-serif';
          ctx.textAlign = 'left';  // Left-align
          ctx.textBaseline = 'top';
          ctx.fillText('Cash flows ($)', chartArea.left - 40, chartArea.top - 25);
          
          // Right Y-axis title (Rate %)
          ctx.fillStyle = '#7a46ff';
          ctx.textAlign = 'right';
          ctx.fillText('Rate (%)', chartArea.right, chartArea.top - 25);
          
          ctx.restore();
        }
      },
      {
        // Custom plugin to draw data labels on horizontal lines
        id: 'lineLabels',
        afterDatasetsDraw: (chart) => {
          const ctx = chart.ctx;
          const chartArea = chart.chartArea;
          
          ctx.save();
          
          // Find the PMT line dataset (Total mortgage cash flows)
          const pmtDataset = chart.data.datasets.find(ds => ds.label === 'Total mortgage cash flows (PMT)');
          const pmtIndex = chart.data.datasets.indexOf(pmtDataset);
          
          if (pmtDataset && pmtIndex >= 0) {
            const pmtValue = pmtDataset.data[0];
            const meta = chart.getDatasetMeta(pmtIndex);
            
            if (meta.data.length > 0) {
              const yPosition = meta.data[0].y;
              
              // Draw PMT label
              ctx.fillStyle = '#3c6ae5';
              ctx.font = 'bold 11px sans-serif';
              ctx.textAlign = 'left';
              ctx.textBaseline = 'bottom';
              ctx.fillText(
                `PMT: $${pmtValue.toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`,
                chartArea.left + 10,
                yPosition - 5
              );
            }
          }
          
          // Find the rate line dataset
          const rateDataset = chart.data.datasets.find(ds => ds.label === 'Interest rate (r)');
          const rateIndex = chart.data.datasets.indexOf(rateDataset);
          
          if (rateDataset && rateIndex >= 0) {
            const rateValue = rateDataset.data[0];
            const meta = chart.getDatasetMeta(rateIndex);
            
            if (meta.data.length > 0) {
              const yPosition = meta.data[0].y;
              
              // Draw rate label in center of chart
              ctx.fillStyle = '#7a46ff';
              ctx.font = 'bold 11px sans-serif';
              ctx.textAlign = 'center';  // Center-aligned
              ctx.textBaseline = 'bottom';
              ctx.fillText(
                `r: ${rateValue.toFixed(1)}%`,
                (chartArea.left + chartArea.right) / 2,  // Centered horizontally
                yPosition - 5
              );
            }
          }
          
          ctx.restore();
        }
      }
    ]
  });

  // Setup keyboard navigation for canvas
  setupKeyboardNavigation(canvas, monthlySchedule);
}

/**
 * Setup keyboard navigation for canvas
 */
function setupKeyboardNavigation(canvas, monthlySchedule) {
  canvas.addEventListener('keydown', (e) => {
    const maxIndex = monthlySchedule.length - 1;
    let newIndex = currentIndex;
    
    switch(e.key) {
      case 'ArrowRight':
        e.preventDefault();
        newIndex = Math.min(currentIndex + 1, maxIndex);
        break;
      case 'ArrowLeft':
        e.preventDefault();
        newIndex = Math.max(currentIndex - 1, 0);
        break;
      case 'PageDown':
        e.preventDefault();
        newIndex = Math.min(currentIndex + 12, maxIndex);
        break;
      case 'PageUp':
        e.preventDefault();
        newIndex = Math.max(currentIndex - 12, 0);
        break;
      case 'Home':
        e.preventDefault();
        newIndex = 0;
        break;
      case 'End':
        e.preventDefault();
        newIndex = maxIndex;
        break;
      case 't':
      case 'T':
        e.preventDefault();
        const table = document.getElementById('data-table');
        if (table) {
          table.focus();
          announceBar(monthlySchedule[currentIndex], currentIndex, true);
        }
        return;
    }
    
    if (newIndex !== currentIndex) {
      currentIndex = newIndex;
      highlightBar(currentIndex);
      showTooltip(currentIndex);
      announceBar(monthlySchedule[currentIndex], currentIndex, false);
    }
  });
  
  // On focus, show tooltip for current bar
  canvas.addEventListener('focus', () => {
    highlightBar(currentIndex);
    showTooltip(currentIndex);
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
  // Update interest dataset (teal)
  const interestDataset = chart.data.datasets[0];
  interestDataset.backgroundColor = interestDataset.data.map((_, i) => 
    i === index ? 'rgba(0, 121, 166, 0.5)' : 'rgba(0, 121, 166, 0.3)'  // Teal - darker when highlighted
  );
  
  // Update principal dataset (red)
  const principalDataset = chart.data.datasets[1];
  principalDataset.backgroundColor = principalDataset.data.map((_, i) => 
    i === index ? '#a02028' : '#b82937'  // Red - darker when highlighted
  );
  
  chart.update('none');
}

/**
 * Show tooltip for specific bar
 * @param {number} index - Bar index
 */
function showTooltip(index) {
  const meta = chart.getDatasetMeta(0);
  
  // Skip if bar not rendered (can happen with 360 bars)
  if (!meta.data[index]) return;
  
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
 * @param {boolean} isTableFocus - If true, announce table focus instead
 */
let announceTimeout = null;
function announceBar(row, index, isTableFocus = false) {
  const region = $('#chart-announcement');
  
  if (isTableFocus) {
    region.textContent = 'Focused on data table';
    setTimeout(() => region.textContent = '', 2000);
    return;
  }
  
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