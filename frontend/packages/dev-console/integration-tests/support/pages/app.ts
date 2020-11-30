import { detailsPage } from '../../../../integration-tests-cypress/views/details-page';
import { nav } from '../../../../integration-tests-cypress/views/nav';
import { devNavigationMenu, switchPerspective } from '../constants/global';
import { modal } from '../../../../integration-tests-cypress/views/modal';

export const app = {
  waitForLoad: (timeout: number = 30000) =>
    cy.get('.co-m-loader', { timeout }).should('not.be.visible'),
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
      cy.byLegacyTestID('+Add-header')
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
      cy.byLegacyTestID('topology-header').click();
      cy.url().should('include', 'topology');
      cy.testA11y('Topology Page in dev perspective');
      break;
    }
    case devNavigationMenu.GitOps: {
      cy.byLegacyTestID('gitops-header').click();
      detailsPage.titleShouldContain('GitOps');
      cy.testA11y('GitOps Page in dev perspective');
      break;
    }
    case devNavigationMenu.Monitoring: {
      cy.byLegacyTestID('monitoring-header').click();
      detailsPage.titleShouldContain('Monitoring');
      cy.testA11y('Monitoring Page in dev perspective');
      break;
    }
    case devNavigationMenu.Builds: {
      cy.byLegacyTestID('build-header').click();
      detailsPage.titleShouldContain('Build Configs');
      cy.testA11y('Builds Page in dev perspective');
      break;
    }
    case devNavigationMenu.Pipelines: {
      cy.byLegacyTestID('pipeline-header').click();
      detailsPage.titleShouldContain('Pipelines');
      cy.testA11y('Pipelines Page in dev perspective');
      break;
    }
    case devNavigationMenu.Search: {
      cy.byLegacyTestID('search-header').click();
      detailsPage.titleShouldContain('Search');
      cy.testA11y('Search Page in dev perspective');
      break;
    }
    case devNavigationMenu.Helm: {
      cy.byLegacyTestID('helm-releases-header').click();
      detailsPage.titleShouldContain('Helm Releases');
      cy.testA11y('Helm Releases Page in dev perspective');
      break;
    }
    case devNavigationMenu.Project: {
      cy.byLegacyTestID('project-details-header').click();
      cy.testA11y('Projects Page in dev perspective');
      break;
    }
    case devNavigationMenu.ConfigMaps: {
      cy.get('#ConfigMap').click();
      detailsPage.titleShouldContain('Config Maps');
      cy.testA11y('Config maps Page in dev perspective');
      break;
    }
    case devNavigationMenu.Secrets: {
      cy.get('#Secret').click();
      detailsPage.titleShouldContain('Secrets');
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
