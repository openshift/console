import { detailsPage } from '@console/cypress-integration-tests/views/details-page';
import { nav } from '@console/cypress-integration-tests/views/nav';
import { devNavigationMenu, switchPerspective } from '../constants/global';
import { devNavigationMenuPO } from '../pageObjects/global-po';
import { pageTitle } from '../constants/pageTitle';
import { modal } from '@console/cypress-integration-tests/views/modal';
import { guidedTour } from '@console/cypress-integration-tests/views/guided-tour';

export const app = {
  waitForLoad: (timeout: number = 30000) => {
    cy.get('.co-m-loader', { timeout }).should('not.exist');
    cy.document()
      .its('readyState')
      .should('eq', 'complete');
  },
  waitForNameSpacesToLoad: () => {
    cy.byLegacyTestID('namespace-bar-dropdown').should('be.visible');
  },
};

export const perspective = {
  switchTo: (perspectiveName: switchPerspective) => {
    switch (perspectiveName) {
      case switchPerspective.Developer:
        nav.sidenav.switcher.changePerspectiveTo(switchPerspective.Developer);
        // Bug: 1890676 is created related to Accessibility violation - Until bug fix, below line is commented to execute the scripts in CI
        // cy.testA11y('Developer perspective with guider tour modal');
        guidedTour.close();
        app.waitForNameSpacesToLoad();
        // Bug: 1890678 is created related to Accessibility violation - Until bug fix, below line is commented to execute the scripts in CI
        // cy.testA11y('Developer perspective');
        break;
      case switchPerspective.Administrator:
        nav.sidenav.switcher.changePerspectiveTo(switchPerspective.Administrator);
        nav.sidenav.switcher.shouldHaveText(perspectiveName);
        break;
      default:
        break;
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
    app.waitForNameSpacesToLoad();
    // cy.get('[id="#ALL_NS#-link"]').click();
    // cy.byLegacyTestID('item-filter')
    //   .clear()
    //   .type(projectName);
    //   var filteredProjectsData = new Array();
    // cy.get('body').then(($body) => {
    //     if ($body.find('[role="grid"]').length !== 0) {
    //       return new Cypress.Promise((resolve, reject) => {
    //       cy.get('[role="grid"] tr td:nth-child(1)').each(($el) => {
    //         filteredProjectsData.push($el.find('button').text());
    //         cy.log(`$el.find('button').text()`);
    //       }).then(() => {
    //         return resolve(filteredProjectsData)
    //       });
    //       });
    //     }
    //   });
    //     if(filteredProjectsData.includes(projectName)) {
    //       cy.get('[role="grid"] tr td:nth-child(1) button').contains(projectName).click();
    //     }
    //     else {
    //       projectNameSpace.selectCreateProjectOption();
    //       projectNameSpace.enterProjectName(projectName);
    //       modal.submit();
    //       modal.shouldBeClosed();
    //     }

    cy.byLegacyTestID('dropdown-text-filter').type(projectName);
    cy.get('[data-test-id="namespace-bar-dropdown"] span.pf-c-dropdown__toggle-text')
      .first()
      .as('projectNameSpaceDropdown');
    cy.get('[role="listbox"]').then(($el) => {
      if ($el.find('li[role="option"]').length === 0) {
        cy.byTestDropDownMenu('#CREATE_RESOURCE_ACTION#').click();
        projectNameSpace.enterProjectName(projectName);
        modal.submit();
        cy.log(`User has created namespace "${projectName}"`);
      } else {
        cy.get('[role="listbox"]')
          .find('li[role="option"]')
          // eslint-disable-next-line @typescript-eslint/no-unused-vars
          .each(($ele) => {
            if ($ele.text() === projectName) {
              cy.get(`[id="${projectName}-link"]`).click();
            }
          });
        cy.log(`User has selected namespace "${projectName}"`);
        cy.get('@projectNameSpaceDropdown').then(($el1) => {
          if ($el1.text().includes(projectName)) {
            cy.get('@projectNameSpaceDropdown').should('contain.text', projectName);
          } else {
            cy.byTestDropDownMenu('#CREATE_RESOURCE_ACTION#').click();
            projectNameSpace.enterProjectName(projectName);
            modal.submit();
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
