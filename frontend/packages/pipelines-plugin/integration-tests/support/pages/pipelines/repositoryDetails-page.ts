import { yamlEditor } from '@console/dev-console/integration-tests/support/pages';
import { repositoryDetailsTabs } from '../../constants';
import { repositoryDetailsPO } from '../../page-objects';

export const repositoryDetailsPage = {
  selectTab: (tabName: string | repositoryDetailsTabs) => {
    switch (tabName) {
      case repositoryDetailsTabs.Details:
      case 'Details': {
        cy.get(repositoryDetailsPO.detailsTab).click();
        cy.get(repositoryDetailsPO.details.sectionTitle).should('be.visible');
        break;
      }
      case repositoryDetailsTabs.YAML:
      case 'YAML': {
        cy.get(repositoryDetailsPO.yamlTab).click();
        yamlEditor.isLoaded();
        break;
      }
      case repositoryDetailsTabs.PipelineRuns:
      case 'Pipeline Runs': {
        cy.get(repositoryDetailsPO.pipelineRunsTab).click();
        cy.url().should('include', 'Runs');
        break;
      }
      default: {
        throw new Error(`tab doesn't exists, please check once again`);
      }
    }
  },
  verifyTabs: () => {
    cy.get(repositoryDetailsPO.detailsTab).should('be.visible');
    cy.get(repositoryDetailsPO.yamlTab).should('be.visible');
    cy.get(repositoryDetailsPO.pipelineRunsTab).should('be.visible');
  },

  verifyFieldsInDetailsTab: () => {
    cy.get(repositoryDetailsPO.details.fieldNames.name).should('be.visible');
    cy.get(repositoryDetailsPO.details.fieldNames.namespace).should('be.visible');
    cy.get(repositoryDetailsPO.details.fieldNames.labels).should('be.visible');
    cy.get(repositoryDetailsPO.details.fieldNames.annotations).should('be.visible');
    cy.get(repositoryDetailsPO.details.fieldNames.createdAt).should('be.visible');
    cy.get(repositoryDetailsPO.details.fieldNames.owner).should('be.visible');
    cy.byTestID('pl-repository-customdetails').within(() => {
      cy.get('dl dt')
        .eq(0)
        .should('have.text', 'Repository');
      cy.get('dl dt')
        .eq(1)
        .should('have.text', 'Branch');
      cy.get('dl dt')
        .eq(2)
        .should('have.text', 'Event type');
    });
  },

  verifyLabelInLabelsList: (label: string) => {
    const labelArr = label.split('=');
    cy.byTestID('label-list').within(() => {
      cy.byTestID('label-key').should('contain.text', labelArr[0]);
      cy.get('.co-m-label__value').should('contain.text', labelArr[1]);
    });
  },

  verifyAnnotations: (numOfAnnotations: string) => {
    cy.byTestID('edit-annotations').should('have.text', numOfAnnotations);
  },
};
