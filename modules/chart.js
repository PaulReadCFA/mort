/**
 * Chart.js - Stacked Bar Chart for Annual Principal/Interest
 * Includes roving tabindex, keyboard navigation, and tooltips
 */

import { $, formatCurrency } from './utils.js';
import { getChartTypography, scaledChartPx } from '../chart-typography.js';

/** Curriculum chart label convention: 13px / 600 / Lato at the 18px design root. */
const CHART_FONT = { family: '', size: 13, weight: '600' };
let CHART_FONT_CSS = '';

/** Variables are italicised by the Unicode math-italic glyph, not by font-style. */
const ITALIC_r = '\u{1D45F}'; // 𝑟

/** In pill labels only the variable carries colour; the operator and value stay neutral. */
const LABEL_TEXT_COLOR = '#374151';

/** Shared pill geometry so every label box has the same breathing space. */
let LABEL_PAD_X = 8;
let LABEL_PAD_Y = 5;
let LABEL_BOX_HEIGHT = 23;

function syncChartTypography() {
  const t = getChartTypography('curriculum');
  CHART_FONT.family = t.font.family;
  CHART_FONT.size = t.font.size;
  CHART_FONT.weight = t.font.weight;
  CHART_FONT_CSS = t.fontCss;
  LABEL_PAD_X = t.pill.padX;
  LABEL_PAD_Y = t.pill.padY;
  LABEL_BOX_HEIGHT = t.pill.boxHeight;
}


let chart = null;
let barButtons = [];
let currentIndex = 0;

/**
 * Render stacked bar chart showing principal and interest by MONTH (360 bars)
 * @param {Object} result - Calculation results with monthlySchedule
 * @param {Object} inputs - Input parameters for interest rate
 */
