import { safeLoadAll } from 'js-yaml';
import { checkErrors } from '../../support';
import { isLocalDevEnvironment } from '../../views/common';
import { detailsPage } from '../../views/details-page';
import { refreshWebConsoleLink } from '../../views/form';
import { listPage } from '../../views/list-page';
import { modal } from '../../views/modal';
import { nav } from '../../views/nav';

const PLUGIN_NAME = 'console-demo-plugin';
const PLUGIN_PATH = '../../../dynamic-demo-plugin';
const PLUGIN_PULL_SPEC = Cypress.env('PLUGIN_PULL_SPEC');
/* The update wait is the value to wait for the poll of /api/check-updates to return with the updated list of plugins
 after the plugin is enabled and loaded. This wait will be longer on ci than when debugging locally. */
const CHECK_UPDATE_WAIT = 300000;
/*
  These tests are meant to:
    1. show how to test a dynamic plugin using demo as the plugin instance
    2. run locally:
      2a. build the plugin locally, and run the server
      2b. using bridge running with the plugin arguments that point to the local dynamic plugin server and i18n namespace
          e.g., ./bin/bridge -plugins=console-demo-plugin=http://localhost:9001 -i18n-namespaces=plugin__console-demo-plugin
      2c. will not use all workload definitions defined in the yaml (not using the env variable for pull spec)
    3. run on ci:
      3a. ci will build the dynamic plugin and provide the pullspec in the env var: CYPRESS_PLUGIN_PULL_SPEC
      3b. that pull spec will be used to create the deployment on the cluster
    4. the scaffolding should remain the same except modifying the constants above
 */

const enableDemoPlugin = (enable: boolean) => {
  // find console demo plugin and enable it
  cy.visit('k8s/cluster/operator.openshift.io~v1~Console/cluster/console-plugins');
  cy.url().should(
    'include',
    'k8s/cluster/operator.openshift.io~v1~Console/cluster/console-plugins',
  );
  cy.get('.co-resource-item__resource-name').byLegacyTestID(PLUGIN_NAME).should('be.visible');
  cy.byLegacyTestID(PLUGIN_NAME)
    .parents('tr')
    .within(() => {
      cy.byTestID('edit-console-plugin').contains(enable ? 'Disabled' : 'Enabled');
      cy.byTestID('edit-console-plugin').click();
    });
  modal.shouldBeOpened();
  cy.contains('Cancel');
  modal.modalTitleShouldContain('Console plugin enablement');
  cy.byTestID(enable ? 'Enable-radio-input' : 'Disable-radio-input').click();
  modal.submit();
  modal.shouldBeClosed();
  cy.byLegacyTestID(PLUGIN_NAME)
    .parents('tr')
    .within(() => {
      cy.byTestID('edit-console-plugin').contains(enable ? 'Enabled' : 'Disabled');
    });
  cy.log(`Running plugin test on ci using PLUGIN_PULL_SPEC: ${PLUGIN_PULL_SPEC}`);
  cy.byTestID(refreshWebConsoleLink, { timeout: CHECK_UPDATE_WAIT })
    .should('exist')
    .then(() => {
      cy.reload();
      if (!enable) {
        cy.byLegacyTestID(PLUGIN_NAME).click();
        detailsPage.titleShouldContain(PLUGIN_NAME);
        detailsPage.clickPageActionFromDropdown('Delete ConsolePlugin');
        modal.shouldBeOpened();
        modal.submit();
      }
    });
};

const dynamicNavTest = (navID: string) => {
  nav.sidenav.clickNavLink(['Demo Plugin', `Dynamic Nav ${navID}`]);
  cy.byTestID('title').should('contain', `Dynamic Page ${navID}`);
  cy.byTestID('alert-info').should('contain', 'Example info alert');
  cy.byTestID('alert-warning').should('contain', 'Example warning alert');
  cy.byTestID('hint').should('contain', 'Example hint');
  cy.byTestID('card').should('contain', 'Example card');
};

