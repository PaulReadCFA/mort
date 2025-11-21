/**
 * Dynamic Equation Module for Mortgage Calculator
 * Renders equation with actual calculated values
 */

import { formatCurrency } from './utils.js';

/**
 * Render dynamic equation with user's values
 * @param {Object} result - Calculation results
 * @param {Object} inputs - Input parameters
 */
export function renderDynamicEquation(result, inputs) {
  const container = document.getElementById('dynamic-mathml-equation');
  
  if (!container) {
    console.error('Dynamic equation container not found');
    return;
  }
  
  const { monthlyPayment } = result;
  const { principal, rate, years } = inputs;
  
  // Calculate monthly rate and total months
  const monthlyRate = rate / 100 / 12;
  const totalMonths = years * 12;
  
  // Format values for display
  const pmtFormatted = formatCurrency(monthlyPayment);
  const pvFormatted = formatCurrency(principal);
  const rPercent = (monthlyRate * 100).toFixed(4);
  
  // Build MathML equation with actual values - SIMPLIFIED to avoid rendering issues
  const mathML = `
    <math xmlns="http://www.w3.org/1998/Math/MathML" display="block">
      <mrow>
        <mtext mathcolor="#3c6ae5" mathvariant="bold">${pmtFormatted}</mtext>
        <mo>=</mo>
        <mfrac>
          <mrow>
            <mtext mathcolor="#7a46ff">${rPercent}%</mtext>
            <mo>×</mo>
            <mtext mathcolor="#b95b1d">${pvFormatted}</mtext>
          </mrow>
          <mrow>
            <mn>1</mn>
            <mo>−</mo>
            <msup>
              <mrow>
                <mo>(</mo>
                <mn>1</mn>
                <mo>+</mo>
                <mtext mathcolor="#7a46ff">${rPercent}%</mtext>
                <mo>)</mo>
              </mrow>
              <mn>−${totalMonths}</mn>
            </msup>
          </mrow>
        </mfrac>
      </mrow>
    </math>
  `;
  
  container.innerHTML = mathML;
}