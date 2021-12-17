import { exportApplication, exportModalButton } from '../../page-objects/export-applications-po';

export function clickVisibleButton(flag: boolean = true) {
  /* eslint-disable promise/catch-or-return */

  cy.get('body').then(($body) => {
    if (
      $body
        .find('.modal-body')
        .text()
        .includes(' is in progress')
    ) {
      cy.log('Close progress modal');
      cy.get(exportModalButton('Ok'))
        .should('be.visible')
        .click();
      cy.get(exportModalButton('Ok')).should('not.exist');
      cy.get(exportApplication.exportApplicationButton)
        .should('be.visible')
        .click();
      if (flag === true) {
        cy.get(exportModalButton('Restart Export'))
          .should('be.visible')
          .click();
        cy.get(exportModalButton('Restart Export')).should('not.exist');
      }
    }
  });
}

export const exportOfApplication = {
  exportApplicationFresh: () => {
    /* eslint-disable promise/catch-or-return */

    cy.get(exportApplication.exportApplicationButton)
      .should('be.visible')
      .click();
    cy.get('body').then(($body) => {
      if ($body.find('[data-test="export-cancel-btn"]').length) {
        cy.log('Close export application modal');
        cy.get(exportModalButton('Restart Export'))
          .should('be.visible')
          .click();
        cy.get(exportModalButton('Restart Export')).should('not.exist');
      }
    });
    clickVisibleButton();
  },
};
