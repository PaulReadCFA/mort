/**
 * calculator.js -- Main Entry Point
 * Mortgage Calculator with Monthly Chart and Annual Table
 * Follows accessibility best practices and modular architecture
 */

import { state, setState, subscribe } from './modules/state.js';
import { calculate } from './modules/calculations.js';
import { renderResults } from './modules/results.js';
import { renderChart, destroyChart } from './modules/chart.js';
import { renderTable } from './modules/table.js';
import { renderEquations } from './modules/equations.js';
import { $, listen, debounce } from './modules/utils.js';
import { validateAll, setupFieldValidation } from './modules/validation.js';

/* ---------- INITIALIZATION ---------- */
function init() {
  setupInputs();
  setupViewToggle();
  setupSkipLink();
  setupResultsToggle();
  subscribe(updateAll);
  detectNarrowScreen();
  window.addEventListener('resize', debounce(detectNarrowScreen, 200));
  
  // Initial calculation
  updateAll(state);
}

/* ---------- SKIP LINK HANDLER ---------- */
function setupSkipLink() {
  const skipLink = document.querySelector('.skip-link[href="#data-table"]');
  if (skipLink) {
    skipLink.addEventListener('click', (e) => {
      e.preventDefault();
      // Switch to table view
      setState({ view: 'table' });
      updateButtonStates();
      // Focus the table after a short delay to ensure it's visible
      setTimeout(() => {
        const table = $('#data-table');
        if (table) {
          table.focus();
          table.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
      }, 100);
    });
  }
}

/* ---------- RESULTS TOGGLE ---------- */
function setupResultsToggle() {
  const toggleBtn = $('#toggle-results-btn');
  const content = $('#results-content');
  
  if (!toggleBtn || !content) return;
  
  listen(toggleBtn, 'click', () => {
    const expanded = toggleBtn.getAttribute('aria-expanded') === 'true';
    
    if (expanded) {
      // Collapse
      toggleBtn.setAttribute('aria-expanded', 'false');
      toggleBtn.setAttribute('aria-label', 'Expand interest data section');
      content.style.display = 'none';
    } else {
      // Expand
      toggleBtn.setAttribute('aria-expanded', 'true');
      toggleBtn.setAttribute('aria-label', 'Collapse interest data section');
      content.style.display = 'block';
    }
  });
}

/* ---------- INPUT HANDLERS ---------- */
let lastAnnounced = { principal: 800000, rate: 6, years: 30 };

const announceChange = debounce((field, value) => {
  const labels = {
    principal: 'Loan Amount',
    rate: 'Interest Rate',
    years: 'Loan Term'
  };
  
  const formattedValue = field === 'principal' 
    ? `$${value.toLocaleString()}`
    : field === 'rate'
    ? `${value}%`
    : `${value} years`;
  
  $('#result-announcement').textContent = `${labels[field]} changed to ${formattedValue}`;
  setTimeout(() => $('#result-announcement').textContent = '', 1500);
}, 500);

function setupInputs() {
  ['principal', 'rate', 'years'].forEach(id => {
    const element = $(`#${id}`);
    if (!element) return;

    const updateValue = debounce(() => {
      const value = Number(element.value);
      
      // Validate and update state
      if (!isNaN(value) && value > 0) {
        const newInputs = { ...state.inputs, [id]: value };
        setState({ inputs: newInputs });
        
        // Announce significant changes
        if (Math.abs(value - lastAnnounced[id]) > 0.01) {
          announceChange(id, value);
          lastAnnounced[id] = value;
        }
      }
    }, 300);

    listen(element, 'input', updateValue);
    listen(element, 'change', updateValue);
    
    // Setup validation
    setupFieldValidation(id, updateValue);
  });
}

/* ---------- VIEW TOGGLE WITH ARROW KEYS ---------- */
function setupViewToggle() {
  const chartBtn = $('#view-chart-btn');
  const tableBtn = $('#view-table-btn');

  updateButtonStates();

  listen(chartBtn, 'click', () => {
    setState({ view: 'chart' });
    updateButtonStates();
  });

  listen(tableBtn, 'click', () => {
    setState({ view: 'table' });
    updateButtonStates();
  });

  // Keyboard navigation between toggle buttons
  [chartBtn, tableBtn].forEach(btn => {
    btn.tabIndex = 0;
    
    btn.addEventListener('keydown', e => {
      if (e.key === 'ArrowRight' || e.key === 'ArrowLeft') {
        e.preventDefault();
        const next = btn === chartBtn ? tableBtn : chartBtn;
        next.focus();
        setState({ view: next.id === 'view-chart-btn' ? 'chart' : 'table' });
        updateButtonStates();
      }
    });
  });

  // Set initial focus based on view
  (state.view === 'chart' ? chartBtn : tableBtn).focus();
}

/* ---------- BUTTON STATE MANAGEMENT ---------- */
function updateButtonStates() {
  const chartBtn = $('#view-chart-btn');
  const tableBtn = $('#view-table-btn');
  const isTable = state.view === 'table' || document.body.classList.contains('force-table');

  chartBtn.classList.toggle('active', !isTable);
  tableBtn.classList.toggle('active', isTable);
  
  chartBtn.setAttribute('aria-pressed', !isTable);
  tableBtn.setAttribute('aria-pressed', isTable);
  
  // Disable chart button on narrow screens
  chartBtn.disabled = document.body.classList.contains('force-table');
}

/* ---------- RESPONSIVE BEHAVIOR ---------- */
function detectNarrowScreen() {
  const narrow = window.innerWidth <= 768;
  
  if (narrow) {
    document.body.classList.add('force-table');
    if (state.view !== 'table') {
      setState({ view: 'table' });
    }
  } else {
    document.body.classList.remove('force-table');
  }
  
  updateButtonStates();
}

/* ---------- UPDATE ALL VIEWS ---------- */
function updateAll(currentState) {
  // Validate inputs
  if (!validateAll(currentState.inputs)) {
    // If validation fails, show empty/zero results
    renderResults({
      monthlyPayment: 0,
      annualPayment: 0,
      totalInterest: 0,
      totalPaid: 0
    }, currentState.inputs);
    renderTable({ annualSchedule: [] });
    return;
  }

  // Calculate mortgage
  const result = calculate(currentState.inputs);
  
  // Update results
  renderResults(result, currentState.inputs);
  renderTable(result);
  
  // Update dynamic equations
  renderEquations(result, currentState.inputs);

  // Update visualization based on view
  const isTableView = currentState.view === 'table' || 
                      document.body.classList.contains('force-table');

  if (isTableView) {
    $('#chart-container').style.display = 'none';
    $('#table-container').style.display = 'block';
    destroyChart();
  } else {
    $('#chart-container').style.display = 'block';
    $('#table-container').style.display = 'none';
    renderChart(result, currentState.inputs);
  }
}

/* ---------- START APPLICATION ---------- */
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  init();
}