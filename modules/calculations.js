/**
 * Mortgage Calculation Logic - Annual Payment Schedule
 * Calculates monthly payment and generates yearly amortization data
 */

/**
 * Calculate mortgage payment and annual amortization schedule
 * @param {Object} inputs - { principal, rate, years }
 * @returns {Object} { monthlyPayment, annualPayment, totalInterest, totalPaid, schedule }
 */
export function calculate({ principal = 0, rate = 0, years = 0 }) {
  // Validate inputs
  if (principal <= 0 || rate <= 0 || years <= 0) {
    return {
      monthlyPayment: 0,
      annualPayment: 0,
      totalInterest: 0,
      totalPaid: 0,
      schedule: []
    };
  }

  // Convert annual rate to monthly rate (as decimal)
  const monthlyRate = rate / 100 / 12;
  const totalMonths = years * 12;

  // Calculate monthly payment using standard mortgage formula
  // M = P * [r(1+r)^n] / [(1+r)^n - 1]
  const monthlyPayment = principal * 
    (monthlyRate * Math.pow(1 + monthlyRate, totalMonths)) / 
    (Math.pow(1 + monthlyRate, totalMonths) - 1);

  const annualPayment = monthlyPayment * 12;

  // Generate annual amortization schedule
  const schedule = [];
  let remainingBalance = principal;
  let totalInterestPaid = 0;

  for (let year = 1; year <= years; year++) {
    let yearlyInterest = 0;
    let yearlyPrincipal = 0;

    // Calculate 12 months of payments for this year
    for (let month = 1; month <= 12; month++) {
      const interestPayment = remainingBalance * monthlyRate;
      const principalPayment = monthlyPayment - interestPayment;

      yearlyInterest += interestPayment;
      yearlyPrincipal += principalPayment;
      remainingBalance -= principalPayment;

      // Handle rounding errors on final payment
      if (remainingBalance < 0.01) {
        remainingBalance = 0;
      }
    }

    totalInterestPaid += yearlyInterest;

    schedule.push({
      year,
      principal: yearlyPrincipal,
      interest: yearlyInterest,
      totalPayment: yearlyPrincipal + yearlyInterest,
      remainingBalance: remainingBalance
    });
  }

  return {
    monthlyPayment,
    annualPayment,
    totalInterest: totalInterestPaid,
    totalPaid: principal + totalInterestPaid,
    schedule
  };
}

/**
 * Validate input field
 * @param {string} field - Field name
 * @param {number} value - Field value
 * @returns {string|null} - Error message or null if valid
 */
export function validateInput(field, value) {
  const rules = {
    principal: { min: 1000, max: 10000000, label: 'Loan Amount' },
    rate: { min: 0.1, max: 20, label: 'Interest Rate' },
    years: { min: 1, max: 40, label: 'Loan Term' }
  };

  const rule = rules[field];
  if (!rule) return null;

  if (isNaN(value) || value === null || value === '') {
    return `${rule.label} is required`;
  }

  if (value < rule.min) {
    return `${rule.label} must be at least ${rule.min.toLocaleString()}`;
  }

  if (value > rule.max) {
    return `${rule.label} must be no more than ${rule.max.toLocaleString()}`;
  }

  return null;
}