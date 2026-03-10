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
  subscribe(updateAll);
  detectNarrowScreen();
  window.addEventListener('resize', debounce(detectNarrowScreen, 200));
  
  // Initial calculation
  updateAll(state);
}

/* ---------- SKIP LINK HANDLER ---------- */
function setupSkipLink() {
  // Handle skip to data entry (first input field)
  const skipToEntry = document.querySelector('.skip-link[href="#principal"]');
  if (skipToEntry) {
    skipToEntry.addEventListener('click', (e) => {
      e.preventDefault();
      const principalInput = $('#principal');
      if (principalInput) {
        principalInput.focus();
        principalInput.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
    });
  }
  
  // Handle skip to data table
  const skipToTable = document.querySelector('.skip-link[href="#data-table"]');
  if (skipToTable) {
    skipToTable.addEventListener('click', (e) => {
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

/* ---------- INPUT HANDLERS ---------- */
let lastValidValue = { principal: 800000, rate: 6, years: 30 };

function setupInputs() {
  ['principal', 'rate', 'years'].forEach(id => {
    const element = $(`#${id}`);
    if (!element) return;

    const updateValue = debounce(() => {
      const rawValue = id === 'principal'
        ? element.value.replace(/,/g, '').trim()
        : element.value.trim();
      if (rawValue === '') return;
      const value = Number(rawValue);
      if (!isNaN(value) && value > 0) {
        const newInputs = { ...state.inputs, [id]: value };
        setState({ inputs: newInputs });
        lastValidValue[id] = value;
      }
    }, 300);

    listen(element, 'input', updateValue);
    listen(element, 'change', updateValue);
    setupFieldValidation(id, updateValue);

    // Principal: comma formatting on blur/focus, numeric-only keydown + paste
    if (id === 'principal') {
      listen(element, 'blur', () => {
        setTimeout(() => {
          const raw = element.value.replace(/,/g, '').trim();
          if (raw === '') { element.value = lastValidValue[id].toLocaleString('en-US'); return; }
          const num = Number(raw);
          if (!isNaN(num) && num > 0) element.value = num.toLocaleString('en-US');
        }, 10);
      });

      listen(element, 'focus', () => {
        element.value = element.value.replace(/,/g, '');
      });

      listen(element, 'keydown', (e) => {
        const actionKeys = ['Backspace','Delete','Tab','Escape','Enter','ArrowLeft','ArrowRight','Home','End'];
        if (actionKeys.includes(e.key)) return;
        if ((e.ctrlKey || e.metaKey) && ['a','c','v','x','z'].includes(e.key.toLowerCase())) return;
        if (!/^\d$/.test(e.key)) e.preventDefault();
      });

      listen(element, 'paste', (e) => {
        e.preventDefault();
        const text = (e.clipboardData || window.clipboardData).getData('text');
        const digits = text.replace(/[^\d]/g, '');
        if (digits) {
          const start = element.selectionStart;
          const end = element.selectionEnd;
          element.value = element.value.slice(0, start) + digits + element.value.slice(end);
          element.selectionStart = element.selectionEnd = start + digits.length;
          element.dispatchEvent(new Event('input', { bubbles: true }));
        }
      });
    }

    if (id === 'rate' || id === 'years') {
      listen(element, 'keydown', (e) => {
        const actionKeys = ['Backspace','Delete','Tab','Escape','Enter','ArrowLeft','ArrowRight','ArrowUp','ArrowDown','Home','End'];
        if (actionKeys.includes(e.key)) return;
        if ((e.ctrlKey || e.metaKey) && ['a','c','v','x','z'].includes(e.key.toLowerCase())) return;
        if (id === 'rate' && e.key === '.' && !element.value.includes('.')) return;
        if (id === 'years' && e.key === '.') { e.preventDefault(); return; }
        if (!/^\d$/.test(e.key)) e.preventDefault();
      });

      listen(element, 'paste', (e) => {
        e.preventDefault();
        const text = (e.clipboardData || window.clipboardData).getData('text');
        const allowed = id === 'rate'
          ? text.replace(/[^\d.]/g, '').replace(/(\..*)\./g, '$1')
          : text.replace(/[^\d]/g, '');
        if (allowed) {
          const start = element.selectionStart;
          const end = element.selectionEnd;
          element.value = element.value.slice(0, start) + allowed + element.value.slice(end);
          element.selectionStart = element.selectionEnd = start + allowed.length;
          element.dispatchEvent(new Event('input', { bubbles: true }));
        }
      });
    }
  });
}

/* ---------- VIEW TOGGLE WITH ARROW KEYS ---------- */
function setupViewToggle() {
  const chartBtn = $('#view-chart-btn');
  const tableBtn = $('#view-table-btn');

  updateButtonStates();

  // Chart button - use addEventListener directly with capture phase
  if (chartBtn) {
    chartBtn.addEventListener('click', (e) => {
      // FIRST: Check if narrow screen before anything else
      const isForced = document.body.classList.contains('force-table');
      
      if (isForced || chartBtn.disabled) {
        e.preventDefault();
        e.stopPropagation();
        e.stopImmediatePropagation();
        
        // Visual feedback: briefly highlight table button
        if (tableBtn) {
          tableBtn.style.transition = 'transform 0.2s ease';
          tableBtn.style.transform = 'scale(1.05)';
          setTimeout(() => {
            tableBtn.style.transform = 'scale(1)';
          }, 200);
        }
        
        // Force table view
        setState({ view: 'table' });
        updateButtonStates();
        
        return false;
      }
      
      // Normal behavior - allow chart view
      setState({ view: 'chart' });
      updateButtonStates();
    }, true); // Use capture phase
  }

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
  const narrow = window.innerWidth <= 600;
  
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