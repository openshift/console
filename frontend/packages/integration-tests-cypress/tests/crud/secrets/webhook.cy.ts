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
    cy.visit(`/k8s/ns/${testName}/secrets/`);
    secrets.clickCreateSecretDropdownButton('webhook');
  });

  afterEach(() => {
    checkErrors();
  });

  after(() => {
    cy.deleteProjectWithCLI(testName);
  });

  it(`Create, edit, and delete a webhook secret`, () => {
    cy.log('Create secret');
    cy.get('.co-m-pane__heading').contains('Create webhook secret');
    secrets.enterSecretName(webhookSecretName);
    cy.byTestID('secret-key').type(webhookSecretKey);
    secrets.save();
    secrets.detailsPageIsLoaded(webhookSecretName);

    cy.log('Verify secret');
    secrets.checkSecret({
      WebHookSecretKey: webhookSecretKey,
    });

    cy.log('Edit secret');
    detailsPage.clickPageActionFromDropdown('Edit Secret');
    cy.byTestID('webhook-generate-button').click();
    secrets.save();

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
