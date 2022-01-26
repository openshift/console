import { adminOnlyDescribe, OS_IMAGES_NS } from '../../utils/const';
import * as virtOverview from '../../views/virtualization-overview';

adminOnlyDescribe('Test Virtualization Overview cards', () => {
  before(() => {
    cy.Login();
    cy.visit('/virtualization/overview');
  });

  it('ID(CNV-7928) Details card w/articles is displayed', () => {
    cy.get(virtOverview.detailsCard)
      .should('exist')
      .within(() => {
        cy.get(virtOverview.cardTitle)
          .contains('Details')
          .should('exist');
        ['Service name', 'Provider', 'OpenShift Virtualization version', 'Update Channel'].forEach(
          (article) => {
            cy.get(virtOverview.itemTitle)
              .contains(article)
              .should('exist');
          },
        );
      });
  });

  it('ID(CNV-7929) Running VMs per template card is displayed', () => {
    cy.get(virtOverview.perTemplateCard)
      .should('exist')
      .within(() => {
        cy.get(virtOverview.cardTitle)
          .contains('Running VMs per template')
          .should('exist');
      });
  });

  it('ID(CNV-7931) Status card with items is displayed', () => {
    cy.get(virtOverview.statusCard)
      .should('exist')
      .within(() => {
        cy.get(virtOverview.cardTitle)
          .contains('Status')
          .should('exist');
        cy.get(virtOverview.cardActions).should('exist');
        cy.get(virtOverview.virtHealthItem).should('exist');
        cy.get(virtOverview.virtHealthIcon).should('exist');
        cy.get(virtOverview.netHealthItem).should('exist');
        cy.get(virtOverview.netHealthIcon).should('exist');
        cy.get(virtOverview.alertsList).should('exist');
      });
  });

  it('ID(CNV-7930) Inventory card with items is displayed', () => {
    cy.get(virtOverview.inventoryCard)
      .should('exist')
      .within(() => {
        cy.get(virtOverview.cardTitle)
          .contains('Inventory')
          .should('exist');
        cy.get(virtOverview.vmsLink)
          .contains('Virtual Machines')
          .should('exist');
        cy.get(virtOverview.templatesLink)
          .contains('Templates')
          .should('exist')
          .and('have.attr', 'href', `/k8s/ns/${OS_IMAGES_NS}/virtualmachinetemplates`);
        cy.get(virtOverview.nodesLink)
          .contains('Nodes')
          .should('exist');
        cy.get(virtOverview.networksLink)
          .contains('Networks')
          .should('exist');
      });
  });

  it('ID(CNV-7932) Activity card with items is displayed', () => {
    cy.get(virtOverview.activityCard)
      .should('exist')
      .within(() => {
        cy.get(virtOverview.cardTitle)
          .contains('Activity')
          .should('exist');
        cy.get(virtOverview.cardActions).should('exist');
        cy.get(virtOverview.ongoingTitle).should('exist');
        cy.get(virtOverview.ongoingActivity).should('exist');
        cy.get(virtOverview.recentActivity).should('exist');
        cy.get(virtOverview.pauseButton)
          .should('exist')
          .should('have.text', 'Pause')
          .click();
        cy.get(virtOverview.pauseButton)
          .should('exist')
          .should('have.text', 'Resume')
          .click();
        cy.get(virtOverview.pauseButton)
          .should('exist')
          .should('have.text', 'Pause');
      });
  });

  it('ID(CNV-7933) Permissions card with items is displayed', () => {
    cy.get(virtOverview.permissionsCard)
      .should('exist')
      .within(() => {
        cy.get(virtOverview.cardTitle)
          .contains('Permissions')
          .should('exist');
        cy.get(virtOverview.successIcon).should('exist');
        cy.get(virtOverview.accessPopupButton)
          .should('exist')
          .click();
      });
    cy.get(virtOverview.modalTitle)
      .contains('Permissions')
      .should('exist');
    cy.get(virtOverview.taskItem).should('have.length', 6);
    cy.get(virtOverview.taskIcon).should('have.length', 6);
    cy.get(virtOverview.closeButton)
      .should('exist')
      .click();
  });

  it('ID(CNV-7934) Top consumers card with items is displayed', () => {
    cy.get(virtOverview.topConsumersCard)
      .should('exist')
      .within(() => {
        cy.get(virtOverview.cardTitle)
          .contains('Top consumers')
          .should('exist');
        cy.get(virtOverview.cardActions).should('exist');
        cy.get(virtOverview.amountButton).should('exist');
      });
  });
});
