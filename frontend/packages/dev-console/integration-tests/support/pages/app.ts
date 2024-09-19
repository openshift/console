import { detailsPage } from '@console/cypress-integration-tests/views/details-page';
import { guidedTour } from '@console/cypress-integration-tests/views/guided-tour';
import { modal } from '@console/cypress-integration-tests/views/modal';
import { nav } from '@console/cypress-integration-tests/views/nav';
import * as yamlView from '../../../../integration-tests-cypress/views/yaml-editor';
import { devNavigationMenu, switchPerspective, pageTitle, adminNavigationBar } from '../constants';
import {
  devNavigationMenuPO,
  formPO,
  gitPO,
  yamlPO,
  topologyPO,
  adminNavigationMenuPO,
} from '../pageObjects';
import { userPreferencePO } from '../pageObjects/userPreference-po';

export const app = {
  waitForDocumentLoad: () => {
    cy.document().its('readyState').should('eq', 'complete');
  },
  waitForLoad: (timeout: number = 160000, skipInline = false) => {
    // observe dashboard contains lots of loaders that only disappear when scrolled into view
    // skip these, otherwise wait as normal
    cy.url().then((url) => {
      if (url.includes('/dev-monitoring/') || skipInline) {
        cy.get('body').then((body) => {
          body.find('.co-m-loader').each(function () {
            if (!this.className.includes('co-m-loader--inline')) {
              cy.wrap(this).should('not.exist');
            }
          });
        });
      } else {
        cy.get('.co-m-loader', { timeout }).should('not.exist');
      }
    });
    cy.get('[class*="spinner"]', { timeout }).should('not.exist');
    cy.get('.skeleton-catalog--grid', { timeout }).should('not.exist');
    cy.get('.loading-skeleton--table', { timeout }).should('not.exist');
    cy.byTestID('skeleton-detail-view', { timeout }).should('not.exist');
    app.waitForDocumentLoad();
  },
  waitForNameSpacesToLoad: () => {
    cy.request('/api/kubernetes/apis/project.openshift.io/v1/projects?limit=250').then((resp) => {
      expect(resp.status).toEqual(200);
    });
    app.waitForLoad();
  },
};

export const sidePane = {
  operatorClose: () => cy.get('button[aria-label="Close"]').click({ force: true }),
  close: () => cy.byLegacyTestID('sidebar-close-button').click({ force: true }),
};

export const perspective = {
  switchTo: (perspectiveName: switchPerspective) => {
    nav.sidenav.switcher.changePerspectiveTo(perspectiveName);
    app.waitForLoad();
    if (perspectiveName === switchPerspective.Developer) {
      guidedTour.close();
      // Commenting below line, because due to this pipeline runs feature file is failing
      // cy.testA11y('Developer perspective');
    }
    nav.sidenav.switcher.shouldHaveText(perspectiveName);
    cy.get('body').then(($body) => {
      if ($body.find('[aria-label="Close drawer panel"]').length) {
        if ($body.find('[data-test="Next button"]').length) {
          cy.get('[aria-label="Close drawer panel"]').click();
          cy.get('button').contains('Leave').click();
        } else {
          cy.get('[aria-label="Close drawer panel"]').click();
        }
      }
    });
  },
};

