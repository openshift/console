import { Given, When, Then } from 'cypress-cucumber-preprocessor/steps';
import { modal } from '@console/cypress-integration-tests/views/modal';
import {
  switchPerspective,
  devNavigationMenu,
  operators,
  resourceTypes,
} from '@console/dev-console/integration-tests/support/constants';
import { operatorsPO } from '@console/dev-console/integration-tests/support/pageObjects';
import {
  perspective,
  projectNameSpace,
  navigateTo,
  installOperator,
  operatorsPage,
  topologyPage,
  createGitWorkloadIfNotExistsOnTopologyPage,
  createEventSourcePage,
  verifyAndInstallKnativeOperator,
} from '@console/dev-console/integration-tests/support/pages';

Given('user is at developer perspective', () => {
  perspective.switchTo(switchPerspective.Developer);
});

Given('user is at administrator perspective', () => {
  perspective.switchTo(switchPerspective.Administrator);
  cy.testA11y('Administrator perspective');
});

Given('user has created or selected namespace {string}', (projectName: string) => {
  Cypress.env('NAMESPACE', projectName);
  projectNameSpace.selectOrCreateProject(`${projectName}`);
});

Given('user is at pipelines page', () => {
  navigateTo(devNavigationMenu.Pipelines);
});

Given('user is at Topology page', () => {
  navigateTo(devNavigationMenu.Topology);
});

Given('user is at Monitoring page', () => {
  navigateTo(devNavigationMenu.Monitoring);
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
  operatorsPage.searchOperator(operators.ServerlessOperator);
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

Given('user has installed knative Apache camel operator', () => {
  perspective.switchTo(switchPerspective.Administrator);
  operatorsPage.navigateToInstallOperatorsPage();
  operatorsPage.searchOperator(operators.KnativeApacheCamelOperator);
  cy.get('body', {
    timeout: 50000,
  }).then(($ele) => {
    if ($ele.find(operatorsPO.installOperators.noOperatorsFound)) {
      installOperator(operators.KnativeApacheCamelOperator);
    } else {
      cy.log(`${operators.KnativeApacheCamelOperator} operator is installed in cluster`);
    }
  });
});

Given('user has installed Knative Apache Camelk Integration Operator', () => {
  perspective.switchTo(switchPerspective.Administrator);
  operatorsPage.navigateToInstallOperatorsPage();
  operatorsPage.searchOperator(operators.RedHatIntegrationCamelK);
  cy.get('body', {
    timeout: 50000,
  }).then(($ele) => {
    if ($ele.find(operatorsPO.installOperators.noOperatorsFound)) {
      installOperator(operators.RedHatIntegrationCamelK);
    } else {
      cy.log(`${operators.RedHatIntegrationCamelK} operator is installed in cluster`);
    }
  });
});

Given('user has installed Knative Apache Kafka Operator', () => {
  perspective.switchTo(switchPerspective.Administrator);
  operatorsPage.navigateToInstallOperatorsPage();
  operatorsPage.searchOperator(operators.ApacheKafka);
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
  modal.cancel();
});

Given('user has installed OpenShift Serverless Operator', () => {
  verifyAndInstallKnativeOperator();
});
