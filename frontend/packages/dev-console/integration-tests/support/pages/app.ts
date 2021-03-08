import { detailsPage } from '../../../../integration-tests-cypress/views/details-page';
import { nav } from '../../../../integration-tests-cypress/views/nav';
import { devNavigationMenu, switchPerspective } from '../constants/global';
import { devNavigationMenuPO, formPO } from '../pageObjects/global-po';
import { pageTitle } from '../constants/pageTitle';
import { modal } from '../../../../integration-tests-cypress/views/modal';

export const app = {
  waitForLoad: (timeout: number = 80000) => {
    cy.get('.co-m-loader', { timeout }).should('not.exist');
    cy.get('.pf-c-spinner', { timeout }).should('not.exist');
  },
  waitForDocumentLoaded: () => {
    cy.document()
      .its('readyState')
      .should('eq', 'complete');
  },
};

export const sidePane = {
  close: () => {
    cy.get('button[aria-label="Close"]').click({ force: true });
  },
};

export const perspective = {
  switchTo: (perspectiveName: switchPerspective) => {
    switch (perspectiveName) {
      case switchPerspective.Administrator: {
        nav.sidenav.switcher.changePerspectiveTo('Administrator');
        break;
      }
      case switchPerspective.Developer: {
        nav.sidenav.switcher.changePerspectiveTo('Developer');
        break;
      }
      default: {
        throw new Error('Option is not available');
      }
    }
  },
};

export const navigateTo = (opt: devNavigationMenu) => {
  switch (opt) {
    case devNavigationMenu.Add: {
      cy.get(devNavigationMenuPO.add)
        .click()
        .then(() => {
          cy.url().should('include', 'add');
          app.waitForLoad();
          cy.get('h1.ocs-page-layout__title').should('have.text', pageTitle.Add);
          // Bug: ODC-5119 is created related to Accessibility violation - Until bug fix, below line is commented to execute the scripts in CI
          // cy.testA11y('Add Page in dev perspective');
        });
      break;
    }
    case devNavigationMenu.Topology: {
      cy.get(devNavigationMenuPO.topology).click();
      cy.url().should('include', 'topology');
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
    case devNavigationMenu.Monitoring: {
      cy.get(devNavigationMenuPO.monitoring).click();
      detailsPage.titleShouldContain(pageTitle.Monitoring);
      // Bug: ODC-5119 is created related to Accessibility violation - Until bug fix, below line is commented to execute the scripts in CI
      // cy.testA11y('Monitoring Page in dev perspective');
      break;
    }
    case devNavigationMenu.Builds: {
      cy.get(devNavigationMenuPO.builds).click();
      detailsPage.titleShouldContain(pageTitle.BuildConfigs);
      cy.testA11y('Builds Page in dev perspective');
      break;
    }
    case devNavigationMenu.Pipelines: {
      cy.get(devNavigationMenuPO.pipelines).click();
      detailsPage.titleShouldContain(pageTitle.Pipelines);
      // Bug: ODC-5119 is created related to Accessibility violation - Until bug fix, below line is commented to execute the scripts in CI
      // cy.testA11y('Pipelines Page in dev perspective');
      break;
    }
    case devNavigationMenu.Search: {
      cy.get(devNavigationMenuPO.search).click();
      detailsPage.titleShouldContain(pageTitle.Search);
      cy.testA11y('Search Page in dev perspective');
      break;
    }
    case devNavigationMenu.Helm: {
      cy.get(devNavigationMenuPO.helm).click();
      detailsPage.titleShouldContain(pageTitle.HelmReleases);
      cy.testA11y('Helm Releases Page in dev perspective');
      break;
    }
    case devNavigationMenu.Project: {
      cy.get(devNavigationMenuPO.project).click();
      detailsPage.titleShouldContain(pageTitle.Project);
      cy.testA11y('Projects Page in dev perspective');
      break;
    }
    case devNavigationMenu.ConfigMaps: {
      cy.get(devNavigationMenuPO.configMaps).click();
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
    default: {
      throw new Error('Option is not available');
    }
  }
};

export const projectNameSpace = {
  clickProjectDropdown: () => {
    cy.byLegacyTestID('namespace-bar-dropdown')
      .find('button')
      .first()
      .click();
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
    projectNameSpace.clickProjectDropdown();
    // Bug: ODC-5129 - is created related to Accessibility violation - Until bug fix, below line is commented to execute the scripts in CI
    // cy.testA11y('Create Project modal');
    cy.byLegacyTestID('dropdown-text-filter').type(projectName);
    cy.get('[data-test-id="namespace-bar-dropdown"] span.pf-c-dropdown__toggle-text')
      .first()
      .as('projectNameSpaceDropdown');
    app.waitForDocumentLoaded();
    cy.get('[role="listbox"]').then(($el) => {
      if ($el.find('li[role="option"]').length === 0) {
        cy.byTestDropDownMenu('#CREATE_RESOURCE_ACTION#').click();
        projectNameSpace.enterProjectName(projectName);
        cy.byTestID('confirm-action').click();
      } else {
        cy.get('[role="listbox"]')
          .find('li[role="option"]')
          // eslint-disable-next-line @typescript-eslint/no-unused-vars
          .each(($ele, index, $list) => {
            if ($ele.text() === projectName) {
              cy.get(`[id="${projectName}-link"]`).click();
            }
          });
        cy.get('@projectNameSpaceDropdown').then(($el1) => {
          if ($el1.text().includes(projectName)) {
            cy.get('@projectNameSpaceDropdown').should('contain.text', projectName);
          } else {
            cy.byTestDropDownMenu('#CREATE_RESOURCE_ACTION#').click();
            projectNameSpace.enterProjectName(projectName);
            cy.byTestID('confirm-action').click();
          }
        });
      }
    });
  },

  selectProject: (projectName: string) => {
    projectNameSpace.clickProjectDropdown();
    cy.byLegacyTestID('dropdown-text-filter').type(projectName);
    cy.get(`[id="${projectName}-link"]`).click();
  },

  verifyMessage: (message: string) => {
    cy.get('h2').should('contain.text', message);
  },
};

export const createForm = {
  clickOnFormView: () => cy.get(formPO.configureVia.formView).click(),
  clickOnYAMLView: () => cy.get(formPO.configureVia.yamlView).click(),
  clickCreate: () =>
    cy
      .get(formPO.create)
      .should('be.enabled')
      .click(),
  clickCancel: () =>
    cy
      .get(formPO.cancel)
      .should('be.enabled')
      .click(),
  sectionTitleShouldContain: (sectionTitle: string) =>
    cy.get('.odc-form-section__heading').should('have.text', sectionTitle),
};
