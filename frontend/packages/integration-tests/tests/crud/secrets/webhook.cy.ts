import { checkErrors, testName } from '../../../support';
import { detailsPage } from '../../../views/details-page';
import { secrets } from '../../../views/secret';

describe('Webhook secret', () => {
  const webhookSecretName = `webhook-secret-${testName}`;
  const webhookSecretKey = 'webhookValue';

  before(() => {
    cy.login();
    cy.createProjectWithCLI(testName);
  });

  beforeEach(() => {
    // ensure the test project is selected to avoid flakes
    cy.visit(`/k8s/cluster/projects/${testName}`);
    cy.visit(`/k8s/ns/${testName}/secrets/`);
    secrets.clickCreateSecretDropdownButton('webhook');
  });

  afterEach(() => {
    cy.exec(`oc delete secret -n ${testName} ${webhookSecretName}`, {
      failOnNonZeroExit: false,
    });
    checkErrors();
  });

  after(() => {
    cy.deleteProjectWithCLI(testName);
  });

  it(`Create, edit, and delete a webhook secret`, () => {
    cy.log('Create secret');
    cy.byTestID('page-heading').contains('Create webhook secret');
    secrets.enterSecretName(webhookSecretName);
    cy.byTestID('secret-key').type(webhookSecretKey);
    secrets.save();
    cy.byTestID('loading-indicator').should('not.exist');
    secrets.detailsPageIsLoaded(webhookSecretName);

    cy.log('Verify secret');
    secrets.checkSecret({
      WebHookSecretKey: webhookSecretKey,
    });

    cy.log('Edit secret');
    detailsPage.clickPageActionFromDropdown('Edit Secret');
    // Wait for form to load
    cy.byTestID('page-heading').contains('Edit webhook secret');
    cy.byTestID('webhook-generate-button').should('be.visible');
    cy.byTestID('webhook-generate-button').click();
    secrets.save();
    cy.byTestID('loading-indicator').should('not.exist');

    cy.log('Verify edit');
    secrets.detailsPageIsLoaded(webhookSecretName);
    secrets.clickRevealValues();
    cy.get('.co-copy-to-clipboard__text .co-copy-to-clipboard__code')
      .eq(0)
      .invoke('text')
      .should('not.equal', webhookSecretKey);

    cy.log('Delete secret');
    secrets.deleteSecret(webhookSecretName);
  });
});
