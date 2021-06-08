import { modal } from '@console/cypress-integration-tests/views/modal';
import { nodeActions } from '@console/dev-console/integration-tests/support/constants';

export const topologyActions = {
  selectAction: (action: nodeActions | string) => {
    switch (action) {
      case 'Edit Application Grouping':
      case 'Edit Application grouping':
      case nodeActions.EditApplicationGrouping: {
        cy.byTestActionID(action)
          .should('be.visible')
          .click();
        break;
      }
      case 'Edit Deployment':
      case nodeActions.EditDeployment: {
        cy.byTestActionID(action)
          .should('be.visible')
          .click();
        break;
      }
      case 'Edit DeploymentConfig':
      case nodeActions.EditDeploymentConfig: {
        cy.byTestActionID(action)
          .should('be.visible')
          .click();
        break;
      }
      case 'Edit Pod Count':
      case 'Edit Pod count':
      case nodeActions.EditPodCount: {
        cy.byTestActionID(action)
          .should('be.visible')
          .click();
        break;
      }
      case 'Edit Labels':
      case 'Edit labels':
      case nodeActions.EditLabels: {
        cy.byTestActionID(action)
          .should('be.visible')
          .click();
        cy.get('form').should('be.visible');
        modal.modalTitleShouldContain('Edit labels');
        break;
      }
      case 'Edit Annotations':
      case 'Edit annotations':
      case nodeActions.EditAnnotations: {
        cy.byTestActionID(action)
          .should('be.visible')
          .click();
        cy.get('form').should('be.visible');
        modal.modalTitleShouldContain('Edit annotations');
        break;
      }
      case 'Edit Update Strategy':
      case nodeActions.EditUpdateStrategy: {
        cy.byTestActionID(action)
          .should('be.visible')
          .click();
        break;
      }
      case 'Delete Deployment':
      case nodeActions.DeleteDeployment: {
        cy.byTestActionID(action)
          .should('be.visible')
          .click();
        break;
      }
      case 'Delete DeploymentConfig':
      case nodeActions.DeleteDeploymentConfig: {
        cy.byTestActionID(action)
          .should('be.visible')
          .click();
        break;
      }
      case 'Delete SinkBinding':
      case nodeActions.DeleteSinkBinding: {
        cy.byTestActionID(action)
          .should('be.visible')
          .click();
        break;
      }
      case 'Edit SinkBinding':
      case nodeActions.EditSinkBinding: {
        cy.byTestActionID(action)
          .should('be.visible')
          .click();
        break;
      }
      case 'Edit resource limits':
      case nodeActions.EditResourceLimits: {
        cy.byTestActionID(action)
          .should('be.visible')
          .click();
        break;
      }
      case 'Move sink':
      case nodeActions.MoveSink: {
        cy.byTestActionID(action)
          .should('be.visible')
          .click();
        break;
      }
      case 'Delete Service':
      case nodeActions.DeleteService: {
        cy.byTestActionID(action)
          .should('be.visible')
          .click();
        break;
      }
      default: {
        throw new Error(`${action} is not available in action menu`);
      }
    }
  },
};
