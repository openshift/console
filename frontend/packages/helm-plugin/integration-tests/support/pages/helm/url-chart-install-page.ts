export const urlChartPO = {
  chartURL: '[data-test="oci-chart-url"] input',
  releaseName: '[data-test="oci-release-name"] input',
  chartVersion: '[data-test="oci-chart-version"] input',
  nextButton: '[data-test-id="submit-button"]',
  cancelButton: '[data-test-id="reset-button"]',
  installButton: '[data-test-id="submit-button"]',
  backButton: '[data-test-id="reset-button"]',
};

export const urlChartInstallPage = {
  enterChartURL: (url: string) => {
    cy.get(urlChartPO.chartURL).clear().type(url);
  },
  enterReleaseName: (name: string) => {
    cy.get(urlChartPO.releaseName).clear().type(name);
  },
  enterChartVersion: (version: string) => {
    cy.get(urlChartPO.chartVersion).clear().type(version);
  },
  clickNext: () => {
    cy.get(urlChartPO.nextButton).click();
  },
  clickInstall: () => {
    cy.get(urlChartPO.installButton).click();
  },
  verifyValidationErrors: () => {
    cy.get('.pf-m-error').should('have.length.at.least', 1);
  },
};
