import { nodeActions } from '../../constants/topology';
import { modal } from '../../../../../integration-tests-cypress/views/modal';

export const topologyActions = {
  selectAction: (action: nodeActions | string) => {
    switch (action) {
      case nodeActions.EditApplicatoinGrouping || 'Edit Application Grouping': {
        cy.byTestActionID(action)
          .should('be.visible')
          .click();
        break;
      }
      case nodeActions.EditPodCount || 'Edit Pod Count': {
        cy.byTestActionID(action)
          .should('be.visible')
          .click();
        break;
      }
      case nodeActions.EditLabels || 'Edit Labels': {
        cy.byTestActionID(action)
          .should('be.visible')
          .click();
        cy.get('form').should('be.visible');
        modal.modalTitleShouldContain('Edit Labels');
        break;
      }
      case nodeActions.EditAnnotations || 'Edit Annotations': {
        cy.byTestActionID(action)
          .should('be.visible')
          .click();
        cy.get('form').should('be.visible');
        modal.modalTitleShouldContain('Edit Annotations');
        break;
      }
      case nodeActions.EditUpdateStrategy || 'Edit Update Strategy': {
        cy.byTestActionID(action)
          .should('be.visible')
          .click();
        break;
      }
      case nodeActions.DeleteDeployment || 'Delete Deployment': {
        cy.byTestActionID(action)
          .should('be.visible')
          .click();
        break;
      }
      case nodeActions.DeleteSinkBinding || 'Delete SinkBinding': {
        cy.byTestActionID(action)
          .should('be.visible')
          .click();
        break;
      }
      case nodeActions.EditSinkBinding || 'Edit SinkBinding': {
        cy.byTestActionID(action)
          .should('be.visible')
          .click();
        break;
      }
      case nodeActions.MoveSink || 'Move Sink': {
        cy.byTestActionID(action)
          .should('be.visible')
          .click();
        break;
      }
      case nodeActions.DeleteService || 'Delete Service': {
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
