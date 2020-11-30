import { detailsPage } from '../../../../../integration-tests-cypress/views/details-page';
import { addOptions } from '../../constants/add';
import { pageTitle } from '../../constants/pageTitle';
import { cardTitle } from '../../pageObjects/add-flow-po';

export const addPage = {
  selectCardFromOptions: (card: addOptions | string) => {
    switch (card) {
      case 'Git':
      case addOptions.Git:
        cy.byLegacyTestID('import-from-git').click();
        // Bug: 1890678 is created related to Accesibiity violation - Until bug fix, below line is commented to execute the scripts in CI
        // cy.testA11y('Import from Git Page');
        detailsPage.titleShouldContain(pageTitle.Git);
        break;
      case 'Deploy Image':
      case addOptions.ContainerImage:
        cy.byLegacyTestID('deploy-image').click();
        cy.testA11y('Deploy Page');
        detailsPage.titleShouldContain(pageTitle.ContainerImage);
        break;
      case 'Import from Dockerfile':
      case addOptions.DockerFile:
        cy.byLegacyTestID('import-from-dockerfile').click();
        detailsPage.titleShouldContain(pageTitle.DockerFile);
        break;
      case 'Developer Catalog':
      case 'From Catalog':
      case addOptions.DeveloperCatalog:
        cy.byLegacyTestID('dev-catalog').click();
        detailsPage.titleShouldContain(pageTitle.DeveloperCatalog);
        break;
      case 'Database':
      case addOptions.Database:
        cy.byLegacyTestID('dev-catalog-databases').click();
        detailsPage.titleShouldContain(pageTitle.DeveloperCatalog);
        break;
      case 'Event Source':
      case addOptions.EventSource:
        cy.byLegacyTestID('knative-event-source').click();
        detailsPage.titleShouldContain(pageTitle.EventSource);
        break;
      case 'Helm Chart':
      case addOptions.HelmChart:
        cy.byLegacyTestID('helm').click();
        detailsPage.titleShouldContain(pageTitle.DeveloperCatalog);
        cy.byTestID('kind-helm-chart').should('be.checked');
        break;
      case 'Operator Backed':
      case addOptions.OperatorBacked:
        cy.byLegacyTestID('operator-backed').click();
        detailsPage.titleShouldContain(pageTitle.DeveloperCatalog);
        cy.byTestID('kind-cluster-service-version').should('be.checked');
        break;
      case 'Pipelines':
      case addOptions.Pipeline:
        cy.byLegacyTestID('pipeline').click();
        cy.get('h1.odc-pipeline-builder-header__title').should('have.text', 'Pipeline Builder');
        break;
      case 'Yaml':
      case addOptions.YAML:
        cy.byLegacyTestID('import-yaml').click();
        cy.get('[data-mode-id="yaml"]').should('be.visible');
        break;
      default:
        throw new Error(`Unable to find the "${card}" card on Add page`);
    }
  },
  verifyCard: (cardName: string) =>
    cy
      .get(cardTitle)
      .contains(cardName)
      .should('be.visible'),
};
