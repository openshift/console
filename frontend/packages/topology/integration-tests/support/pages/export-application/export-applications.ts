import { exportApplication, exportModalButton } from '../../page-objects/export-applications-po';
import { topologyPO } from '../../page-objects/topology-po';
import { topologyHelper } from '../topology';

export const exportOfApplication = {
  exportApplicationFresh: () => {
    topologyHelper.search('primer');
    /* eslint-disable promise/catch-or-return */
    cy.get('body').then(($body) => {
      if ($body.find(topologyPO.highlightNode).length !== 0) {
        cy.get(exportApplication.exportApplicationButton)
          .should('be.visible')
          .click();
        if ($body.find('[data-test="export-cancel-btn"]').length !== 0) {
          cy.get(exportModalButton('Cancel Export'))
            .should('be.visible')
            .click();
          cy.get(exportApplication.exportApplicationButton)
            .should('be.visible')
            .click();
        } else if (
          $body
            .find('.modal-body')
            .text()
            .includes(' is in progress')
        ) {
          cy.get(exportModalButton('Ok'))
            .should('be.visible')
            .click();
          cy.get(exportApplication.exportApplicationButton)
            .should('be.visible')
            .click();
          cy.get(exportModalButton('Cancel Export'))
            .should('be.visible')
            .click();
        } else if (
          $body
            .find(exportApplication.infoTip)
            .text()
            .includes(
              'All the resources are exported successfully from aut-export-application. Click below to download it.',
            )
        ) {
          cy.get('[aria-label="Close Info alert: alert: Export Application"]')
            .should('be.visible')
            .click();
          cy.get(exportApplication.exportApplicationButton)
            .should('be.visible')
            .click();
          cy.get(exportModalButton('Cancel Export'))
            .should('be.visible')
            .click();
        } else {
          cy.get(exportApplication.exportApplicationButton)
            .should('be.visible')
            .click();
          cy.get(exportModalButton('Cancel Export'))
            .should('be.visible')
            .click();
        }
        cy.get(exportApplication.exportApplicationButton, { timeout: 10000 })
          .should('be.visible')
          .click();
      } else {
        cy.get(exportApplication.exportApplicationButton)
          .should('be.visible')
          .click();
      }
    });
  },
};
