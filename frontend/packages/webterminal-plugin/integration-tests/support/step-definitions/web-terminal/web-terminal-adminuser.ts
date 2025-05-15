import { Given, When, Then, And } from 'cypress-cucumber-preprocessor/steps';
import { guidedTour } from '@console/cypress-integration-tests/views/guided-tour';
import { nav } from '@console/cypress-integration-tests/views/nav';
import {
  switchPerspective,
  devWorkspaceStatuses,
} from '@console/dev-console/integration-tests/support/constants';
import { webTerminalPO } from '@console/dev-console/integration-tests/support/pageObjects/webterminal-po';
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
import { webTerminalPage } from '../pages/web-terminal/webTerminal-page';

Given('user has logged in as admin user', () => {
  cy.login();
  perspective.switchTo(switchPerspective.Administrator);
  nav.sidenav.switcher.shouldHaveText(switchPerspective.Administrator);
  guidedTour.close();
});

Given('user has closed existing terminal workspace', () => {
  searchResource.searchResourceByNameAsAdmin('DevWorkspace');
  cy.get('.loading-box').then(($body) => {
    if ($body.find('[data-test="empty-box-body"]').length === 0) {
      cy.log($body.find('[data-test="empty-box-body"]').length.toString());
      searchResource.selectSearchedItem('terminal');
      webTerminalPage.deleteTerminalInstanceActionMenu();
    } else {
      cy.log('No DevWorkspaces found');
    }
  });
});

Given('user can see terminal icon on masthead', () => {
  checkTerminalIcon();
  cy.get(webTerminalPO.webTerminalIcon).should('be.visible');
});

When('user clicks on the Web Terminal icon on the Masthead', () => {
  cy.get(webTerminalPO.webTerminalIcon).click();
  cy.get('cos-status-box cos-status-box--loading').should('not.exist');
});

When('user clicks advanced option for Timeout', () => {
  cy.get('[role="tabpanel"] button').contains('Timeout').should('be.visible').click();
});

When('user sets timeout to {string} Minute', (time: string) => {
  cy.byLegacyTestID('Increment').click();
  cy.get('input[aria-label="Input"]').should('not.have.value', '0');
  cy.get('input[aria-label="Input"]').clear().invoke('val', time).trigger('change');
  cy.get('input[aria-label="Input"]').should('have.value', time);
});

When('user opens {int} additional web terminal tabs', (n: number) => {
  addTerminals(n);
});

When('user closed {string} web terminal tab', (n: string) => {
  closeTerminal(n);
});

When('user closed web terminal window', () => {
  cy.byTestID('cloudshell-drawer-close-button').should('be.visible').click();
  cy.wait(2000);
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
    cy.get('[data-test="page-heading"] h1')
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
  perspective.switchTo(switchPerspective.Administrator);
  operatorsPage.navigateToInstallOperatorsPage();
  // verifyWebTerminalAvailability();
  projectNameSpace.selectProject(nameSpace);
  searchResource.searchResourceByNameAsAdmin('DevWorkspace');
  searchResource.selectSearchedItem('terminal');
  // Disabling following line due to terminal loading issue from backend at the first load
  // devWorkspacePage.verifyDevWsResourceStatus(devWorkspaceStatuses.running);
});

Given('user has created or selected namespace {string}', (projectName: string) => {
  Cypress.env('NAMESPACE', projectName);
  projectNameSpace.selectOrCreateProject(`${projectName}`);
  // cy.get(devNavigationMenuPO.project).click();
});