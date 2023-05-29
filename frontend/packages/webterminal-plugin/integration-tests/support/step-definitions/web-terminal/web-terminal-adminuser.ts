import { Given, When, Then, And } from 'cypress-cucumber-preprocessor/steps';
import { nav } from '@console/cypress-integration-tests/views/nav';
import {
  switchPerspective,
  devWorkspaceStatuses,
} from '@console/dev-console/integration-tests/support/constants';
import { webTerminalPO } from '@console/dev-console/integration-tests/support/pageObjects/web-terminal-po';
import {
  perspective,
  projectNameSpace,
} from '@console/dev-console/integration-tests/support/pages';
import { devWorkspacePage } from '@console/dev-console/integration-tests/support/pages/devworspace/devworkspacePage';
import {
  addTerminals,
  closeTerminal,
} from '@console/dev-console/integration-tests/support/pages/functions/addTerminalTabs';
import { checkTerminalIcon } from '@console/dev-console/integration-tests/support/pages/functions/checkTerminalIcon';
import { operatorsPage } from '@console/dev-console/integration-tests/support/pages/operators-page';
import { searchResource } from '@console/dev-console/integration-tests/support/pages/search-resources/search-page';

Given('user has logged in as admin user', () => {
  perspective.switchTo(switchPerspective.Administrator);
  nav.sidenav.switcher.shouldHaveText(switchPerspective.Administrator);
});

Given('user can see terminal icon on masthead', () => {
  checkTerminalIcon();
  cy.get(webTerminalPO.webTerminalIcon).should('be.visible');
});

When('user clicks on the Web Terminal icon on the Masthead', () => {
  cy.get(webTerminalPO.webTerminalIcon).click();
});

When('user clicks advanced option for Timeout', () => {
  cy.get('[role="tabpanel"] button.pf-c-button.pf-m-link.pf-m-inline').contains('Timeout').click();
});

When('user sets timeout to 1 Minute', () => {
  cy.byLegacyTestID('Increment').click();
});

When('user opens {int} additional web terminal tabs', (n: number) => {
  addTerminals(n);
});

When('user closed {string} web terminal tab', (n: string) => {
  closeTerminal(n);
});

Then('user is able see {int} web terminal tabs', (n: number) => {
  cy.get(webTerminalPO.tabsList).then(($el) => {
    expect($el.prop('children').length).toEqual(n + 1);
  });
});

Then('user will get created DevWorkspace instance in {string} namespace', (namespace: string) => {
  searchResource.searchResourceByNameAsAdmin('DevWorkspace');
  searchResource.verifyItemInSearchResultsByPreffixName(namespace);
  searchResource.selectSearchedItem('terminal');
  devWorkspacePage.verifyDevWsResourceStatus(devWorkspaceStatuses.running);
});

And(
  'user ID obtained by API should match with user id in yaml editor for {string} namespace',
  (terminalNamespace: string) => {
    let k8sUserId: string = '';
    const devWsNamePrefURI = `/workspace.devfile.io/v1alpha1/namespaces/${terminalNamespace}/devworkspaces`;
    let devWsName: string = '';
    const baseUrl = Cypress.config('baseUrl');
    const apiPrefURI = `${baseUrl}/api/kubernetes/apis`;
    const linkToYamlEditorPrefURI = `${baseUrl}/k8s/ns/${terminalNamespace}/workspace.devfile.io~v1alpha1~DevWorkspace/`;

    // get the devworkspace name from resource title
    cy.get(`[data-test-id=resource-title]`)
      .should('be.visible')
      .then(($item) => {
        devWsName = $item.text();
      });
    // get user ID with the Cypress request to k8s API
    cy.request(apiPrefURI + devWsNamePrefURI)
      .then((responce) => {
        k8sUserId = responce.body.items[0].metadata.uid;
      })
      // go to the yaml editor by direct URL  and assert user ids in the editor and obteined with API request
      .then(() => {
        cy.visit(`${linkToYamlEditorPrefURI}${devWsName}/yaml`);
      })
      .then(() => {
        cy.get('div.lines-content.monaco-editor-background').should('include.text', k8sUserId);
      });
  },
);

Then('user will see the terminal instance for namespace {string}', (nameSpace: string) => {
  operatorsPage.navigateToInstallOperatorsPage();
  // verifyWebTerminalAvailability();
  projectNameSpace.selectProject(nameSpace);
  searchResource.searchResourceByNameAsAdmin('DevWorkspace');
  searchResource.selectSearchedItem('terminal');
  devWorkspacePage.verifyDevWsResourceStatus(devWorkspaceStatuses.running);
});
