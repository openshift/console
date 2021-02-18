import { Given, When } from 'cypress-cucumber-preprocessor/steps';
import {
  perspective,
  projectNameSpace,
  navigateTo,
} from '@console/dev-console/integration-tests/support/pages/app';
import {
  switchPerspective,
  operators,
  devNavigationMenu,
} from '@console/dev-console/integration-tests/support/constants/global';
import { guidedTour } from '../../../../../integration-tests-cypress/views/guided-tour';
import { nav } from '../../../../../integration-tests-cypress/views/nav';
import { perspectiveName } from '@console/dev-console/integration-tests/support/constants/staticText/global-text';
import { operatorsPO } from '@console/dev-console/integration-tests/support/pageObjects/operators-po';
import { installOperator } from '@console/dev-console/integration-tests/support/pages/functions/installOperatorOnCluster';
import { operatorsPage } from '@console/dev-console/integration-tests/support/pages/operators-page';
import { topologyPage } from '@console/dev-console/integration-tests/support/pages/topology/topology-page';
import { topologyPO } from '@console/dev-console/integration-tests/support/pageObjects/topology-po';
import { createGitWorkload } from '@console/dev-console/integration-tests/support/pages/functions/createGitWorkload';
import { resourceTypes } from '@console/dev-console/integration-tests/support/constants/add';

Given('user is at developer perspective', () => {
  perspective.switchTo(switchPerspective.Developer);
  // Bug: 1890676 is created related to Accessibility violation - Until bug fix, below line is commented to execute the scripts in CI
  // cy.testA11y('Developer perspective with guider tour modal');
  guidedTour.close();
  nav.sidenav.switcher.shouldHaveText(perspectiveName.developer);
  // Bug: 1890678 is created related to Accessibility violation - Until bug fix, below line is commented to execute the scripts in CI
  // cy.testA11y('Developer perspective');
});

Given('user is at administrator perspective', () => {
  perspective.switchTo(switchPerspective.Administrator);
  nav.sidenav.switcher.shouldHaveText(perspectiveName.administrator);
  cy.testA11y('Administrator perspective');
});

Given('user has created or selected namespace {string}', (projectName: string) => {
  Cypress.env('NAMESPACE', projectName);
  projectNameSpace.selectOrCreateProject(`${projectName}`);
  cy.log(`User has selected namespace "${projectName}"`);
});

Given('user is at pipelines page', () => {
  navigateTo(devNavigationMenu.Pipelines);
});

Given('user is at Monitoring page', () => {
  navigateTo(devNavigationMenu.Monitoring);
});

When('user clicks create button', () => {
  cy.get('button[type="submit"]').click();
});

Given('user has installed eventing operator', () => {
  perspective.switchTo(switchPerspective.Administrator);
  nav.sidenav.switcher.shouldHaveText(perspectiveName.administrator);
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
  nav.sidenav.switcher.shouldHaveText(perspectiveName.administrator);
  operatorsPage.navigateToInstallOperatorsPage();
  operatorsPage.searchOperator(operators.knativeApacheCamelOperator);
  cy.get('body', {
    timeout: 50000,
  }).then(($ele) => {
    if ($ele.find(operatorsPO.installOperators.noOperatorsFound)) {
      installOperator(operators.knativeApacheCamelOperator);
    } else {
      cy.log(`${operators.knativeApacheCamelOperator} operator is installed in cluster`);
    }
  });
});

Given('user has installed Knative Apache Camelk Integration Operator', () => {
  perspective.switchTo(switchPerspective.Administrator);
  nav.sidenav.switcher.shouldHaveText(perspectiveName.administrator);
  operatorsPage.navigateToInstallOperatorsPage();
  operatorsPage.searchOperator(operators.RedHatCamelKOperator);
  cy.get('body', {
    timeout: 50000,
  }).then(($ele) => {
    if ($ele.find(operatorsPO.installOperators.noOperatorsFound)) {
      installOperator(operators.RedHatCamelKOperator);
    } else {
      cy.log(`${operators.RedHatCamelKOperator} operator is installed in cluster`);
    }
  });
});

Given('user has installed Knative Apache Kafka Operator', () => {
  perspective.switchTo(switchPerspective.Administrator);
  nav.sidenav.switcher.shouldHaveText(perspectiveName.administrator);
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
  'knative service named {string} is higlighted on topology page',
  (knativeServiceName: string) => {
    navigateTo(devNavigationMenu.Topology);
    cy.get('#content-scrollable').then(($body) => {
      topologyPage.waitForLoad();
      if ($body.find(topologyPO.search).length) {
        topologyPage.search(knativeServiceName);
        if ($body.find(topologyPO.highlightNode).length === 0) {
          navigateTo(devNavigationMenu.Add);
          createGitWorkload(
            'https://github.com/sclorg/nodejs-ex.git',
            knativeServiceName,
            resourceTypes.knativeService,
          );
          topologyPage.verifyWorkloadInTopologyPage(knativeServiceName);
          topologyPage.waitForKnativeRevision();
        }
      } else {
        navigateTo(devNavigationMenu.Add);
        createGitWorkload(
          'https://github.com/sclorg/nodejs-ex.git',
          knativeServiceName,
          resourceTypes.knativeService,
        );
        topologyPage.verifyWorkloadInTopologyPage(knativeServiceName);
        topologyPage.waitForKnativeRevision();
      }
    });
  },
);
