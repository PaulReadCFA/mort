/**
 * equations.js - Dynamic Equation Rendering for Mortgage Calculator
 * Renders three equations: PMT, INT_t, and PRN_t with actual values
 */

import { formatCurrencyUSD } from './utils.js';
const COLORS = {
  PMT: '#3c6ae5',      // Blue - Monthly payment
  INT: '#0079a6',      // Teal - Interest payment
  PRN: '#b82937',      // Red - Principal payment
  PV: '#b95b1d',       // Orange - Principal amount
  r: '#7a46ff',        // Purple - Interest rate
  t: '#047857'         // Green - Term
};

/**
 * Render all three mortgage equations with current values
 * @param {Object} result - Calculation results
 * @param {Object} inputs - Input parameters
 */
export function renderEquations(result, inputs) {
  renderPMTEquation(result, inputs);
  renderINTEquation(result, inputs);
  renderPRNEquation(result, inputs);
  
  // Trigger MathJax to re-process the updated equations
  if (typeof MathJax !== 'undefined' && MathJax.Hub) {
    MathJax.Hub.Queue(["Typeset", MathJax.Hub], function() {
      // Remove tabindex from MathJax elements for accessibility
      setTimeout(function() {
        document.querySelectorAll('.MathJax[tabindex]').forEach(function(el) {
          el.removeAttribute('tabindex');
        });
      }, 10);
      setTimeout(function() {
        document.querySelectorAll('.MathJax[tabindex]').forEach(function(el) {
          el.removeAttribute('tabindex');
        });
      }, 100);
      setTimeout(function() {
        document.querySelectorAll('.MathJax[tabindex]').forEach(function(el) {
          el.removeAttribute('tabindex');
        });
      }, 500);
    });
  }
}

/**
 * Monthly Payment (PMT) - Constant over life of mortgage
 */
function renderPMTEquation(result, inputs) {
  const container = document.getElementById('pmt-equation');
  if (!container) return;

  const { monthlyPayment } = result;
  const { principal, rate, years } = inputs;
  
  const monthlyRate = rate / 100 / 12;
  const totalMonths = years * 12;
  const monthlyRateDisplay = parseFloat(monthlyRate.toFixed(6)).toString();

  const mathML = `
    <div style="display:flex;flex-direction:column;gap:0.75rem;align-items:center;">
      <math xmlns="http://www.w3.org/1998/Math/MathML" display="block" style="font-size:0.85em;">
        <mrow>
          <mi mathcolor="${COLORS.PMT}" mathvariant="bold">PMT</mi>
          <mo>=</mo>
          <mfrac linethickness="1.2px">
            <mrow>
              <mn mathcolor="${COLORS.r}">${monthlyRateDisplay}</mn>
              <mo>\u00D7</mo>
              <mn mathcolor="${COLORS.PV}">${formatNumber(principal)}</mn>
            </mrow>
            <mrow>
              <mn>1</mn>
              <mo>\u2212</mo>
              <msup>
                <mrow>
                  <mo>(</mo>
                  <mn>1</mn>
                  <mo>+</mo>
                  <mn mathcolor="${COLORS.r}">${monthlyRateDisplay}</mn>
                  <mo>)</mo>
                </mrow>
                <mrow>
                  <mo>\u2212</mo>
                  <mn mathcolor="${COLORS.t}">${totalMonths}</mn>
                </mrow>
              </msup>
            </mrow>
          </mfrac>
        </mrow>
      </math>
      <div class="equation-result-main pmt" role="status" aria-live="polite">
        = ${formatCurrencyUSD(monthlyPayment)}
      </div>
    </div>
  `;

  container.innerHTML = mathML;

  // Update article aria-label to include current result so SR users hear it on focus
  const article = container.closest('article');
  if (article) {
    article.setAttribute('aria-label',
      `Monthly payment formula. PMT equals monthly rate times loan amount, divided by 1 minus 1 plus monthly rate to the power of negative total months. Result: ${formatCurrencyUSD(monthlyPayment)}`
    );
  }
}

/**
 * Interest Payment (INT_t) - Varies by month
 */
