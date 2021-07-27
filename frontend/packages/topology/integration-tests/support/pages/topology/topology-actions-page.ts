import { modal } from '@console/cypress-integration-tests/views/modal';
import {
  nodeActions,
  addToApplicationGroupings,
  applicationGroupingsActions,
} from '@console/dev-console/integration-tests/support/constants';
import { topologyPO } from '../../page-objects/topology-po';

export const topologyActions = {
  selectAction: (action: nodeActions | string | applicationGroupingsActions) => {
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
      case 'Delete Application':
      case applicationGroupingsActions.DeleteApplication: {
        cy.byTestActionID(action)
          .should('be.visible')
          .click();
        break;
      }
      case 'Add to Application':
      case applicationGroupingsActions.AddtoApplication: {
        cy.get(topologyPO.addToApplication)
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

export const addToApplication = {
  selectAction: (action: addToApplicationGroupings | string) => {
    switch (action) {
      case addToApplicationGroupings.FromGit:
      case 'From Git': {
        cy.byTestActionID(action)
          .should('be.visible')
          .click();
        break;
      }
      case addToApplicationGroupings.FromDevfile:
      case 'From Devfile': {
        cy.byTestActionID(action)
          .should('be.visible')
          .click();
        break;
      }
      case addToApplicationGroupings.FromDockerfile:
      case 'From Dockerfile': {
        cy.byTestActionID(action)
          .should('be.visible')
          .click();
        break;
      }
      case addToApplicationGroupings.ContainerImage:
      case 'Container Image': {
        cy.byTestActionID(action)
          .should('be.visible')
          .click();
        break;
      }
      case addToApplicationGroupings.UploadJarfile:
      case 'Upload JAR file': {
        cy.byTestActionID(action)
          .should('be.visible')
          .click();
        break;
      }
      case addToApplicationGroupings.EventSource:
      case 'Event Source': {
        cy.byTestActionID(action)
          .should('be.visible')
          .click();
        break;
      }
      case addToApplicationGroupings.Channel:
      case 'Channel': {
        cy.byTestActionID(action)
          .should('be.visible')
          .click();
        break;
      }
      default: {
        throw new Error(`${action} is not available in menu`);
      }
    }
  },
};
