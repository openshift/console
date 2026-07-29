import type { Page } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

import { expect } from '../fixtures';
import type { Result } from 'axe-core';

const INCLUDED_IMPACTS = new Set(['serious', 'critical']);

const LOADING_SELECTORS = [
  '.pf-v6-c-spinner',
  '.pf-v5-c-spinner',
  '.pf-c-spinner',
  '.co-m-loader',
  '[data-test="loading-indicator"]',
  '[data-test="loading-box"]',
  '.loading-skeleton',
  '.skeleton-catalog--grid',
  '[class*="skeleton"]',
].join(', ');

function formatViolations(violations: Result[], target: string): string {
  const lines: string[] = [
    `${violations.length} accessibility violation${violations.length === 1 ? '' : 's'} ${violations.length === 1 ? 'was' : 'were'} detected for ${target}:`,
  ];

  violations.forEach((violation, index) => {
    lines.push(
      `  ${index + 1}. ${violation.impact} ${violation.id}`,
      `     ${violation.description}`,
      `     ${violation.help}`,
      `     ${violation.helpUrl}`,
      `     Tags: ${violation.tags.join(', ')}`,
      `     ${violation.nodes.length === 1 ? 'Node' : 'Nodes'}:`,
    );
    violation.nodes.forEach((node) => {
      const parts = [`       - ${node.failureSummary?.replace(/\n/g, '\n         ') ?? ''}`];
      parts.push(`         HTML: ${node.html}`);
      if (node.target?.length) {
        parts.push(`         Target: ${node.target.join(' ')}`);
      }
      lines.push(parts.join('\n'));
    });
  });

  return lines.join('\n');
}

export async function testA11y(page: Page, target: string, selector?: string): Promise<void> {
  try {
    const loading = page.locator(LOADING_SELECTORS);
    const count = await loading.count().catch(() => 0);
    if (count > 0) {
      // eslint-disable-next-line no-restricted-syntax
      await loading.first().waitFor({ state: 'hidden', timeout: 5_000 });
    }
  } catch {
    // Loading indicators may have already disappeared — continue
  }

  let builder = new AxeBuilder({ page }).disableRules('color-contrast');

  if (selector) {
    builder = builder.include(selector);
  }

  const results = await builder.analyze();

  const violations = results.violations.filter((v) => INCLUDED_IMPACTS.has(v.impact ?? ''));

  if (violations.length > 0) {
    expect(violations, formatViolations(violations, target)).toHaveLength(0);
  }
}
