import { Given, When, Then } from 'cypress-cucumber-preprocessor/steps';
import {
  addOptions,
  devNavigationMenu,
} from '@console/dev-console/integration-tests/support/constants';
import { formPO, gitPO } from '@console/dev-console/integration-tests/support/pageObjects';
import {
  addPage,
  app,
  createForm,
  createGitWorkload,
  createGitWorkloadWithResourceLimit,
  gitPage,
  navigateTo,
  topologyActions,
  topologyPage,
  topologySidePane,
} from '@console/dev-console/integration-tests/support/pages';
import { hpaPO } from '../../pageObjects';

Given('user has created a deployment workload {string}', (componentName: string) => {
  navigateTo(devNavigationMenu.Add);
  createGitWorkload(
    'https://github.com/sclorg/nodejs-ex.git',
    componentName,
    'Deployment',
    'nodejs-ex-git-app',
  );
});

Given('user has created a deployment config workload {string}', (componentName: string) => {
  navigateTo(devNavigationMenu.Add);
  createGitWorkload(
    'https://github.com/sclorg/nodejs-ex.git',
    componentName,
    'Deployment Config',
    'nodejs-ex-git-app',
  );
});

When('user right clicks on the node {string} to open context menu', (nodeName: string) => {
  topologyPage.rightClickOnNode(nodeName);
});

Then('user will be redirected to topology with knative workload {string}', (nodeName: string) => {
  topologyPage.verifyWorkloadInTopologyPage(nodeName);
});

When('user clicks on kebab button {string} to open kebab menu', (nodeName: string) => {
  cy.get('input[data-test-id="item-filter"]').should('be.visible').clear().type(nodeName);
  // eslint-disable-next-line cypress/no-unnecessary-waiting
  cy.wait(2000);
  cy.byLegacyTestID('kebab-button').eq(0).click();
});

export const checkBuildComplete = (tries: number = 4) => {
  if (tries < 1) {
    return;
  }
  // eslint-disable-next-line promise/catch-or-return
  cy.get('body').then(($body) => {
    if ($body.find('.build-overview__status svg title').length === 0) {
      cy.reload();
      app.waitForDocumentLoad();
      // eslint-disable-next-line cypress/no-unnecessary-waiting
      cy.wait(30000);
      checkBuildComplete(tries - 1);
    } else {
      cy.log('COMPLETE');
    }
  });
};

Given('user clicks on {string} to verify that build is completed', (nodeName) => {
  topologyPage.clickOnNode(nodeName);
  topologySidePane.selectTab('Resources');
  checkBuildComplete();
  cy.byLegacyTestID('sidebar-close-button').click();
});

Given('user selects option {string} from context options', (option) => {
  cy.get(`[data-test-action="${option}"]`, { timeout: 180000 }).click();
});

Given('user selects option {string} from kebab options', (option) => {
  cy.get(`[data-test-action="${option}"]`, { timeout: 120000 }).click();
});

Given('user is at Deployments page', () => {
  navigateTo(devNavigationMenu.Deployments);
});

Given('user has created deployment workload {string} with no Route defined', (nodeName: string) => {
  navigateTo(devNavigationMenu.Add);
  addPage.selectCardFromOptions(addOptions.ContainerImage);
  cy.byLegacyTestID('deploy-image-search-term').clear().type(`openshift/${nodeName}`);
  cy.get('#form-input-searchTerm-field-helper').should('have.text', 'Validated');
  cy.get(gitPO.resourcesDropdown).scrollIntoView().click();
  cy.get(gitPO.resources.deployment).scrollIntoView().click();
  cy.get('#form-checkbox-route-create-field').uncheck();
  cy.byLegacyTestID('submit-button').click();
  topologyPage.verifyWorkloadInTopologyPage(nodeName);
});

Then(
  'user can see Routes available in the Resources tab of sidebar for knative workload {string}',
  (nodeName: string) => {
    topologyPage.knativeNode(nodeName).click({ force: true });
    cy.get('.sidebar__section-heading').contains('Routes');
    cy.get('[class="co-external-link co-external-link--block"]').should('be.visible');
  },
);

