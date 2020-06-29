import { devNavigationMenu } from '../constants/global';

export const perspective = {
  switchToAdmin: () => {
    cy.byLegacyTestID('perspective-switcher-toggle').click();
    cy.get('.pf-c-dropdown__menu-item')
      .contains('Administrator')
      .click();
  },

  switchToDeveloper: () => {
    cy.byLegacyTestID('perspective-switcher-toggle').click();
    cy.get('.pf-c-dropdown__menu-item')
      .contains('Developer')
      .click();
  },
};

export const projectNameSpace = {
  selectCreateProjectOption: () => {
    cy.byLegacyTestID('namespace-bar-dropdown')
      .find('button')
      .eq(0)
      .click();
    cy.byLegacyTestID('[data-test-dropdown-menu="#CREATE_RESOURCE_ACTION#"]').click();
  },

  enterProjectName: (projectName) => {
    cy.get('form[name="form"]').should('be.visible');
    cy.get('#input-name').type(projectName);
  },

  clickCreateButton: () => {
    cy.get('#confirm-action').click();
    // cy.byLegacyTestID("namespace-bar-dropdown").find('button').eq(0).contains('Project').should('contain.text', projectName);
  },

  selectProject: (projectName) => {
    cy.byLegacyTestID('namespace-bar-dropdown')
      .find('button')
      .eq(0)
      .click();
    cy.byLegacyTestID('dropdown-text-filter').type(projectName);
    cy.get('[role="listbox"]')
      .find('li[role="option"]')
      .contains(projectName)
      .click();
  },

  verifyPopupClosed: () => {
    cy.get('form[name="form"]').should('not.be.visible');
  },

  verifyMessage: (message) => {
    cy.get('h2').should('contain.text', message);
  },
};

export const naviagteTo = (opt: devNavigationMenu) => {
  switch (opt) {
    case devNavigationMenu.Add: {
      cy.byLegacyTestID('+Add-header').click();
      cy.byLegacyTestID('resource-title').should('contain.text', 'Add');
      break;
    }
    case devNavigationMenu.Topology: {
      cy.byLegacyTestID('topology-header').click();
      cy.byLegacyTestID('resource-title').should('contain.text', 'Topology');
      break;
    }
    case devNavigationMenu.Monitoring: {
      cy.byLegacyTestID('monitoring-header').click();
      cy.byLegacyTestID('resource-title').should('contain.text', 'Monitoring');
      break;
    }
    case devNavigationMenu.Builds: {
      cy.byLegacyTestID('build-header').click();
      cy.byLegacyTestID('resource-title').should('contain.text', 'Build Configs');
      break;
    }
    case devNavigationMenu.Pipelines: {
      cy.byLegacyTestID('pipeline-header').click();
      cy.byLegacyTestID('resource-title').should('contain.text', 'Pipelines');
      break;
    }
    case devNavigationMenu.Search: {
      cy.byLegacyTestID('search-header').click();
      cy.byLegacyTestID('resource-title').should('contain.text', 'Search');
      break;
    }
    case devNavigationMenu.Helm: {
      cy.byLegacyTestID('helm-releases-header').click();
      cy.byLegacyTestID('resource-title').should('contain.text', 'Helm Releases');
      break;
    }
    case devNavigationMenu.ProjectDetails: {
      cy.byLegacyTestID('project-details-header').click();
      break;
    }
    case devNavigationMenu.ConfigMaps: {
      cy.get('#ConfigMap').click();
      cy.byLegacyTestID('resource-title').should('contain.text', 'Config Maps');
      break;
    }
    case devNavigationMenu.Secrets: {
      cy.get('#Secret').click();
      cy.byLegacyTestID('resource-title').should('contain.text', 'Secrets');
      break;
    }
    default: {
      throw new Error('Option is not available');
    }
  }
};
