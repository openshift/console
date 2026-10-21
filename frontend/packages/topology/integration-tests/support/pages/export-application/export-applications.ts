import { exportApplication } from '../../page-objects/export-applications-po';

export const exportOfApplication = {
  exportApplicationFresh: () => {
    /* eslint-disable promise/catch-or-return */

    cy.get(exportApplication.exportApplicationButton).should('be.visible').click();
    cy.byTestID('close-btn').should('be.visible').click();
  },
};
