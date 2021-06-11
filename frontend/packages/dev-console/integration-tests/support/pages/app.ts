import { detailsPage } from '@console/cypress-integration-tests/views/details-page';
import { nav } from '@console/cypress-integration-tests/views/nav';
import { modal } from '@console/cypress-integration-tests/views/modal';
import { guidedTour } from '@console/cypress-integration-tests/views/guided-tour';
import { devNavigationMenu, switchPerspective, pageTitle } from '../constants';
import { devNavigationMenuPO, formPO, gitPO, yamlPO } from '../pageObjects';
import * as yamlView from '../../../../integration-tests-cypress/views/yaml-editor';

export const app = {
  waitForDocumentLoad: () => {
    cy.document()
      .its('readyState')
      .should('eq', 'complete');
  },
  waitForLoad: (timeout: number = 80000) => {
    cy.get('.co-m-loader', { timeout }).should('not.exist');
    cy.get('.pf-c-spinner', { timeout }).should('not.exist');
    cy.get('.skeleton-catalog--grid', { timeout }).should('not.exist');
    cy.get('.loading-skeleton--table', { timeout }).should('not.exist');
    cy.byTestID('skeleton-detail-view', { timeout }).should('not.exist');
    app.waitForDocumentLoad();
  },
  waitForNameSpacesToLoad: () => {
    cy.byLegacyTestID('namespace-bar-dropdown').should('be.visible');
  },
};

export const sidePane = {
  close: () => cy.get('button[aria-label="Close"]').click({ force: true }),
};

export const perspective = {
  switchTo: (perspectiveName: switchPerspective) => {
    nav.sidenav.switcher.changePerspectiveTo(perspectiveName);
    app.waitForLoad();
    if (switchPerspective.Developer) {
      // Bug: 1890676 is created related to Accessibility violation - Until bug fix, below line is commented to execute the scripts in CI
      // cy.testA11y('Developer perspective with guider tour modal');
      guidedTour.close();
      // Commenting below line, because due to this pipeline runs feature file is failing
      // cy.testA11y('Developer perspective');
    }
    nav.sidenav.switcher.shouldHaveText(perspectiveName);
    cy.get('body').then(($body) => {
      if ($body.find('[aria-label="Close drawer panel"]').length) {
        cy.get('[aria-label="Close drawer panel"]').click();
        cy.get('button')
          .contains('Leave')
          .click();
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
      cy.testA11y('Monitoring Page in dev perspective');
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
    app.waitForDocumentLoad();
    cy.get('[role="listbox"]').then(($el) => {
      if ($el.find('li[role="option"]').length === 0) {
        cy.byTestDropDownMenu('#CREATE_RESOURCE_ACTION#').click();
        projectNameSpace.enterProjectName(projectName);
        cy.byTestID('confirm-action').click();
        app.waitForLoad();
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
            app.waitForLoad();
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

  verifyMessage: (message: string) => cy.get('h2').should('contain.text', message),
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
    cy.get(gitPO.sectionTitle).should('have.text', sectionTitle),
};

export const yamlEditor = {
  isLoaded: () => {
    app.waitForLoad();
    cy.get(yamlPO.yamlEditor).should('be.visible');
  },

  clearYAMLEditor: () => {
    cy.get(yamlPO.yamlEditor)
      .click()
      .focused()
      .type('{ctrl}a')
      .clear();
  },

  setEditorContent: (yamlLocation: string) => {
    cy.readFile(yamlLocation).then((str) => {
      yamlView.setEditorContent(str);
    });
  },
};
