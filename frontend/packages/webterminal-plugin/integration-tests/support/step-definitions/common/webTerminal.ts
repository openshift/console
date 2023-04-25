import { Given, When, Then, And } from 'cypress-cucumber-preprocessor/steps';
import { guidedTour } from '@console/cypress-integration-tests/views/guided-tour';
import { switchPerspective } from '@console/dev-console/integration-tests/support/constants';
import { devNavigationMenuPO } from '@console/dev-console/integration-tests/support/pageObjects';
import {
  perspective,
  projectNameSpace,
} from '@console/dev-console/integration-tests/support/pages';
import { checkTerminalIcon } from '@console/dev-console/integration-tests/support/pages/functions/checkTerminalIcon';
import { webTerminalPage } from '@console/webterminal-plugin/integration-tests/support/step-definitions/pages/web-terminal/webTerminal-page';

const idp = Cypress.env('BRIDGE_HTPASSWD_IDP') || 'consoledeveloper';
const username = Cypress.env('BRIDGE_HTPASSWD_USERNAME') || 'consoledeveloper';
const password = Cypress.env('BRIDGE_HTPASSWD_PASSWORD') || 'developer';
const kubeAdmUserName = Cypress.env('KUBEADMIN_NAME') || 'kubeadmin';
const kubeAdmUserPass = Cypress.env('BRIDGE_KUBEADMIN_PASSWORD');

// create web terminal instance in dedicated namespace  under basic user and relogin as admin with oc client
function installDevWsAndReconfigureIdlingTimeout(dedicatedNamespace: string) {
  // we need to create an active terminal session in background before test, also
  // we rewrite default idling timeout for the terminal (because 15 min - too long change it to 1 min)
  try {
    cy.exec(`oc login -u ${username}  -p ${password} --insecure-skip-tls-verify`);
    cy.exec(`oc new-project  ${dedicatedNamespace}`);
    cy.exec(`oc apply -f testData/yamls/web-terminal/web-terminal.yaml -n ${dedicatedNamespace}`);
    cy.exec(`oc login -u ${kubeAdmUserName}  -p ${kubeAdmUserPass} --insecure-skip-tls-verify`);
  } catch (err) {
    // relogin as admin if something went wrong
    cy.exec(`oc login -u ${kubeAdmUserName}  -p ${kubeAdmUserPass} --insecure-skip-tls-verify`);
    throw err;
  }
  // override the default idling timeout from 15 minutes to 1 minute
  cy.exec(
    'oc apply -f testData/yamls/web-terminal/dev-ws-custom-idling-config.yaml -n openshift-operators',
  );
}

Given('user can see terminal icon on masthead', () => {
  checkTerminalIcon();

  webTerminalPage.verifyCloudShellBtn();
});

When('user clicks on the Web Terminal icon on the Masthead', () => {
  webTerminalPage.clickOpenCloudShellBtn();
});

Then('user will see the terminal window', () => {
  webTerminalPage.verifyConnectionRediness();
});

// check  existing of web terminal in the dedicated project. Create it for the correct checking if a webterminal instance is not existed.
// It needs the web-terminal-basic.feature
Given('user has installed webTerminal in namespace {string}', (namespace: string) => {
  let devWsExistingOutput: string = '';
  cy.exec(`oc get DevWorkspace -n ${namespace}`, { failOnNonZeroExit: false })
    .then((result) => {
      devWsExistingOutput = result.stderr;
    })
    .then(() => {
      if (
        devWsExistingOutput.startsWith('No resources found') ||
        devWsExistingOutput.includes('Forbidden')
      ) {
        installDevWsAndReconfigureIdlingTimeout(namespace);
      }
    });
});

And('user has logged in as basic user', () => {
  cy.logout();
  cy.login(idp, username, password);
  // sometimes guide tour is not closed properly without delay
  cy.wait(1000);
  guidedTour.close();
  perspective.switchTo(switchPerspective.Developer);
  cy.get(devNavigationMenuPO.project).click();
});

Given('user is at developer perspective', () => {
  perspective.switchTo(switchPerspective.Developer);
});

Given('user has created or selected namespace {string}', (projectName: string) => {
  Cypress.env('NAMESPACE', projectName);
  projectNameSpace.selectOrCreateProject(`${projectName}`);
});
