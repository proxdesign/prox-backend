/**
 * Evaluation Runner Utilities
 *
 * Provides reusable functions for running chat API evaluations
 * following LLM testing best practices.
 */

export interface TestCase {
  id: string;
  category: string;
  problemId: string;
  userInput: string;
  description: string;
  expectedBehavior: {
    shouldAskClarifying?: boolean;
    shouldShowProducts?: boolean;
    shouldShowSolutions?: boolean;
    shouldContainKeywords?: string[];
    shouldNotContain?: string[];
    minResponseLength?: number;
    maxResponseLength?: number;
  };
}

export interface ChatResponse {
  response: string;
  products?: any[];
  solutions?: any[];
  showProductGrid?: boolean;
  needsMoreInfo?: boolean;
}

export interface EvalResult {
  testId: string;
  passed: boolean;
  duration: number;
  errors: string[];
  warnings: string[];
  response?: ChatResponse;
}

export interface EvalReport {
  totalTests: number;
  passed: number;
  failed: number;
  warnings: number;
  duration: number;
  results: EvalResult[];
  categoryBreakdown: Record<string, { passed: number; failed: number }>;
}

const API_BASE_URL = process.env.API_URL || 'http://localhost:3000';

/**
 * Run a single chat evaluation
 */
export async function runChatEval(
  userInput: string,
  expectedBehavior: TestCase['expectedBehavior']
): Promise<{ passed: boolean; errors: string[]; warnings: string[]; response: ChatResponse | null }> {
  const errors: string[] = [];
  const warnings: string[] = [];
  let response: ChatResponse | null = null;

  try {
    const res = await fetch(`${API_BASE_URL}/api/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        message: userInput,
        history: []
      })
    });

    if (!res.ok) {
      errors.push(`API returned status ${res.status}`);
      return { passed: false, errors, warnings, response: null };
    }

    response = await res.json() as ChatResponse;
    const validationResult = validateResponse(response, expectedBehavior);

    return {
      passed: validationResult.errors.length === 0,
      errors: validationResult.errors,
      warnings: validationResult.warnings,
      response
    };

  } catch (error) {
    errors.push(`Test execution error: ${error}`);
    return { passed: false, errors, warnings, response: null };
  }
}

/**
 * Validate a chat response against expected behavior
 */
export function validateResponse(
  response: ChatResponse,
  expected: TestCase['expectedBehavior']
): { errors: string[]; warnings: string[] } {
  const errors: string[] = [];
  const warnings: string[] = [];
  const responseText = response.response?.toLowerCase() || '';

  // Check clarifying question behavior
  if (expected.shouldAskClarifying !== undefined) {
    const hasClarifying = response.needsMoreInfo === true;
    if (expected.shouldAskClarifying && !hasClarifying) {
      errors.push('Expected clarifying question but got direct response');
    }
    if (!expected.shouldAskClarifying && hasClarifying) {
      errors.push('Expected direct response but got clarifying question');
    }
  }

  // Check product display
  if (expected.shouldShowProducts !== undefined) {
    const hasProducts = response.showProductGrid === true &&
                       response.products?.length > 0;
    if (expected.shouldShowProducts && !hasProducts) {
      errors.push('Expected products but none returned');
    }
    if (!expected.shouldShowProducts && hasProducts) {
      warnings.push('Products returned when not expected');
    }
  }

  // Check solution display
  if (expected.shouldShowSolutions !== undefined) {
    const hasSolutions = response.solutions?.length > 0;
    if (expected.shouldShowSolutions && !hasSolutions) {
      errors.push('Expected solutions but none returned');
    }
  }

  // Check required keywords (at least one should match)
  if (expected.shouldContainKeywords && expected.shouldContainKeywords.length > 0) {
    const matchedKeywords = expected.shouldContainKeywords.filter(
      kw => responseText.includes(kw.toLowerCase())
    );
    if (matchedKeywords.length === 0) {
      warnings.push(`Response missing all expected keywords: ${expected.shouldContainKeywords.join(', ')}`);
    }
  }

  // Check forbidden content
  if (expected.shouldNotContain) {
    const foundForbidden = expected.shouldNotContain.filter(
      phrase => responseText.includes(phrase.toLowerCase())
    );
    if (foundForbidden.length > 0) {
      errors.push(`Response contains forbidden phrases: ${foundForbidden.join(', ')}`);
    }
  }

  // Check response length
  if (expected.minResponseLength !== undefined) {
    if (responseText.length < expected.minResponseLength) {
      warnings.push(`Response too short: ${responseText.length} < ${expected.minResponseLength}`);
    }
  }
  if (expected.maxResponseLength !== undefined) {
    if (responseText.length > expected.maxResponseLength) {
      warnings.push(`Response too long: ${responseText.length} > ${expected.maxResponseLength}`);
    }
  }

  return { errors, warnings };
}

/**
 * Generate a summary report from evaluation results
 */
export function generateReport(results: EvalResult[]): EvalReport {
  const categoryBreakdown: Record<string, { passed: number; failed: number }> = {};

  for (const result of results) {
    const category = result.testId.split('-')[0] || 'unknown';
    if (!categoryBreakdown[category]) {
      categoryBreakdown[category] = { passed: 0, failed: 0 };
    }
    if (result.passed) {
      categoryBreakdown[category].passed++;
    } else {
      categoryBreakdown[category].failed++;
    }
  }

  const passed = results.filter(r => r.passed).length;
  const failed = results.filter(r => !r.passed).length;
  const warnings = results.reduce((acc, r) => acc + r.warnings.length, 0);
  const totalDuration = results.reduce((acc, r) => acc + r.duration, 0);

  return {
    totalTests: results.length,
    passed,
    failed,
    warnings,
    duration: totalDuration,
    results,
    categoryBreakdown
  };
}

/**
 * Print a formatted report to console
 */
export function printReport(report: EvalReport): void {
  console.log('\n' + '='.repeat(60));
  console.log('\n📊 EVALUATION RESULTS\n');
  console.log(`Total Tests: ${report.totalTests}`);
  console.log(`Passed: ${report.passed} (${(report.passed / report.totalTests * 100).toFixed(1)}%)`);
  console.log(`Failed: ${report.failed}`);
  console.log(`Warnings: ${report.warnings}`);
  console.log(`Duration: ${(report.duration / 1000).toFixed(2)}s`);

  console.log('\n📁 CATEGORY BREAKDOWN\n');
  for (const [category, stats] of Object.entries(report.categoryBreakdown)) {
    const total = stats.passed + stats.failed;
    const pct = (stats.passed / total * 100).toFixed(0);
    console.log(`${category.padEnd(15)} ${pct}% (${stats.passed}/${total})`);
  }
}
