import { When, Then } from 'cypress-cucumber-preprocessor/steps';
import * as jsonEditor from '@console/cypress-integration-tests/views/yaml-editor';
import { topologyPO } from '@console/topology/integration-tests/support/page-objects/topology-po';
import { topologyPage } from '@console/topology/integration-tests/support/pages/topology';
import { reloadPageUntilWorkloadIsDisplayed } from '../../pages/dev-perspective/test-serverless-function-page';

When(
  'user sees workload {string} along with a revision in topology page',
  (workloadName: string) => {
    topologyPage.verifyWorkloadInTopologyPage(workloadName);
    cy.get(topologyPO.quickSearchPO.listView).click();
    reloadPageUntilWorkloadIsDisplayed(workloadName);
    cy.get(topologyPO.quickSearchPO.graphView).click();
  },
);

When('user selects option {string} from Actions menu', (action: string) => {
  cy.byLegacyTestID('actions-menu-button').click();
  cy.byTestActionID(action).should('be.visible').click();
});

When('user sees the Test Serverless Function modal', () => {
  cy.byTestID('test-serverless-function').should('be.visible');
});

When('user selects {string} from the Format drop down field', (invokeFormat: string) => {
  cy.byTestID('invoke-format-dropdown').should('be.visible').click();
  cy.get(`[data-test-dropdown-menu="${invokeFormat}"]`).click();
});

When('user clicks on the "Advanced Settings" option', () => {
  cy.byTestID('advanced-settings').find('.pf-c-expandable-section__toggle').click();
});

When('user enters the {string} in the Type field', (type: string) => {
  cy.byTestID('request-type').click().type(type);
});
When('user enters the {string} in the Source field', (source: string) => {
  cy.byTestID('request-source').click().type(source);
});

When(
  'user clicks on Add optional headers and enter {string} under Name and {string} under Value',
  (name, value: string) => {
    cy.byTestID('add-optional-header').click();
    cy.byTestID('pairs-list-name').click().type(name);
    cy.byTestID('pairs-list-value').click().type(value);
  },
);

When(
  'user pastes the {string} code in {string} in the editor',
  (jsonFile: string, invokeFormat: string) => {
    cy.fixture(`test-serverless-fn/${jsonFile}-${invokeFormat.toLowerCase()}.json`).then((json) => {
      jsonEditor.setEditorContent(JSON.stringify(json, null, 2));
    });
  },
);

When('user clicks the {string} Button', (button: string) => {
  cy.byTestID(`${button.toLowerCase()}-action`).eq(0).should('be.visible').click();
});

Then('user is able to see a Success Alert', () => {
  cy.byTestID('alert-wait').should('not.exist');
  cy.byTestID('alert-success').should('be.visible');
});

Then(
  'user is able to see the Response Body as {string} code for the {string} format',
  (jsonFile: string, invokeFormat: string) => {
    cy.byTestID('loading-indicator').should('not.exist');
    jsonEditor.getEditorContent().then((content) => {
      cy.fixture(`test-serverless-fn/${jsonFile}-${invokeFormat.toLowerCase()}.json`).then(
        (json) => {
          (expect(JSON.parse(content)) as any).to.deep.equal(json);
        },
      );
    });
  },
);