export function renderChart({ monthlySchedule }, inputs) {
  syncChartTypography();
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
  canvas.setAttribute('aria-label', 'Mortgage payment chart. Use arrow keys to navigate across time periods.');

 // Get interest rate from inputs
  const annualRate = inputs?.rate || 6;

  const legend = $('#chart-legend');
  if (legend) legend.innerHTML = `
    <span class="legend-item">
      <span class="legend-color" style="background-color: #0079a6;"></span>
      Interest cash flows <span class="legend-var-wrap"><span class="legend-paren">(</span><span class="legend-var" style="color: #0079a6; font-weight: 700;">INT</span><span class="legend-paren">)</span></span>
    </span>
    <span class="legend-item">
      <span class="legend-color" style="background-color: #b82937;"></span>
      Principal amortization <span class="legend-var-wrap"><span class="legend-paren">(</span><span class="legend-var" style="color: #b82937; font-weight: 700;">PRN</span><span class="legend-paren">)</span></span>
    </span>
    <span class="legend-item">
      <span class="legend-color" style="background-color: #60a5fa; height: 3px; width: 20px;"></span>
      Total mortgage cash flows <span class="legend-var-wrap"><span class="legend-paren">(</span><span class="legend-var" style="color: #3c6ae5; font-weight: 700;">PMT</span><span class="legend-paren">)</span></span>
    </span>
    <span class="legend-item">
      <span class="legend-color" style="background: repeating-linear-gradient(90deg, #7a46ff 0px, #7a46ff 5px, transparent 5px, transparent 10px); height: 3px; width: 20px;"></span>
      Annual interest rate <span class="legend-var-wrap"><span class="legend-paren">(</span><span class="legend-var" style="color: #7a46ff; font-weight: 700;">𝑟</span><span class="legend-paren">)</span></span> <strong style="color: #7a46ff;">${annualRate}%</strong>
    </span>
  `;

  // Destroy existing chart
  if (chart) chart.destroy();

  // Prepare data for stacked bar chart - MONTHLY (360 bars)
  // Create smart x-axis labels
  const labels = monthlySchedule.map((row, idx) => {
    // Determine optimal label frequency based on total years
    const years = monthlySchedule.length / 12;
    let showEveryNYears = 1;
    
    if (years > 15) {
      showEveryNYears = 2; // Show every 2 years for 16-30 years
    } else if (years > 30) {
      showEveryNYears = 3; // Show every 3 years for 31+ years
    }
    
    // Only show labels at year boundaries (month 1), and only at the intervals we want
    if (row.monthInYear === 1 && row.year % showEveryNYears === 0) {
      return `Y${row.year}`;
    }
    return '';  // Empty label for other months
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
          backgroundColor: 'rgba(0, 121, 166, 0.7)',  /* Teal - more opaque since it's behind */
          borderWidth: 0,
          yAxisID: 'y',
          order: 2  // Draw first (behind)
        },
        {
          label: 'Principal amortization (PRN)',
          data: principalData,
          backgroundColor: 'rgba(184, 41, 55, 0.6)',  /* Red - transparent to show teal through */
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
        // Annual interest rate horizontal line
        {
          label: 'Annual interest rate (r)',
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
      animation: {
        duration: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 0 : 400
      },
      interaction: {
        mode: 'index',
        intersect: false
      },
      scales: {
        x: {
          stacked: true,
          title: {
            display: true,
            text: 'Mortgage term: months (year markers shown)',
            font: {
              size: CHART_FONT.size,
              weight: '600',
              family: CHART_FONT.family
            },
            color: '#1f2937'  // Match left y-axis
          },
          grid: {
            display: false
          },
          ticks: {
            maxRotation: 0,
            minRotation: 0,
            autoSkip: false,  // Don't auto-skip, we control labels manually
            font: {
              size: CHART_FONT.size,
              weight: '600',
              family: CHART_FONT.family
            },
            color: '#1f2937'  // Match left y-axis
          }
        },
        y: {
          stacked: false,  // Overlay mode - bars overlap
          beginAtZero: true,
          position: 'left',
          title: {
            display: true,
            text: 'Cash flows (USD)',
            font: {
              size: CHART_FONT.size,
              weight: '600',
              family: CHART_FONT.family
            },
            color: '#1f2937'  // Darker grey
          },
          ticks: {
            callback: function(value) {
              return value.toLocaleString();
            },
            font: {
              size: CHART_FONT.size,
              weight: '600',
              family: CHART_FONT.family
            },
            color: '#1f2937'  // Darker grey
          }
        },
        y2: {
          position: 'right',
          min: 0,
          max: Math.max(12, annualRate * 1.5),
          title: {
            display: true,
            text: 'Annual interest rate (r) %',
            font: {
              size: CHART_FONT.size,
              weight: '600',
              family: CHART_FONT.family
            },
            color: '#7a46ff'  // Purple to match axis
          },
          ticks: {
            callback: function(value) {
              return value.toFixed(1);
            },
            font: {
              size: CHART_FONT.size,
              weight: '600',
              family: CHART_FONT.family
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
          top: 25,
          right: 10,
          bottom: 10,
          left: 10
        }
      },
      plugins: {
        legend: {
          display: false,
          text: `Amortization Schedule: ${formatCurrency(inputs.principal)} loan, ${inputs.years} years, ${inputs.rate}% annual`,
          font: { size: scaledChartPx(16), weight: 'bold' },
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
                return `Year ${monthlySchedule[index].year}, Month ${monthlySchedule[index].monthInYear}`;
              }
              return context[0].label;
            },
            label: function(context) {
              const label = context.dataset.label || '';
              const value = context.parsed.y;
              
              // Annual interest rate should show % not USD and italicize r
              if (label.includes('Annual interest rate')) {
                return `Annual interest rate (r): ${value.toFixed(1)}%`;
              }
              
              // Everything else shows USD
              return `${label}: USD ${value.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
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
      }
    },
    plugins: [
      {
        // Custom plugin to draw data labels on horizontal lines with white background for r
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
              ctx.font = CHART_FONT_CSS;
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
          const rateDataset = chart.data.datasets.find(ds => ds.label === 'Annual interest rate (r)');
          const rateIndex = chart.data.datasets.indexOf(rateDataset);
          
          if (rateDataset && rateIndex >= 0) {
            const rateValue = rateDataset.data[0];
            const meta = chart.getDatasetMeta(rateIndex);
            
            if (meta.data.length > 0) {
              const yPosition = meta.data[0].y;
              
              // Prepare text
              const rText = ITALIC_r;
              const valueText = ` = ${rateValue.toFixed(1)}%`;
              
              ctx.font = CHART_FONT_CSS;
              const rWidth = ctx.measureText(rText).width;
              const valueWidth = ctx.measureText(valueText).width;
              const totalWidth = rWidth + valueWidth;
              
              // Pill sits just above the rate line
              const xCenter = (chartArea.left + chartArea.right) / 2;
              const boxX = xCenter - totalWidth / 2 - LABEL_PAD_X;
              const boxY = yPosition - 2 - LABEL_BOX_HEIGHT;
              const boxWidth = totalWidth + LABEL_PAD_X * 2;
              
              ctx.fillStyle = 'white';
              ctx.fillRect(boxX, boxY, boxWidth, LABEL_BOX_HEIGHT);
              
              // Draw purple border around background
              ctx.strokeStyle = '#7a46ff';
              ctx.lineWidth = 2;
              ctx.strokeRect(boxX, boxY, boxWidth, LABEL_BOX_HEIGHT);
              
              // Draw italic r in the rate purple
              const textY = boxY + LABEL_BOX_HEIGHT / 2;
              ctx.fillStyle = '#7a46ff';
              ctx.textAlign = 'left';
              ctx.textBaseline = 'middle';
              ctx.fillText(rText, xCenter - totalWidth / 2, textY);
              
              // Draw neutral " = value"
              ctx.fillStyle = LABEL_TEXT_COLOR;
              ctx.fillText(valueText, xCenter - totalWidth / 2 + rWidth, textY);
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
      `Year ${row.year}, Month ${row.monthInYear}: Interest USD ${formatCurrency(row.interest)}, Principal USD ${formatCurrency(row.principal)}, Total USD ${formatCurrency(row.totalPayment)}`
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
          announcement.textContent = 'Use arrow keys to navigate across time periods';
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
    i === index ? 'rgba(0, 121, 166, 0.9)' : 'rgba(0, 121, 166, 0.7)'  // Teal - more opaque when highlighted
  );
  
  // Update principal dataset (red)
  const principalDataset = chart.data.datasets[1];
  principalDataset.backgroundColor = principalDataset.data.map((_, i) => 
    i === index ? 'rgba(184, 41, 55, 0.8)' : 'rgba(184, 41, 55, 0.6)'  // Red - more opaque when highlighted but still transparent
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
  
  // Skip announcement if switching to table - screen reader handles it
  if (isTableFocus) {
    return;
  }
  
  // Clear any pending announcement
  if (announceTimeout) {
    clearTimeout(announceTimeout);
  }
  
  // Throttle announcements - only announce after user pauses
  announceTimeout = setTimeout(() => {
    // Announce monthly data: "Year X, Month Y: Interest $XXX, Principal $XXX, Total $XXX"
    region.textContent = `Year ${row.year}, Month ${row.monthInYear}: Interest USD ${formatCurrency(row.interest)}, Principal USD ${formatCurrency(row.principal)}, Total USD ${formatCurrency(row.totalPayment)}`;
    
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
  
  const legend = $('#chart-legend');
  if (legend) legend.innerHTML = '';
  
  // Clean up educational note from visualization card
  const vizCard = document.querySelector('#visualization-card');
  if (vizCard) {
    const note = vizCard.querySelector('.educational-note');
    if (note) note.remove();
  }
}