const k8sAPINavTest = (apiID: string) => {
  cy.byButtonText(apiID).click();
  cy.get('test-k8api-error').should('not.exist');
  cy.get(`test-k8s-${apiID}`).should('not.be.empty');
};
if (!Cypress.env('OPENSHIFT_CI') || Cypress.env('PLUGIN_PULL_SPEC')) {
  describe('Demo dynamic plugin test', () => {
    before(() => {
      cy.login();
      cy.createProjectWithCLI(PLUGIN_NAME);
      cy.readFile(`${PLUGIN_PATH}/oc-manifest.yaml`).then((textManifest) => {
        const yamlManifest = safeLoadAll(textManifest);
        const deployment = yamlManifest.find(({ kind }) => kind === 'Deployment');

        if (!isLocalDevEnvironment && PLUGIN_PULL_SPEC) {
          console.log('this is not a local env, setting the pull spec for the deployment');
          deployment.spec.template.spec.containers[0].image = PLUGIN_PULL_SPEC;
          const service = yamlManifest.find(({ kind }) => kind === 'Service');
          const consolePlugin = yamlManifest.find(({ kind }) => kind === 'ConsolePlugin');
          cy.exec(` echo '${JSON.stringify(deployment)}' | oc create -f -`, {
            failOnNonZeroExit: false,
          })
            .its('stdout')
            .should('contain', 'created')
            .then(() =>
              cy
                .exec(` echo '${JSON.stringify(service)}' | oc create -f -`, {
                  failOnNonZeroExit: false,
                })
                .then((result) => {
                  console.log('Error: ', result.stderr);
                  console.log('Success: ', result.stdout);
                })
                .its('stdout')
                .should('contain', 'created'),
            )
            .then(() =>
              cy
                .exec(` echo '${JSON.stringify(consolePlugin)}' | oc create -f -`, {
                  failOnNonZeroExit: false,
                })
                .then((result) => {
                  console.log('Error: ', result.stderr);
                  console.log('Success: ', result.stdout);
                })
                .its('stdout')
                .should('contain', 'created'),
            )
            .then(() => {
              cy.visit(`/k8s/ns/${PLUGIN_NAME}/deployments`);
              listPage.rows.shouldBeLoaded();
              listPage.filter.byName(PLUGIN_NAME);
              listPage.rows.shouldExist(PLUGIN_NAME);
              enableDemoPlugin(true);
            });
        } else {
          console.log('this IS A local env, not setting the pull spec for the deployment');
        }
      });
    });

    afterEach(() => {
      checkErrors();
    });

    after(() => {
      if (!isLocalDevEnvironment && PLUGIN_PULL_SPEC) {
        enableDemoPlugin(false);
      }
      cy.deleteProjectWithCLI(PLUGIN_NAME);
    });

    it(`test Dashboard Card nav item`, () => {
      nav.sidenav.clickNavLink(['Home', `Overview`]);
      cy.byLegacyTestID('horizontal-link-Demo Dashboard')
        .should('have.text', 'Demo Dashboard')
        .click();
      cy.byTestID('demo-plugin-dashboard-card').should('contain', 'Metrics Dashboard Card example');
      cy.get('div.graph-wrapper').should('exist');
    });

    it(`test Dynamic Nav items`, () => {
      const dynamicNavIDs = ['1', '2'];
      dynamicNavIDs.forEach((id) => dynamicNavTest(id));
    });

    it(`test Test Utilities nav item`, () => {
      nav.sidenav.clickNavLink(['Demo Plugin', 'Test Utilities']);
      cy.byTestID('test-utilities-title').should('contain', 'Utilities from Dynamic Plugin SDK');
      cy.byTestID('test-utility-card').should('contain', 'Utility: consoleFetchJSON');
      cy.byTestID('test-utility-fetch').should('not.be.empty');
    });

    it(`test List Page nav item`, () => {
      const podName = 'openshift-state-metrics';
      nav.sidenav.clickNavLink(['Demo Plugin', 'List Page']);
      listPage.titleShouldHaveText('OpenShift Pods List Page');
      listPage.rows.shouldBeLoaded();
      listPage.filter.byName(podName);
      listPage.rows.shouldExist(podName);
    });

    it(`test K8s API nav item`, () => {
      const apiIDs = ['k8sCreate', 'k8sGet', 'k8sPatch', 'k8sUpdate', 'k8sList', 'k8sDelete'];
      nav.sidenav.clickNavLink(['Demo Plugin', 'K8s API']);
      cy.byTestID('test-k8sapi-title').should('contain', 'K8s API from Dynamic Plugin SDK');
      apiIDs.forEach((id) => k8sAPINavTest(id));
    });
  });
} else {
  xdescribe('Skipping demo dynamic plugin tests', () => {
    it('If we are running with a console-operator build, skip this test as we can not build the demo plugin', () => {});
  });
}
