/**
 * Cypress support helpers for TechPreview and per-feature-gate guards.
 *
 * Usage (in a Cypress package's support entry point):
 *
 *   // Skip entire suite unless cluster is TechPreviewNoUpgrade:
 *   import './tech-preview-guard';
 *
 *   // Skip entire suite unless a specific feature gate is enabled:
 *   import { requireFeatureGate } from './tech-preview-guard';
 *   requireFeatureGate('OLMv1');
 */

before(function () {
  cy.exec('oc get featuregate cluster -o jsonpath={.spec.featureSet}', {
    failOnNonZeroExit: false,
  }).then((result) => {
    if (result.stdout.trim() !== 'TechPreviewNoUpgrade') {
      this.skip();
    }
  });
});

export function requireFeatureGate(gateName: string): void {
  before(function () {
    cy.exec(
      "oc get featuregate cluster -o jsonpath='{range .status.featureGates[*]}{range .enabled[*]}{.name}{\"\\n\"}{end}{end}'",
      { failOnNonZeroExit: false },
    ).then((result) => {
      const enabled = result.stdout
        .split('\n')
        .map((s) => s.trim())
        .filter(Boolean);
      if (!enabled.includes(gateName)) {
        this.skip();
      }
    });
  });
}
