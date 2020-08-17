import { devNavigationMenu, switchPerspective } from '../constants/global';

export const perspective = {
  verifyPerspective: (perspectiveName: string) => {
    cy.byLegacyTestID('perspective-switcher-toggle').should('contain.text', perspectiveName);
  },

  switchTo : (perspectiveName: switchPerspective) => {
    cy.byLegacyTestID('perspective-switcher-toggle').click();
    switch (perspectiveName) {
      case switchPerspective.Administrator: {
        cy.get('li[role="menuitem"]')
        .contains('Administrator')
        .click();
        cy.get('body div').then(($el) => {
          if($el.find('#guided-tour-modal').length !== 0) {
            cy.get('#tour-step-footer-secondary').click();
            cy.get('#tour-step-footer-primary').should('be.visible').click();
          }
        });
        break;
      }
      case switchPerspective.Developer: {
        cy.get('li[role="menuitem"]')
        .contains('Developer')
        .click();
        cy.get('body div').then(($el) => {
          if($el.find('#guided-tour-modal').length !== 0) {
            cy.get('#tour-step-footer-secondary').click();
            cy.get('#tour-step-footer-primary').should('be.visible').click();
          }
        });
        break;
      }
      default: {
        throw new Error('Option is not available');
      }
  }
}
};

export const naviagteTo = (opt: devNavigationMenu) => {
  switch (opt) {
    case devNavigationMenu.Add: {
      cy.byLegacyTestID('+Add-header').click().then(() => {
        cy.url().should('include', 'add');
      // cy.titleShouldBe('Add');
      });
      break;
    }
    case devNavigationMenu.Topology: {
      cy.byLegacyTestID('topology-header').click().then(() => {
      cy.url().should('include', 'topology');
      });
      break;
    }
    case devNavigationMenu.GitOps: {
      cy.byLegacyTestID('gitops-header').click().then(() => {
      cy.titleShouldBe('GitOps');
      });
      break;
    }
    case devNavigationMenu.Monitoring: {
      cy.byLegacyTestID('monitoring-header').click().then(() => {
      cy.titleShouldBe('Monitoring');
      });
      break;
    }
    case devNavigationMenu.Builds: {
      cy.byLegacyTestID('build-header').click();
      cy.titleShouldBe('Build Configs');
      break;
    }
    case devNavigationMenu.Pipelines: {
      cy.byLegacyTestID('pipeline-header').click()
        // cy.wait(5000);
        cy.titleShouldBe('Pipelines');
      break;
    }
    case devNavigationMenu.Search: {
      cy.byLegacyTestID('search-header').click();
      cy.titleShouldBe('Search');
      break;
    }
    case devNavigationMenu.Helm: {
      cy.byLegacyTestID('helm-releases-header').click();
      cy.titleShouldBe('Helm Releases');
      break;
    }
    case devNavigationMenu.Project: {
      cy.byLegacyTestID('project-details-header').click();
      break;
    }
    case devNavigationMenu.ConfigMaps: {
      cy.get('#ConfigMap').click();
      cy.titleShouldBe('Config Maps');
      break;
    }
    case devNavigationMenu.Secrets: {
      cy.get('#Secret').click();
      cy.titleShouldBe('Secrets');
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
    cy.get('[data-test-dropdown-menu="#CREATE_RESOURCE_ACTION#"]').click();
  },

  enterProjectName: (projectName: string) => {
    cy.get('form[name="form"]').should('be.visible');
    cy.get('#input-name').type(projectName);
  },

  clickCreateButton: () => {
    cy.get('#confirm-action').click();
    // cy.byLegacyTestID("namespace-bar-dropdown").find('button').eq(0).contains('Project').should('contain.text', projectName);
  },

  createNewProject: (projectName: string) => {
    cy.get('[data-test-id="namespace-bar-dropdown"]', { timeout: 80000 })
    .find('button')
    .eq(0)
    .click();
  cy.byLegacyTestID('dropdown-text-filter').type(projectName);
  cy.wait(2000);
  cy.get('[role="listbox"]', { timeout: 20000 }).then(($el) => {
    if ($el.find('li[role="option"]').length === 0) {
      cy.get('[data-test-dropdown-menu="#CREATE_RESOURCE_ACTION#"]').click();
      projectNameSpace.enterProjectName(projectName);
      projectNameSpace.clickCreateButton();
    }
  });
  },
  selectProject: (projectName: string) => {
    cy.get('[data-test-id="namespace-bar-dropdown"]', { timeout: 80000 })
      .find('button')
      .eq(0)
      .click();
    cy.byLegacyTestID('dropdown-text-filter').type(projectName);
    cy.wait(3000);
    cy.get('[role="listbox"]', { timeout: 20000 }).then(($el) => {
      if ($el.find('li[role="option"]').length === 0) {
        // let str = $el.find('li[role="option"]').text();
        // if(str.localeCompare(projectName) === 0) {
          cy.get('[data-test-dropdown-menu="#CREATE_RESOURCE_ACTION#"]').click();
          projectNameSpace.enterProjectName(projectName);
          projectNameSpace.clickCreateButton();
        // }
      }
      else {
        cy.get('[role="listbox"]')
        .find('li[role="option"]')
        .contains(projectName)
        .click();
      }
    });
  },

  verifyPopupClosed: () => {
    cy.get('form[name="form"]').should('not.be.visible');
  },

  verifyMessage: (message: string) => {
    cy.get('h2').should('contain.text', message);
  },

  deleteProjectNameSpace:(requester: string = 'kube:admin') => {
    naviagteTo(devNavigationMenu.Project);
    projectNameSpace.selectProject('all projects');
    cy.get('data-test-id="item-filter"').type('aut-');
    cy.get('tbody').should('exist');
    cy.get('tr td:nth-child(4)').each(($el, index) => {
      const text = $el.text()
      if(text.includes(requester)) {
        cy.get('tbody tr').eq(index).find('td:nth-child(1) button').click();
      }
    });
    // cy.get(`button[title="${projectName}"]`).click();
    cy.get('[title="Project"]', {timeout:8000} ).should('be.visible');
    cy.selectByDropDownText('[data-test-id="actions-menu-button"]', 'Delete Project');
    cy.get('form [data-test-id="modal-title"]').should('contain.text', 'Delete Project?');
    cy.get('p strong').eq(1).then(($el) => {
      const text = $el.text()
      cy.get('input[placeholder="Enter name"]').type(text);
      cy.get('#confirm-action').should('be.enabled').click();
    })
  },
};

export const appFunctions = {
  
};