function renderINTEquation(result, inputs) {
  const container = document.getElementById('int-equation');
  if (!container) return;

  const { monthlySchedule } = result;
  const { principal, rate } = inputs;
  
  if (!monthlySchedule || monthlySchedule.length === 0) return;
  
  // Show formula for Month 1 as example
  const rateAsDecimal = parseFloat((rate / 100).toFixed(4)).toString();
  const int1 = (principal * rate / 100 / 12).toFixed(2);

  const mathML = `
    <div style="display:flex;flex-direction:column;gap:0.75rem;align-items:center;">
      <math xmlns="http://www.w3.org/1998/Math/MathML" display="block" style="font-size:0.85em;">
        <mrow>
          <msub>
            <mi mathcolor="${COLORS.INT}" mathvariant="bold">INT</mi>
            <mn mathcolor="${COLORS.INT}">1</mn>
          </msub>
          <mo>=</mo>
          <mfrac linethickness="1.2px">
            <mrow>
              <mn mathcolor="${COLORS.PV}">${formatNumber(principal)}</mn>
              <mo>\u00D7</mo>
              <mn mathcolor="${COLORS.r}">${rateAsDecimal}</mn>
            </mrow>
            <mn>12</mn>
          </mfrac>
        </mrow>
      </math>
      <div class="equation-result-main int" role="status" aria-live="polite">
        = ${formatCurrencyUSD(int1)}
      </div>
      <div style="font-size:0.8125rem;color:var(--color-gray-600);font-style:italic;text-align:center;margin-top:0.5rem;" aria-hidden="true">
        For Month 1 (decreases each month)
      </div>
    </div>
  `;

  container.innerHTML = mathML;

  const article = container.closest('article');
  if (article) {
    article.setAttribute('aria-label',
      `Interest payment formula for month 1. INT equals loan amount times annual rate, divided by 12. Result for Month 1: ${formatCurrencyUSD(int1)}`
    );
  }
}

/**
 * Principal Payment (PRN_t) - Varies by month
 */
function renderPRNEquation(result, inputs) {
  const container = document.getElementById('prn-equation');
  if (!container) return;

  const { monthlyPayment, monthlySchedule } = result;
  const { principal, rate } = inputs;
  
  if (!monthlySchedule || monthlySchedule.length === 0) return;
  
  // Calculate PRN for Month 1
  const monthlyRate = rate / 100 / 12;
  const int1 = principal * monthlyRate;
  const prn1 = monthlyPayment - int1;

  const mathML = `
    <div style="display:flex;flex-direction:column;gap:0.75rem;align-items:center;">
      <math xmlns="http://www.w3.org/1998/Math/MathML" display="block" style="font-size:0.85em;">
        <mrow>
          <msub>
            <mi mathcolor="${COLORS.PRN}" mathvariant="bold">PRN</mi>
            <mn mathcolor="${COLORS.PRN}">1</mn>
          </msub>
          <mo>=</mo>
          <mn mathcolor="${COLORS.PMT}">${formatCurrencyUSD(monthlyPayment).replace('USD ', '')}</mn>
          <mo>\u2212</mo>
          <mn mathcolor="${COLORS.INT}">${formatCurrencyUSD(int1).replace('USD ', '')}</mn>
        </mrow>
      </math>
      <div class="equation-result-main prn" role="status" aria-live="polite">
        = ${formatCurrencyUSD(prn1)}
      </div>
      <div style="font-size:0.8125rem;color:var(--color-gray-600);font-style:italic;text-align:center;margin-top:0.5rem;" aria-hidden="true">
        For Month 1 (increases each month)
      </div>
    </div>
  `;

  container.innerHTML = mathML;

  const article = container.closest('article');
  if (article) {
    article.setAttribute('aria-label',
      `Principal payment formula for month 1. PRN equals monthly payment minus interest payment. Result for Month 1: ${formatCurrencyUSD(prn1)}`
    );
  }
}

/**
 * Format number with commas
 */
function formatNumber(value) {
  return value.toLocaleString('en-US', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  });
}