import { detailsPage } from '../../../../../integration-tests-cypress/views/details-page';
import { addOptions } from '../../constants/add';
import { pageTitle } from '../../constants/pageTitle';
import { cardTitle } from '../../pageObjects/add-flow-po';
import { app } from '../app';

export const addPage = {
  selectCardFromOptions: (card: addOptions | string) => {
    app.waitForDocumentLoad();
    switch (card) {
      case 'Git':
      case addOptions.Git:
        cy.byTestID('item import-from-git').click();
        app.waitForLoad();
        cy.testA11y('Import from Git Page');
        detailsPage.titleShouldContain(pageTitle.Git);
        break;
      case 'Deploy Image':
      case addOptions.ContainerImage:
        cy.byTestID('item deploy-image').click();
        app.waitForLoad();
        cy.testA11y('Deploy Page');
        detailsPage.titleShouldContain(pageTitle.ContainerImage);
        break;
      // TODO (ODC-6455): Tests should use latest UI labels like "Import from Git" instead of mapping strings
      case 'Import from Dockerfile':
      case addOptions.DockerFile:
        cy.byTestID('item import-from-git').click();
        app.waitForLoad();
        cy.testA11y('Import from Docker file');
        detailsPage.titleShouldContain(pageTitle.Git);
        break;
      case 'Developer Catalog':
      case 'From Catalog':
      case addOptions.DeveloperCatalog:
        cy.byTestID('item dev-catalog').click();
        app.waitForLoad();
        detailsPage.titleShouldContain(pageTitle.DeveloperCatalog);
        cy.testA11y(pageTitle.DeveloperCatalog);
        break;
      case 'Database':
      case addOptions.Database:
        cy.byTestID('item dev-catalog-databases').click();
        app.waitForLoad();
        detailsPage.titleShouldContain(pageTitle.DeveloperCatalog);
        cy.testA11y(pageTitle.DeveloperCatalog);
        break;
      case 'Event Source':
      case addOptions.EventSource:
        cy.byTestID('item knative-event-source').click();
        app.waitForLoad();
        detailsPage.titleShouldContain(pageTitle.EventSource);
        cy.testA11y(pageTitle.EventSource);
        break;
      case 'Helm Chart':
      case addOptions.HelmChart:
        cy.byTestID('item helm').click({ force: true });
        app.waitForLoad();
        detailsPage.titleShouldContain(pageTitle.HelmCharts);
        cy.testA11y(pageTitle.HelmCharts);
        break;
      case 'Operator Backed':
      case addOptions.OperatorBacked:
        cy.byTestID('item operator-backed').click();
        app.waitForLoad();
        detailsPage.titleShouldContain(pageTitle.OperatorBacked);
        cy.testA11y(pageTitle.OperatorBacked);
        break;
      case 'Pipeline':
      case addOptions.Pipeline:
        cy.byTestID('item pipeline').click();
        cy.get('.odc-pipeline-builder-header__title').should(
          'have.text',
          pageTitle.PipelineBuilder,
        );
        app.waitForLoad();
        cy.testA11y(pageTitle.PipelineBuilder);
        break;
      case 'Yaml':
      case addOptions.YAML:
        cy.byTestID('item import-yaml').click();
        cy.get('[data-mode-id="yaml"]').should('be.visible');
        app.waitForLoad();
        cy.testA11y(pageTitle.YAML);
        break;
      case 'Channel':
      case addOptions.Channel:
        cy.byTestID('item knative-eventing-channel').click();
        app.waitForLoad();
        detailsPage.titleShouldContain(pageTitle.Channel);
        cy.testA11y(pageTitle.Channel);
        break;
      case addOptions.DevFile:
        cy.byTestID('item import-from-git').click();
        app.waitForLoad();
        detailsPage.titleShouldContain(pageTitle.Git);
        cy.testA11y(pageTitle.Git);
        break;
      case addOptions.UploadJARFile:
        cy.byTestID('item upload-jar').click();
        app.waitForLoad();
        detailsPage.titleShouldContain(pageTitle.UploadJarFile);
        cy.testA11y(pageTitle.UploadJarFile);
        break;
      case 'Broker':
      case addOptions.Broker:
        cy.byTestID('item knative-eventing-broker').click();
        detailsPage.titleShouldContain(pageTitle.Broker);
        cy.testA11y(pageTitle.Broker);
        break;
      default:
        throw new Error(`Unable to find the "${card}" card on Add page`);
    }
  },
  verifyCard: (cardName: string) => cy.get(cardTitle).should('contain.text', cardName),
  setBuildEnvField: (envKey: string, value: string) =>
    cy
      .get(`#form-input-image-imageEnv-${envKey}-field`)
      .scrollIntoView()
      .should('be.visible')
      .clear()
      .type(value),
};

export const verifyAddPage = {
  verifyAddPageCard: (card: addOptions | string) => {
    app.waitForDocumentLoad();
    switch (card) {
      case 'Git Repository':
        cy.byTestID('card git-repository').should('be.visible');
        break;
      case 'Developer Catalog':
        cy.byTestID('card developer-catalog').should('be.visible');
        break;
      case 'Container images':
        cy.byTestID('card container-images').should('be.visible');
        break;
      case 'From Local Machine':
        cy.byTestID('card local-machine').should('be.visible');
        break;
      case 'Pipeline':
        cy.byTestID('item pipeline').should('be.visible');
        break;
      case 'Pipelines':
        cy.byTestID('card pipelines').should('be.visible');
        break;
      case 'Samples':
        cy.byTestID('card samples').should('be.visible');
        break;
      case 'Eventing':
        cy.byTestID('card eventing').should('be.visible');
        break;
      case 'Channel':
        cy.byTestID('item knative-eventing-channel').should('be.visible');
        break;
      case 'All services':
        cy.byTestID('item dev-catalog').should('be.visible');
        break;
      case 'Database':
        cy.byTestID('item dev-catalog-databases').should('be.visible');
        break;
      case 'Operator Backed':
        cy.byTestID('item operator-backed').should('be.visible');
        break;
      case 'Helm Chart':
        cy.byTestID('item helm').should('be.visible');
        break;
      case 'Event Source':
        cy.byTestID('item knative-event-source').should('be.visible');
        break;
      case 'Import from Git':
        cy.byTestID('item import-from-git').should('be.visible');
        break;
      // TODO (ODC-6455): Tests should use latest UI labels like "Import from Git" instead of mapping strings
      case 'From Git':
        cy.byTestID('item import-from-git').should('be.visible');
        break;
      // TODO (ODC-6455): Tests should use latest UI labels like "Import from Git" instead of mapping strings
      case 'From Devfile':
        cy.byTestID('item import-from-git').should('be.visible');
        break;
      // TODO (ODC-6455): Tests should use latest UI labels like "Import from Git" instead of mapping strings
      case 'From Dockerfile':
        cy.byTestID('item import-from-git').should('be.visible');
        break;
      case 'Import YAML':
        cy.byTestID('item import-yaml').should('be.visible');
        break;
      case 'Upload JAR file':
        cy.byTestID('item upload-jar').should('be.visible');
        break;
      default:
        throw new Error(`Unable to find the "${card}" card on Add page`);
    }
  },
};
