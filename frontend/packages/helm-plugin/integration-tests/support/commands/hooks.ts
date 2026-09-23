// TEMPORARY DIAGNOSTIC: capture every CSP violation's directive/blockedURI so we can
// identify what's triggering the "Failed to construct 'URL': Invalid URL" crash in
// useCSPViolationDetector.tsx (sameHostname). Remove once root-caused.
// Re-attached on every page load since `window:before:load` fires on every navigation.
Cypress.on('window:before:load', (win: any) => {
  win.cspViolationsDebug = [];
  win.document.addEventListener('securitypolicyviolation', (e: SecurityPolicyViolationEvent) => {
    win.cspViolationsDebug.push({
      effectiveDirective: e.effectiveDirective,
      blockedURI: e.blockedURI,
      disposition: e.disposition,
      sourceFile: e.sourceFile,
      documentURI: e.documentURI,
    });
  });
});

afterEach(() => {
  cy.window({ log: false }).then((win: any) => {
    const violations = win.cspViolationsDebug || [];
    if (violations.length > 0) {
      cy.task('log', `[CSP-DEBUG] ${JSON.stringify(violations)}`);
    }
  });
});

before(() => {
  cy.login();
  cy.document().its('readyState').should('eq', 'complete');
  cy.window().then((win: any) => {
    win.SERVER_FLAGS.userSettingsLocation = 'localstorage';
  });
  // Default helm repo has been changed to a new repo, so executing below line to fix that issue
  cy.exec('oc apply -f test-data/red-hat-helm-charts.yaml');
});

after(() => {
  cy.exec(`oc delete namespace ${Cypress.expose('NAMESPACE')}`, { failOnNonZeroExit: false });
});