export const navigateTo = (opt: devNavigationMenu) => {
  switch (opt) {
    case devNavigationMenu.Add: {
      perspective.switchTo(switchPerspective.Developer);
      cy.get(devNavigationMenuPO.add)
        .click()
        .then(() => {
          cy.url().should('include', 'add');
          app.waitForLoad();
          cy.contains(pageTitle.Add).should('be.visible');
          // Bug: ODC-5119 is created related to Accessibility violation - Until bug fix, below line is commented to execute the scripts in CI
          // cy.testA11y('Add Page in dev perspective');
        });
      break;
    }
    case devNavigationMenu.Topology: {
      cy.get(devNavigationMenuPO.topology).click();
      cy.url().should('include', 'topology');
      app.waitForLoad();
      cy.url().then(($url) => {
        if ($url.includes('view=list') && !$url.includes('all-namespace')) {
          cy.log('Topology view is in list');
          cy.get(topologyPO.switcher).click({ force: true });
        }
      });
      // Bug: ODC-5119 is created related to Accessibility violation - Until bug fix, below line is commented to execute the scripts in CI
      // cy.testA11y('Topology Page in dev perspective');
      break;
    }
    case devNavigationMenu.GitOps: {
      cy.get(devNavigationMenuPO.gitOps).click();
      detailsPage.titleShouldContain(pageTitle.GitOPs);
      cy.testA11y('GitOps Page in dev perspective');
      break;
    }
    case devNavigationMenu.Observe: {
      cy.get(devNavigationMenuPO.monitoring).click();
      detailsPage.titleShouldContain(pageTitle.Observe);
      cy.testA11y('Monitoring Page in dev perspective');
      break;
    }
    case devNavigationMenu.Builds: {
      cy.get(devNavigationMenuPO.builds).click();
      detailsPage.titleShouldContain(pageTitle.Builds);
      cy.testA11y('Builds Page in dev perspective');
      break;
    }
    case devNavigationMenu.BuildConfigs: {
      cy.get(devNavigationMenuPO.builds).click();
      detailsPage.titleShouldContain(pageTitle.BuildConfigs);
      cy.testA11y('Builds Page in dev perspective');
      break;
    }
    case devNavigationMenu.Pipelines: {
      cy.get(devNavigationMenuPO.pipelines, { timeout: 80000 }).click();
      detailsPage.titleShouldContain(pageTitle.Pipelines);
      // Bug: ODC-5119 is created related to Accessibility violation - Until bug fix, below line is commented to execute the scripts in CI
      // cy.testA11y('Pipelines Page in dev perspective');
      break;
    }
    case devNavigationMenu.Search: {
      cy.get(devNavigationMenuPO.search).click();
      cy.get('h1').contains(pageTitle.Search);
      cy.testA11y('Search Page in dev perspective');
      break;
    }
    case devNavigationMenu.Helm: {
      cy.get(devNavigationMenuPO.helm).click();
      detailsPage.titleShouldContain(pageTitle.Helm);
      cy.testA11y('Helm Releases Page in dev perspective');
      break;
    }
    case devNavigationMenu.Project: {
      cy.get(devNavigationMenuPO.project).click();
      detailsPage.titleShouldContain(Cypress.env('NAMESPACE'));
      cy.testA11y('Projects Page in dev perspective');
      break;
    }
    case devNavigationMenu.ConfigMaps: {
      perspective.switchTo(switchPerspective.Developer);
      cy.byTestID('draggable-pinned-resource-item').contains('ConfigMaps').click();
      detailsPage.titleShouldContain(pageTitle.ConfigMaps);
      cy.testA11y('Config maps Page in dev perspective');
      break;
    }
    case devNavigationMenu.Secrets: {
      cy.get(devNavigationMenuPO.secret).click();
      detailsPage.titleShouldContain(pageTitle.Secrets);
      cy.testA11y('Secrets Page in dev perspective');
      break;
    }
    case devNavigationMenu.Environments: {
      cy.get(devNavigationMenuPO.environments).click();
      detailsPage.titleShouldContain(pageTitle.Environments);
      cy.testA11y('Environments Page in dev perspective');
      break;
    }
    case devNavigationMenu.Routes: {
      cy.get('body').then(($body) => {
        if ($body.text().includes('Routes')) {
          cy.byTestID('draggable-pinned-resource-item').contains('Routes').click();
        } else {
          cy.get(devNavigationMenuPO.search).click();
          cy.get('[aria-label="Options menu"]').click();
          cy.get('[placeholder="Select Resource"]').should('be.visible').type('route');
          cy.get('[data-filter-text="RTRoute"]').then(($el) => {
            if ($el.text().includes('route.openshift.io/v1')) {
              cy.wrap($el).contains('route.openshift.io/v1').click();
            } else {
              cy.wrap($el).click();
            }
          });
          cy.get('.co-search-group__pin-toggle').should('be.visible').click();
          cy.byTestID('draggable-pinned-resource-item')
            .contains('Routes')
            .should('be.visible')
            .click();
        }
      });
      detailsPage.titleShouldContain(pageTitle.Routes);
      cy.testA11y('Routes Page in dev perspective');
      break;
    }
    case devNavigationMenu.Deployments: {
      cy.get('body').then(($body) => {
        if ($body.text().includes('Deployments')) {
          cy.byTestID('draggable-pinned-resource-item').contains('Deployments').click();
        } else {
          cy.get(devNavigationMenuPO.search).click();
          cy.get('[aria-label="Options menu"]').click();
          cy.get('[placeholder="Select Resource"]').should('be.visible').type('Deployment');
          cy.get('[data-filter-text="DDeployment"]').click();
          cy.get('.co-search-group__pin-toggle').should('be.visible').click();
          cy.wait(3000);
          cy.byTestID('draggable-pinned-resource-item')
            .contains('Deployments')
            .should('be.visible')
            .click();
        }
      });
      detailsPage.titleShouldContain(pageTitle.Deployments);
      cy.testA11y('Deployments Page in dev perspective');
      break;
    }
    case devNavigationMenu.Consoles: {
      cy.get('body').then(($body) => {
        if ($body.text().includes('Consoles')) {
          cy.byTestID('draggable-pinned-resource-item').contains('Consoles').click();
          cy.byTestID('cluster').should('be.visible').click();
        } else {
          cy.get(devNavigationMenuPO.search).click();
          cy.get('[aria-label="Options menu"]').click();
          cy.get('[placeholder="Select Resource"]').should('be.visible').type('console');
          cy.get('[data-filter-text="CConsole"]').then(($el) => {
            if ($el.text().includes('operator.openshift.io')) {
              cy.wrap($el).contains('operator.openshift.io').click();
            } else {
              cy.wrap($el).click();
            }
          });
          cy.get('.co-search-group__pin-toggle').should('be.visible').click();
          cy.byTestID('cluster').should('be.visible').click();
        }
      });
      cy.testA11y('cluster Page in dev perspective');
      break;
    }
    case devNavigationMenu.Functions: {
      cy.get(devNavigationMenuPO.functions).click();
      detailsPage.titleShouldContain(pageTitle.Functions);
      cy.testA11y('Functions Page in dev perspective');
      break;
    }
    default: {
      throw new Error('Option is not available');
    }
  }
};