Given(
  'user has created knative workload {string} from deployment {string}',
  (knativeNodeName: string, nodeName: string) => {
    topologyPage.clickOnNode(nodeName);
    topologySidePane.selectTab('Resources');
    checkBuildComplete();
    cy.byLegacyTestID('sidebar-close-button').click();
    topologyPage.clickOnNode(nodeName);
    cy.byLegacyTestID('actions-menu-button').click();
    topologyActions.selectAction('Make Serverless');
    gitPage.enterComponentName(knativeNodeName);
    cy.get(formPO.save).click({ force: true });
    topologyPage.verifyWorkloadInTopologyPage(nodeName);
    topologyPage.verifyWorkloadInTopologyPage(knativeNodeName);
  },
);

When('user clicks on Scaling in Advanced option of Import from Git form', () => {
  cy.get('body').contains('Scaling').click();
});

When('user scales value of Concurrency utilization to {string}', (value: string) => {
  cy.get('#form-number-spinner-serverless-scaling-concurrencyutilization-field')
    .clear()
    .type(value)
    .should('have.value', value);
});

When(
  'user right clicks on the knative service workoad {string} in Topology page',
  (nodeName: string) => {
    topologyPage.rightClickOnKnativeNode(nodeName);
  },
);

When('user clicks on save button', () => {
  createForm.clickCreate();
});

Given(
  'user has created a deployment workload {string} with CPU resource limit {string} and Memory resource limit {string}',
  (workloadName: string, limitCPU: string, limitMemory: string) => {
    navigateTo(devNavigationMenu.Add);
    createGitWorkloadWithResourceLimit(
      'https://github.com/sclorg/nodejs-ex.git',
      workloadName,
      'Deployment',
      'nodejs-ex-git-app',
      limitCPU,
      limitMemory,
    );
  },
);

Given(
  'user has added HPA to workload {string} with Min and Max pod value as {string} and {string} respectively with CPU and Memory utilisation values as {string} and {string} respectively',
  (nodeName: string, minPod: string, maxPod: string, cpuUtil: string, memoryUtil: string) => {
    topologyPage.rightClickOnNode(nodeName);
    cy.get(hpaPO.addHPA, { timeout: 120000 }).click();
    cy.get(hpaPO.minhpaPod).clear().type(minPod);
    cy.get(hpaPO.maxhpaPod).clear().type(maxPod);
    cy.get(hpaPO.cpu).clear().type(cpuUtil);
    cy.get(hpaPO.memory).clear().type(memoryUtil);
    cy.byLegacyTestID('submit-button').click();
  },
);

export const checkPodRunning = (tries: number = 3) => {
  if (tries < 1) {
    return;
  }
  // eslint-disable-next-line promise/catch-or-return
  cy.get('body').then(($body) => {
    if ($body.find('[data-test="status-text"]').text() !== 'Running') {
      cy.reload();
      app.waitForDocumentLoad();
      // eslint-disable-next-line cypress/no-unnecessary-waiting
      cy.wait(30000);
      checkPodRunning(tries - 1);
    } else {
      cy.log('Running');
    }
  });
};

When('user clicks on {string} to check pod is running', (nodeName: string) => {
  topologyPage.clickOnNode(nodeName);
  topologySidePane.selectTab('Resources');
  checkPodRunning();
  cy.byLegacyTestID('sidebar-close-button').click();
  cy.reload();
});

When(
  'user right clicks on the knative workload {string} to open the Context Menu',
  (nodeName: string) => {
    navigateTo(devNavigationMenu.Topology);
    topologyPage.getKnativeNode(nodeName).trigger('contextmenu', { force: true });
  },
);

Then('user is able to see value of {string} as {string}', (util: string, utilValue: string) => {
  cy.get('.ocs-yaml-editor__wrapper').contains(`${util}: '${utilValue}'`).should('be.visible');
});

Then(
  'user is able to see the value of {string} and {string} as {string} and {string} percent respectively',
  (maxScale: string, minScale: string, minScaleValue: string, maxScaleValue: string) => {
    cy.get('.ocs-yaml-editor__wrapper')
      .contains(`${maxScale}: '${maxScaleValue}'`)
      .should('be.visible');

    cy.get('.ocs-yaml-editor__wrapper')
      .contains(`${minScale}: '${minScaleValue}'`)
      .should('be.visible');
  },
);
