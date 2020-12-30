import { helmPO } from '../pageObjects/helm-po';

export const sidebarPage = {
  verifyChartVersion: () =>
    cy
      .get(helmPO.sidebarPage.chartVersion)
      .eq(0)
      .should('have.text', '0.2.1'),
};
