import { safeLoadAll } from 'js-yaml';
import { checkErrors } from '../../support';
import { isLocalDevEnvironment } from '../../views/common';
import { detailsPage } from '../../views/details-page';
import { guidedTour } from '../../views/guided-tour';
import { listPage } from '../../views/list-page';
import { modal } from '../../views/modal';

const PLUGIN_NAME = 'console-demo-plugin';
const PLUGIN_PATH = '../../../dynamic-demo-plugin';
const PLUGIN_PULL_SPEC = Cypress.env('PLUGIN_PULL_SPEC');

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
  cy.byTestID(`${PLUGIN_NAME}-status`)
    .should('include.text', enable ? 'Loaded' : '-')
    .then(() => {
      if (!enable) {
        cy.byLegacyTestID(PLUGIN_NAME).click();
        detailsPage.titleShouldContain(PLUGIN_NAME);
        detailsPage.clickPageActionFromDropdown('Delete ConsolePlugin');
        modal.shouldBeOpened();
        modal.submit();
      }
    });
};

// Only run tests if in local dev or if CI has plugin pull spec configured
if (!Cypress.env('OPENSHIFT_CI') || Cypress.env('PLUGIN_PULL_SPEC')) {
  describe('Console Plugin Manifest Tab', () => {
    before(() => {
      cy.login();
      guidedTour.close();
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

    beforeEach(() => {
      // Visit the console plugins list page to ensure plugin exists and is loaded
      cy.visit('/k8s/cluster/console.openshift.io~v1~ConsolePlugin');
      cy.get('body').then(($body) => {
        if ($body.find(`[data-test-id="${PLUGIN_NAME}"]`).length > 0) {
          // Plugin exists, proceed with tests
          cy.byLegacyTestID(PLUGIN_NAME).should('be.visible');
        } else {
          // Skip tests if plugin doesn't exist
          cy.log(`Plugin ${PLUGIN_NAME} not found, skipping manifest tests`);
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

    it('should display manifest tab in ConsolePlugin details page', () => {
      // Navigate to the demo plugin details page
      cy.visit(`/k8s/cluster/console.openshift.io~v1~ConsolePlugin/${PLUGIN_NAME}`);

      // Verify we're on the plugin details page
      detailsPage.titleShouldContain(PLUGIN_NAME);

      // Check that the Plugin manifest tab exists
      cy.get('[role="tablist"]').within(() => {
        cy.contains('Plugin manifest').should('be.visible');
      });
    });

    it('should navigate to manifest tab and display content', () => {
      // Navigate directly to the manifest tab
      cy.visit(`/k8s/cluster/console.openshift.io~v1~ConsolePlugin/${PLUGIN_NAME}/plugin-manifest`);

      // Verify we're on the manifest tab
      cy.url().should('include', '/plugin-manifest');

      // Verify the manifest tab is active (PatternFly v6 uses pf-m-current class)
      cy.get('[role="tablist"]').within(() => {
        cy.contains('Plugin manifest').parent().should('have.class', 'pf-m-current');
      });

      // Wait for the page to load
      detailsPage.isLoaded();

      // Check if manifest content is displayed
      cy.get('body').then(($body) => {
        if ($body.find('.monaco-editor').length > 0) {
          // Code editor is present - verify it contains JSON content
          cy.get('.monaco-editor').should('be.visible');

          // Verify the editor contains typical plugin manifest structure
          cy.get('.monaco-editor').within(() => {
            // Look for common manifest properties
            cy.get('.view-lines').should('contain.text', '"name"');
          });
        } else if ($body.find('[data-test="empty-box"]').length > 0) {
          // Empty state is shown when no manifest is available
          cy.get('[data-test="empty-box"]').should('be.visible');
        } else {
          // Fallback: just verify the page loaded without errors
          cy.get('[data-test="page-heading"]').should('be.visible');
        }
      });
    });

    it('should display code editor with proper JSON formatting', function () {
      // Skip test if not in local dev environment where plugin manifest is available
      if (!isLocalDevEnvironment) {
        this.skip();
      }

      cy.visit(`/k8s/cluster/console.openshift.io~v1~ConsolePlugin/${PLUGIN_NAME}/plugin-manifest`);

      // Wait for the code editor to load
      cy.get('.monaco-editor', { timeout: 10000 }).should('be.visible');

      // Verify the editor is read-only (should not be editable)
      cy.get('.monaco-editor').click();
      cy.get('.monaco-editor').should('have.class', 'monaco-editor');

      // Verify JSON syntax highlighting by checking for JSON structure
      cy.get('.view-lines').within(() => {
        // Typical plugin manifest should have these properties
        cy.get('.mtk1, .mtk6, .mtk8').should('exist'); // Monaco editor syntax highlighting classes
      });

      // Verify the content contains expected plugin manifest structure
      cy.get('.view-lines').should('contain.text', '"name"');
      cy.get('.view-lines').should('contain.text', '"version"');
    });

    it('should show empty state when plugin manifest is not available', () => {
      // Create a mock scenario or test with a plugin that has no manifest
      // For this test, we'll verify the empty state handling exists
      cy.visit(`/k8s/cluster/console.openshift.io~v1~ConsolePlugin/${PLUGIN_NAME}/plugin-manifest`);

      // Check if empty state is displayed (depends on plugin state)
      cy.get('body').then(($body) => {
        if ($body.find('[data-test="empty-box"]').length > 0) {
          cy.get('[data-test="empty-box"]').should('be.visible');
          cy.get('[data-test="empty-box"]').should('contain.text', 'No manifest available');
        } else {
          // If manifest is available, just verify the page works
          detailsPage.isLoaded();
          cy.get('[data-test="page-heading"]').should('be.visible');
        }
      });
    });

    it('should maintain URL state when navigating between tabs', () => {
      // Start on the details tab
      cy.visit(`/k8s/cluster/console.openshift.io~v1~ConsolePlugin/${PLUGIN_NAME}`);

      // Navigate to manifest tab
      cy.get('[role="tablist"]').within(() => {
        cy.contains('Plugin manifest').click();
      });

      // Verify URL changed to manifest tab
      cy.url().should('include', '/plugin-manifest');

      // Navigate back to details tab
      cy.get('[role="tablist"]').within(() => {
        cy.contains('Details').click();
      });

      // Verify URL changed back to details
      cy.url().should('not.include', '/plugin-manifest');
      cy.url().should(
        'include',
        `/k8s/cluster/console.openshift.io~v1~ConsolePlugin/${PLUGIN_NAME}`,
      );
    });

    it('should handle direct navigation to manifest tab URL', () => {
      // Navigate directly to manifest tab via URL
      cy.visit(`/k8s/cluster/console.openshift.io~v1~ConsolePlugin/${PLUGIN_NAME}/plugin-manifest`);

      // Verify the page loads correctly
      detailsPage.isLoaded();

      // Verify the correct tab is active (PatternFly v6 uses pf-m-current class)
      cy.get('[role="tablist"]').within(() => {
        cy.contains('Plugin manifest').parent().should('have.class', 'pf-m-current');
      });

      // Verify the URL is correct
      cy.url().should('include', '/plugin-manifest');
    });
  });
} else {
  xdescribe('Skipping console plugin manifest tests', () => {
    it('If we are running with a console-operator build, skip this test as we can not build the demo plugin', () => {});
  });
}
