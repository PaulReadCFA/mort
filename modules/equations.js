/**
 * equations.js - Dynamic Equation Rendering for Mortgage Calculator
 * Renders three equations: PMT, INT_t, and PRN_t with actual values
 */

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

  const mathML = `
    <div style="display:flex;flex-direction:column;gap:0.75rem;align-items:center;">
      <math xmlns="http://www.w3.org/1998/Math/MathML" display="block" style="font-size:0.85em;">
        <mrow>
          <mi mathcolor="${COLORS.PMT}" mathvariant="bold">PMT</mi>
          <mo>=</mo>
          <mfrac linethickness="1.2px">
            <mrow>
              <mi mathcolor="${COLORS.r}" mathvariant="italic">r</mi>
              <mo>×</mo>
              <mi mathcolor="${COLORS.PV}">PV</mi>
            </mrow>
            <mrow>
              <mn>1</mn>
              <mo>-</mo>
              <msup>
                <mrow>
                  <mo>(</mo>
                  <mn>1</mn>
                  <mo>+</mo>
                  <mi mathcolor="${COLORS.r}" mathvariant="italic">r</mi>
                  <mo>)</mo>
                </mrow>
                <mrow>
                  <mo>-</mo>
                  <mi mathcolor="${COLORS.t}" mathvariant="italic">t</mi>
                </mrow>
              </msup>
            </mrow>
          </mfrac>
        </mrow>
      </math>
      <div class="equation-result-main pmt">
        = ${formatCurrency(monthlyPayment)}
      </div>
    </div>
  `;

  container.innerHTML = mathML;
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
  const monthlyRate = rate / 100 / 12;
  const int1 = (principal * monthlyRate).toFixed(2);

  const mathML = `
    <div style="display:flex;flex-direction:column;gap:0.75rem;align-items:center;">
      <div style="font-size:0.8rem;color:var(--color-gray-600);margin-bottom:0.25rem;">General formula (t ≥ 1):</div>
      <math xmlns="http://www.w3.org/1998/Math/MathML" display="block" style="font-size:0.85em;">
        <mrow>
          <msub>
            <mi mathcolor="${COLORS.INT}" mathvariant="bold">INT</mi>
            <mi mathcolor="${COLORS.INT}" mathvariant="italic">t</mi>
          </msub>
          <mo>=</mo>
          <mfrac>
            <mrow>
              <mo>(</mo>
              <mi mathcolor="${COLORS.PV}">PV</mi>
              <mo>-</mo>
              <munderover>
                <mo>∑</mo>
                <mrow><mi>i</mi><mo>=</mo><mn>1</mn></mrow>
                <mrow><mi mathcolor="${COLORS.INT}" mathvariant="italic">t</mi><mo>-</mo><mn>1</mn></mrow>
              </munderover>
              <msub>
                <mi mathcolor="${COLORS.PRN}">PRN</mi>
                <mi>i</mi>
              </msub>
              <mo>)</mo>
              <mo>×</mo>
              <mi mathcolor="${COLORS.r}" mathvariant="italic">r</mi>
            </mrow>
            <mn>12</mn>
          </mfrac>
        </mrow>
      </math>
      
      <div style="font-size:0.8rem;color:var(--color-gray-600);font-style:italic;margin-top:0.5rem;margin-bottom:0.25rem;">Example for Month 1 (varies each month):</div>
      <math xmlns="http://www.w3.org/1998/Math/MathML" display="block" style="font-size:0.85em;">
        <mrow>
          <msub>
            <mi mathcolor="${COLORS.INT}" mathvariant="bold">INT</mi>
            <mn mathcolor="${COLORS.INT}">1</mn>
          </msub>
          <mo>=</mo>
          <mfrac linethickness="1.2px">
            <mrow>
              <mi mathcolor="${COLORS.PV}">PV</mi>
              <mo>×</mo>
              <mi mathcolor="${COLORS.r}" mathvariant="italic">r</mi>
            </mrow>
            <mn>1</mn>
          </mfrac>
        </mrow>
      </math>
      <div class="equation-result-main int">
        = ${formatCurrency(int1)}
      </div>
    </div>
  `;

  container.innerHTML = mathML;
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
            <mi mathcolor="${COLORS.PRN}" mathvariant="italic">t</mi>
          </msub>
          <mo>=</mo>
          <mi mathcolor="${COLORS.PMT}">PMT</mi>
          <mo>-</mo>
          <msub>
            <mi mathcolor="${COLORS.INT}">INT</mi>
            <mi mathcolor="${COLORS.INT}" mathvariant="italic">t</mi>
          </msub>
        </mrow>
      </math>
      <div class="equation-result-main prn">
        = ${formatCurrency(prn1)}
      </div>
      <div style="font-size:0.8125rem;color:var(--color-gray-600);font-style:italic;text-align:center;margin-top:0.5rem;">
        For Month 1 (increases each month)
      </div>
    </div>
  `;

  container.innerHTML = mathML;
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

/**
 * Format as currency
 */
function formatCurrency(value) {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  }).format(value);
}