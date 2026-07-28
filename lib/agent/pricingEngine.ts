import { PricingMatrix, PricingBreakdown, DispatchPath } from '@/types/agent';

export const POPULAR_CATEGORY_PRESETS: Record<string, PricingMatrix> = {
  software_engineering: {
    industry_category: 'Software & Tech Consulting',
    base_fee: 350,
    hourly_rate: 145,
    material_base_cost: 200,
    standard_complexity_min: 1.0,
    standard_complexity_max: 1.8,
    autopay_threshold: 3500,
    deposit_percentage: 20,
    service_zip_codes: ['12201', '12202', '12203', '94103', '94107', '10001', '90210', 'REMOTE'],
    safety_flag_keywords: [
      'root database access',
      'data breach audit',
      'legacy cobol',
      'crypto smart contract',
      'pci compliance audit',
      'production outage',
      'soc2 certification'
    ]
  },
  plumbing: {
    industry_category: 'Plumbing & Mechanical',
    base_fee: 150,
    hourly_rate: 95,
    material_base_cost: 85,
    standard_complexity_min: 1.0,
    standard_complexity_max: 1.8,
    autopay_threshold: 1000,
    deposit_percentage: 25,
    service_zip_codes: ['12201', '12202', '12203', '12204', '12205', '94103', '94107', '10001', '90210'],
    safety_flag_keywords: ['gas', 'gas line', 'structural', 'load bearing', 'water main leak', 'asbestos']
  },
  hvac: {
    industry_category: 'HVAC & Climate Control',
    base_fee: 180,
    hourly_rate: 110,
    material_base_cost: 150,
    standard_complexity_min: 1.0,
    standard_complexity_max: 1.8,
    autopay_threshold: 1500,
    deposit_percentage: 25,
    service_zip_codes: ['12201', '12202', '12203', '12204', '94103', '94107', '10001'],
    safety_flag_keywords: ['freon leak', 'gas furnace line', 'roof rooftop unit crane', 'combustion ventilation']
  },
  electrical: {
    industry_category: 'Electrical & Power Systems',
    base_fee: 160,
    hourly_rate: 105,
    material_base_cost: 120,
    standard_complexity_min: 1.0,
    standard_complexity_max: 1.8,
    autopay_threshold: 1200,
    deposit_percentage: 25,
    service_zip_codes: ['12201', '12202', '12203', '94103', '94107', '10001'],
    safety_flag_keywords: ['high voltage', 'main panel replacement', '200 amp upgrade', 'transformer fault']
  },
  auto_detailing: {
    industry_category: 'Auto Detailing & Vehicle Care',
    base_fee: 90,
    hourly_rate: 75,
    material_base_cost: 60,
    standard_complexity_min: 1.0,
    standard_complexity_max: 1.8,
    autopay_threshold: 800,
    deposit_percentage: 20,
    service_zip_codes: ['12201', '12202', '12203', '94103', '94107', '10001', 'REMOTE'],
    safety_flag_keywords: ['ceramic coating full body', 'engine bay deep restore', 'paint correction multi stage']
  },
  roofing_construction: {
    industry_category: 'Roofing & Building Construction',
    base_fee: 250,
    hourly_rate: 120,
    material_base_cost: 300,
    standard_complexity_min: 1.0,
    standard_complexity_max: 1.8,
    autopay_threshold: 2500,
    deposit_percentage: 30,
    service_zip_codes: ['12201', '12202', '12203', '94103', '94107', '10001'],
    safety_flag_keywords: ['structural truss damage', 'steep pitch roof scaffold', 'permit required', 'asbestos shingle']
  },
  cleaning_facility: {
    industry_category: 'Cleaning & Facility Management',
    base_fee: 80,
    hourly_rate: 65,
    material_base_cost: 45,
    standard_complexity_min: 1.0,
    standard_complexity_max: 1.8,
    autopay_threshold: 600,
    deposit_percentage: 20,
    service_zip_codes: ['12201', '12202', '12203', '94103', '94107', '10001', 'REMOTE'],
    safety_flag_keywords: ['biohazard deep clean', 'industrial chemical strip', 'post construction heavy debris']
  },
  design_creative: {
    industry_category: 'Graphic Design & Creative Media',
    base_fee: 200,
    hourly_rate: 110,
    material_base_cost: 90,
    standard_complexity_min: 1.0,
    standard_complexity_max: 1.8,
    autopay_threshold: 2000,
    deposit_percentage: 20,
    service_zip_codes: ['12201', '12202', '12203', '94103', '94107', '10001', 'REMOTE'],
    safety_flag_keywords: ['trademark dispute', '3d vfx render pipeline', 'super bowl ad commercial']
  }
};

/**
 * Returns a matrix for a category or defaults to software_engineering.
 */
export function getOrCreatePricingMatrix(category: string): PricingMatrix {
  const normalizedKey = category.toLowerCase().replace(/[\s&/]+/g, '_');
  return POPULAR_CATEGORY_PRESETS[normalizedKey] || POPULAR_CATEGORY_PRESETS.software_engineering;
}