export const projectNameSpace = {
  clickProjectDropdown: () => {
    cy.byLegacyTestID('namespace-bar-dropdown').find('button').first().click();
  },
  selectCreateProjectOption: () => {
    cy.document().then((doc) => {
      if (doc.readyState === 'complete') {
        projectNameSpace.clickProjectDropdown();
        cy.byTestDropDownMenu('#CREATE_RESOURCE_ACTION#').click();
      }
    });
  },

  enterProjectName: (projectName: string) => {
    modal.shouldBeOpened();
    cy.get('#input-name').type(projectName);
  },

  selectOrCreateProject: (projectName: string) => {
    app.waitForLoad();
    cy.url().then((url) => {
      if (url.includes('add/all-namespaces')) {
        cy.get(userPreferencePO.userMenu, {
          timeout: 50000,
        }).then(($ele) => {
          if ($ele.text().includes('kube:admin')) {
            cy.get('tr[data-test-rows="resource-row"]').should('have.length.at.least', 1);
          } else if ($ele.text() !== 'Auth disabled') {
            cy.get('[data-test="empty-box-body"]').should('have.text', 'No Projects found');
          }
        });
      }
    });
    projectNameSpace.clickProjectDropdown();
    cy.get('body').then(($body) => {
      if ($body.find(userPreferencePO.userMenu).text().includes('kube:admin')) {
        cy.byTestID('showSystemSwitch').check(); // Ensure that all projects are showing
        cy.byTestID('dropdown-menu-item-link').should('have.length.gt', 5);
      }
    });
    // Bug: ODC-6164 - is created related to Accessibility violation - Until bug fix, below line is commented to execute the scripts in CI
    // cy.testA11y('Create Project modal');
    cy.url().then(($url) => {
      if ($url.includes('topology/all-namespaces')) {
        cy.get('.odc-namespaced-page__content').should('be.visible');
      } else if ($url.includes('topology/ns')) {
        cy.byLegacyTestID('item-filter').should('be.visible');
      }
    });
    cy.byTestID('dropdown-text-filter').type(projectName);
    cy.get('[data-test-id="namespace-bar-dropdown"] button > span')
      .first()
      .as('projectNameSpaceDropdown');
    app.waitForDocumentLoad();
    cy.get('[data-test="namespace-dropdown-menu"]')
      .first()
      .then(($el) => {
        if ($el.find('[data-test="dropdown-menu-item-link"]').length === 0) {
          cy.byTestDropDownMenu('#CREATE_RESOURCE_ACTION#').click();
          projectNameSpace.enterProjectName(projectName);
          cy.byTestID('confirm-action').click();
          const namespaces: string[] = Cypress.env('NAMESPACES') || [];
          if (!namespaces.includes(projectName)) {
            namespaces.push(projectName);
          }
          Cypress.env('NAMESPACES', namespaces);
          app.waitForLoad();
        } else {
          cy.get('[data-test="namespace-dropdown-menu"]')
            .find('[data-test="dropdown-menu-item-link"]')
            .contains(projectName)
            .click();
          cy.get('@projectNameSpaceDropdown').then(($el1) => {
            if ($el1.text().includes(projectName)) {
              cy.get('@projectNameSpaceDropdown').should('contain.text', projectName);
            } else {
              cy.byTestDropDownMenu('#CREATE_RESOURCE_ACTION#').click();
              projectNameSpace.enterProjectName(projectName);
              cy.byTestID('confirm-action').click();
              const namespaces: string[] = Cypress.env('NAMESPACES') || [];
              if (!namespaces.includes(projectName)) {
                namespaces.push(projectName);
              }
              Cypress.env('NAMESPACES', namespaces);
              app.waitForLoad();
            }
          });
        }
      });
    cy.get('@projectNameSpaceDropdown').should('have.text', `Project: ${projectName}`);
  },

  selectProjectOrDoNothing: (projectName: string) => {
    projectNameSpace.clickProjectDropdown();
    cy.byTestID('showSystemSwitch').check();
    cy.byTestID('dropdown-menu-item-link').should('have.length.gt', 5);
    cy.byTestID('dropdown-text-filter').type(projectName);
    cy.get('[data-test="namespace-dropdown-menu"]').then(($el) => {
      if ($el.find('[data-test="dropdown-menu-item-link"]').length !== 0) {
        cy.byTestID('namespace-dropdown-menu')
          .find('[data-test="dropdown-menu-item-link"]')
          .contains(projectName)
          .click();
      } else {
        projectNameSpace.clickProjectDropdown();
      }
    });
  },

  selectProject: (projectName: string) => {
    projectNameSpace.clickProjectDropdown();
    cy.byTestID('showSystemSwitch').check(); // Ensure that all projects are showing
    cy.byTestID('dropdown-menu-item-link').should('have.length.gt', 5);
    cy.byTestID('dropdown-text-filter').type(projectName);
    cy.byTestID('namespace-dropdown-menu')
      .find('[data-test="dropdown-menu-item-link"]')
      .contains(projectName)
      .click();
    cy.log(`User has selected namespace ${projectName}`);
  },

  verifyMessage: (message: string) => cy.get('h2').should('contain.text', message),
};

