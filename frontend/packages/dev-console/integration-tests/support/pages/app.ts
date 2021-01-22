import { detailsPage } from '../../../../integration-tests-cypress/views/details-page';
import { nav } from '../../../../integration-tests-cypress/views/nav';
import { devNavigationMenu, switchPerspective } from '../constants/global';
import { modal } from '../../../../integration-tests-cypress/views/modal';
import { devNavigationMenuPO } from '../pageObjects/global-po';
import { pageTitle } from '../constants/pageTitle';

export const app = {
  waitForLoad: (timeout: number = 30000) => cy.get('.co-m-loader', { timeout }).should('not.exist'),
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

export const naviagteTo = (opt: devNavigationMenu) => {
  switch (opt) {
    case devNavigationMenu.Add: {
      cy.get(devNavigationMenuPO.add)
        .click()
        .then(() => {
          cy.url().should('include', 'add');
          app.waitForLoad();
          // Bug: ODC-5119 is created related to Accesibiity violation - Until bug fix, below line is commented to execute the scripts in CI
          // cy.testA11y('Add Page in dev perspective');
        });
      break;
    }
    case devNavigationMenu.Topology: {
      cy.get(devNavigationMenuPO.topology).click();
      cy.url().should('include', 'topology');
      // Bug: ODC-5119 is created related to Accesibiity violation - Until bug fix, below line is commented to execute the scripts in CI
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
      cy.testA11y('Pipelines Page in dev perspective');
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
    default: {
      throw new Error('Option is not available');
    }
  }
};

export const projectNameSpace = {
  selectCreateProjectOption: () => {
    cy.byLegacyTestID('namespace-bar-dropdown')
      .find('button')
      .eq(0)
      .click();
    cy.byTestDropDownMenu('#CREATE_RESOURCE_ACTION#').click();
  },

  enterProjectName: (projectName: string) => {
    cy.get('form[name="form"]').should('be.visible');
    cy.get('#input-name').type(projectName);
  },

  selectOrCreateProject: (projectName: string) => {
    cy.byLegacyTestID('namespace-bar-dropdown')
      .find('button')
      .eq(0)
      .click();
    // Bug: ODC-5129 - is created related to Accesibiity violation - Until bug fix, below line is commented to execute the scripts in CI
    // cy.testA11y('Create Project modal');
    cy.byLegacyTestID('dropdown-text-filter').type(projectName);
    cy.get('[role="listbox"]').then(($el) => {
      if ($el.find('li[role="option"]').length === 0) {
        cy.byTestDropDownMenu('#CREATE_RESOURCE_ACTION#').click();
        cy.byTestID('input-name').type(projectName);
        modal.submit();
      } else {
        cy.get(`[id="${projectName}-link"]`).click();
      }
    });
  },

  selectProject: (projectName: string) => {
    cy.byLegacyTestID('namespace-bar-dropdown')
      .find('button')
      .eq(0)
      .click();
    cy.byLegacyTestID('dropdown-text-filter').type(projectName);
    cy.get(`[id="${projectName}-link"]`).click();
  },

  verifyMessage: (message: string) => {
    cy.get('h2').should('contain.text', message);
  },
};