export function updatePricingMatrix(matrix: PricingMatrix) {
  POPULAR_CATEGORY_PRESETS.software_engineering = {
    ...POPULAR_CATEGORY_PRESETS.software_engineering,
    ...matrix
  };
}

export function validateServiceZip(zip: string, matrix: PricingMatrix): boolean {
  if (!matrix || !matrix.service_zip_codes) return true;
  return matrix.service_zip_codes.includes(zip) || matrix.service_zip_codes.includes('REMOTE');
}

/**
 * Calculates deterministic pricing quote estimates based on user inquiry text and service matrix rules.
 */
export function calculateEstimate(
  scopeText: string,
  category: string = 'software_engineering',
  customKey?: string
): {
  isZipValid: boolean;
  pricingBreakdown: PricingBreakdown;
  safetyFlags: string[];
  dispatchPath: DispatchPath;
  decisionReason: string;
} {
  const matrix = customKey && POPULAR_CATEGORY_PRESETS[customKey]
    ? POPULAR_CATEGORY_PRESETS[customKey]
    : getOrCreatePricingMatrix(category);

  const lowerScope = scopeText.toLowerCase();

  // Safety Flag Evaluation
  const safetyFlags: string[] = [];
  matrix.safety_flag_keywords.forEach((keyword) => {
    if (lowerScope.includes(keyword.toLowerCase())) {
      safetyFlags.push(keyword);
    }
  });

  // Estimate hours derived from text length & scope keywords
  let estimatedHours = 8;
  if (fontIncludes(lowerScope, ['mobile', 'app', 'react native', 'ios', 'android', 'full-stack'])) {
    estimatedHours += 16;
  }
  if (fontIncludes(lowerScope, ['database', 'postgres', 'microservices', 'backend', 'api', 'docker'])) {
    estimatedHours += 10;
  }
  if (fontIncludes(lowerScope, ['ai', 'agent', 'llm', 'rag', 'openai', 'gemini'])) {
    estimatedHours += 12;
  }

  // Complexity Factor calculation (1.0x to 1.8x)
  let complexityFactor = 1.1;
  if (fontIncludes(lowerScope, ['asap', 'urgent', 'emergency', 'overnight', 'same day'])) {
    complexityFactor += 0.2;
  }
  if (fontIncludes(lowerScope, ['custom', 'complex', 'senior', 'master', 'specialized', 'difficult'])) {
    complexityFactor += 0.2;
  }
  if (safetyFlags.length > 0) {
    complexityFactor += 0.3;
  }

  // Clamp complexity factor to bounds [1.0, 1.8]
  complexityFactor = Math.min(
    Math.max(complexityFactor, matrix.standard_complexity_min),
    matrix.standard_complexity_max
  );
  complexityFactor = Math.round(complexityFactor * 10) / 10;

  // Base Cost Calculation
  const baseCost = matrix.base_fee + estimatedHours * matrix.hourly_rate + matrix.material_base_cost;
  const rawMinQuote = baseCost * (complexityFactor - 0.1);
  const rawMaxQuote = baseCost * (complexityFactor + 0.1);

  const minQuote = Math.round(rawMinQuote * 10) / 10;
  const maxQuote = Math.round(rawMaxQuote * 10) / 10;

  // Deposit amount
  const depositAmount = Math.round(((minQuote * matrix.deposit_percentage) / 100) * 100) / 100;

  const pricingBreakdown: PricingBreakdown = {
    base_fee: matrix.base_fee,
    estimated_hours: estimatedHours,
    hourly_rate: matrix.hourly_rate,
    materials_est: matrix.material_base_cost,
    complexity_factor: complexityFactor,
    min_quote: minQuote,
    max_quote: maxQuote,
    deposit_amount: depositAmount
  };

  // Dispatch Path Evaluation
  let dispatchPath: DispatchPath = 'AUTO';
  let decisionReason = `Standard parameters for [${matrix.industry_category}] within automated autocommit threshold.`;

  if (minQuote > matrix.autopay_threshold) {
    dispatchPath = 'REQUIRES_HUMAN_REVIEW';
    decisionReason = `Estimate ($${minQuote}-$${maxQuote}) exceeds autopay threshold of $${matrix.autopay_threshold}. Routed to principal lead for manual owner authorization.`;
  } else if (safetyFlags.length > 0) {
    dispatchPath = 'REQUIRES_HUMAN_REVIEW';
    decisionReason = `Detected high-risk domain flags [${safetyFlags.join(', ')}]. Escalated to human owner review queue.`;
  } else if (complexityFactor >= 1.5) {
    dispatchPath = 'REQUIRES_HUMAN_REVIEW';
    decisionReason = `High complexity multiplier (${complexityFactor}x) requires owner evaluation.`;
  }

  return {
    isZipValid: true,
    pricingBreakdown,
    safetyFlags,
    dispatchPath,
    decisionReason
  };
}

function fontIncludes(text: string, words: string[]): boolean {
  return words.some((w) => text.includes(w));
}
