import { Given, When, Then } from 'cypress-cucumber-preprocessor/steps';
import { modal } from '@console/cypress-integration-tests/views/modal';
import {
  switchPerspective,
  devNavigationMenu,
  operators,
  resourceTypes,
} from '@console/dev-console/integration-tests/support/constants';
import {
  operatorsPO,
  topologyPO,
} from '@console/dev-console/integration-tests/support/pageObjects';
import {
  perspective,
  projectNameSpace,
  navigateTo,
  installOperator,
  operatorsPage,
  topologyPage,
  createGitWorkloadIfNotExistsOnTopologyPage,
  createEventSourcePage,
  createChannel,
  verifyAndInstallOperator,
  app,
  installKnativeOperatorUsingCLI,
  installRedHatIntegrationCamelKOperatorUsingCLI,
} from '@console/dev-console/integration-tests/support/pages';
import { checkDeveloperPerspective } from '@console/dev-console/integration-tests/support/pages/functions/checkDeveloperPerspective';
import { eventingPO } from '@console/knative-plugin/integration-tests/support/pageObjects/global-po';
import { userLoginPage } from '../../pages/dev-perspective/common';
import { topologyAdminPerspective } from './functions/topology-admin-perspective';

Given('user has logged in as a basic user', () => {
  app.waitForDocumentLoad();
  userLoginPage.nonAdminUserlogin();
});

Given('user is at developer perspective', () => {
  checkDeveloperPerspective();
  perspective.switchTo(switchPerspective.Developer);
});

Given('user is at administrator perspective', () => {
  perspective.switchTo(switchPerspective.Administrator);
  // cy.testA11y('Administrator perspective');
});

Given('user has created or selected namespace {string}', (projectName: string) => {
  Cypress.env('NAMESPACE', projectName);
  projectNameSpace.selectOrCreateProject(`${projectName}`);
});

Given('user is at pipelines page', () => {
  checkDeveloperPerspective();
  navigateTo(devNavigationMenu.Pipelines);
});

Given('user is at Topology page', () => {
  navigateTo(devNavigationMenu.Topology);
});

Given('user is at Topology page in the admin view', () => {
  topologyAdminPerspective();
});

Given('user is at Monitoring page', () => {
  navigateTo(devNavigationMenu.Observe);
});

When('user clicks create button', () => {
  cy.get('button[type="submit"]').click();
});

When('user selects {string} from Context Menu', (menuOption: string) => {
  topologyPage.selectContextMenuAction(menuOption);
});

Given('user has installed eventing operator', () => {
  perspective.switchTo(switchPerspective.Administrator);
  operatorsPage.navigateToInstallOperatorsPage();
  operatorsPage.searchOperatorInInstallPage(operators.ServerlessOperator);
  cy.get('body', {
    timeout: 50000,
  }).then(($ele) => {
    if ($ele.find(operatorsPO.installOperators.noOperatorsFound)) {
      installOperator(operators.ServerlessOperator);
    } else {
      cy.log('Eventing operator is installed in cluster');
    }
  });
});

Given('user has installed Red Hat Integration - Camel K Operator', () => {
  installRedHatIntegrationCamelKOperatorUsingCLI();
});

Given('user has installed Red Hat Integration - AMQ Streams operator', () => {
  perspective.switchTo(switchPerspective.Administrator);
  operatorsPage.navigateToInstallOperatorsPage();
  operatorsPage.searchOperatorInInstallPage(operators.AMQStreams);
  cy.get('body', {
    timeout: 50000,
  }).then(($ele) => {
    if ($ele.find(operatorsPO.installOperators.noOperatorsFound)) {
      installOperator(operators.AMQStreams);
    } else {
      cy.log(`${operators.AMQStreams} operator is installed in cluster`);
    }
  });
});

Given('user has installed Knative Apache Kafka Operator', () => {
  perspective.switchTo(switchPerspective.Administrator);
  operatorsPage.navigateToInstallOperatorsPage();
  operatorsPage.searchOperatorInInstallPage(operators.ApacheKafka);
  cy.get('body', {
    timeout: 50000,
  }).then(($ele) => {
    if ($ele.find(operatorsPO.installOperators.noOperatorsFound)) {
      installOperator(operators.ApacheKafka);
    } else {
      cy.log(`${operators.ApacheKafka} operator is installed in cluster`);
    }
  });
});

Given(
  'user has created Sink Binding event source {string} with knative resource {string}',
  (eventSourceName: string, resourceName: string) => {
    createEventSourcePage.createSinkBindingIfNotExistsOnTopologyPage(eventSourceName, resourceName);
  },
);

Given('user has created knative service {string}', (knativeServiceName: string) => {
  perspective.switchTo(switchPerspective.Developer);
  createGitWorkloadIfNotExistsOnTopologyPage(
    'https://github.com/sclorg/nodejs-ex.git',
    knativeServiceName,
    resourceTypes.knativeService,
  );
});

Given('user has created knative service {string} in admin', (knativeServiceName: string) => {
  perspective.switchTo(switchPerspective.Administrator);
  createGitWorkloadIfNotExistsOnTopologyPage(
    'https://github.com/sclorg/nodejs-ex.git',
    knativeServiceName,
    resourceTypes.knativeService,
  );
});

Given(
  'user has created knative revision with knative service {string}',
  (knativeServiceName: string) => {
    createGitWorkloadIfNotExistsOnTopologyPage(
      'https://github.com/sclorg/nodejs-ex.git',
      knativeServiceName,
      resourceTypes.knativeService,
    );
    topologyPage.waitForKnativeRevision();
  },
);

Then('modal with {string} appears', (header: string) => {
  modal.modalTitleShouldContain(header);
});

Given('user has installed OpenShift Serverless Operator', () => {
  installKnativeOperatorUsingCLI();
});

Given('user has created channel {string}', (channelName: string) => {
  createChannel(channelName);
});

Given('user is at eventing page', () => {
  operatorsPage.navigateToEventingPage();
});

Given('user is at Serving page', () => {
  operatorsPage.navigateToServingPage();
});

When('user clicks on Create dropdown button', () => {
  cy.get(eventingPO.createEventDropDownMenu).contains('Create').click({ force: true });
});

When('user clicks on List view button', () => {
  navigateTo(devNavigationMenu.Topology);
  if (cy.get(topologyPO.graph.emptyGraph)) {
    cy.get(topologyPO.switcher).click();
  } else {
    cy.log('You are already on List View');
  }
});

Given('user has installed RHOAS operator', () => {
  verifyAndInstallOperator(operators.RHOAS);
});