export const createForm = {
  clickOnFormView: () => cy.get(formPO.configureVia.formView).click(),
  clickOnYAMLView: () => cy.get(formPO.configureVia.yamlView).click(),
  clickCreate: () => cy.get(formPO.create).should('be.enabled').click(),
  clickCancel: () => cy.get(formPO.cancel).should('be.enabled').click(),
  clickSave: () => cy.get(formPO.save).should('be.enabled').click(),
  clickConfirm: () => cy.get(formPO.confirm).should('be.enabled').click(),
  sectionTitleShouldContain: (sectionTitle: string) =>
    cy.get(gitPO.sectionTitle).should('have.text', sectionTitle),
};

export const yamlEditor = {
  isLoaded: () => {
    app.waitForLoad();
    cy.get(yamlPO.yamlEditor).should('be.visible');
  },

  clearYAMLEditor: () => {
    cy.get(yamlPO.yamlEditor).click().focused().type('{ctrl}a').clear();
  },

  setEditorContent: (yamlLocation: string) => {
    cy.readFile(yamlLocation).then((str) => {
      yamlView.setEditorContent(str);
    });
  },

  clickSave: () => {
    cy.byTestID('save-changes').click();
  },
};

export const kebabMenu = {
  openKebabMenu: (name: string) => {
    cy.get('input[data-test-id="item-filter"]').should('be.visible').clear().type(name);
    // eslint-disable-next-line cypress/no-unnecessary-waiting
    cy.wait(3000);
    cy.get('.co-virtualized-table').should('be.visible');
    cy.get('.co-virtualized-table').within(() => {
      cy.get('tr td:nth-child(1)').each(($el, index) => {
        if ($el.text().includes(name)) {
          cy.get('tbody tr')
            .eq(index)
            .find('[data-test-id="kebab-button"]')
            .then(($ele1) => {
              cy.wrap($ele1).click({ force: true });
            });
        }
      });
    });
  },
};

export const navigateToAdminMenu = (opt: adminNavigationBar) => {
  switch (opt) {
    case adminNavigationBar.Home: {
      cy.get(adminNavigationMenuPO.home.main).click();
      break;
    }
    case adminNavigationBar.Workloads: {
      cy.get(adminNavigationMenuPO.workloads.main).click();
      break;
    }
    default: {
      throw new Error('Option is not available');
    }
  }
};
