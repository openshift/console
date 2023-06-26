import { Given, Then, When } from 'cypress-cucumber-preprocessor/steps';
import { devNavigationMenu, switchPerspective } from '../../constants';
import { devNavigationMenuPO } from '../../pageObjects';
import { customizationPO } from '../../pageObjects/customization';
import { app, navigateTo, perspective } from '../../pages';

Given('user is at console tab', () => {
  cy.get('body').then(($body) => {
    if ($body.text().includes('Consoles')) {
      cy.byLegacyTestID('dev-perspective-nav').contains('Consoles').click();
    } else {
      cy.get(devNavigationMenuPO.search).click();
      cy.get(customizationPO.filter).click();
      cy.get(customizationPO.resourceSearch).should('be.visible').type('console');
      cy.get(customizationPO.consoleItems).then(($el) => {
        if ($el.text().includes('operator.openshift.io')) {
          cy.wrap($el).contains('operator.openshift.io').click();
        } else {
          cy.wrap($el).click();
        }
      });
      cy.get('.co-search-group__pin-toggle').should('be.visible').click();
    }
  });
});

When('user clicks on cluster', () => {
  cy.byTestID('cluster').should('be.visible').click();
});

When('user opens customization', () => {
  cy.byLegacyTestID('actions-menu-button').should('be.visible').click();
  cy.byTestActionID('Customize').should('be.visible').click();
});

Given('user is at customization', () => {
  navigateTo(devNavigationMenu.Consoles);
  cy.byLegacyTestID('actions-menu-button').should('be.visible').click();
  cy.byTestActionID('Customize').should('be.visible').click();
});

When('user clicks on Developer tab', () => {
  cy.get(customizationPO.role.presentation).contains('Developer').should('be.visible').click();
});

When('user disables all the items in Developer Catalog', () => {
  cy.byTestID(customizationPO.developerCatalog.formSection)
    .find(customizationPO.developerCatalog.removeAllAction)
    .scrollIntoView()
    .then(($el) => {
      if ($el.is(':enabled')) {
        cy.wrap($el).click();
      }
    });

  cy.byTestID(customizationPO.developerCatalog.formSection)
    .find(customizationPO.developerCatalog.addAllAction)
    .scrollIntoView()
    .click();
});

When('user disables {string} the item in Developer Catalog', (actionName: string) => {
  cy.byTestID(customizationPO.developerCatalog.formSection)
    .find(customizationPO.developerCatalog.removeAllAction)
    .click();

  cy.byTestID(customizationPO.developerCatalog.formSection)
    .find(customizationPO.developerCatalog.availableSearchInput)
    .type(actionName);

  cy.byTestID(customizationPO.developerCatalog.formSection)
    .find(customizationPO.role.option)
    .contains(actionName)
    .scrollIntoView()
    .click();

  cy.byTestID(customizationPO.developerCatalog.formSection)
    .find(customizationPO.developerCatalog.addSelectedAction)
    .scrollIntoView()
    .click();
});

Given('user enabled {string} and disables everything', (actionName: string) => {
  cy.byTestID(customizationPO.developerCatalog.formSection)
    .find(customizationPO.developerCatalog.addAllAction)
    .click();

  cy.byTestID(customizationPO.developerCatalog.formSection)
    .find(customizationPO.developerCatalog.choosenSearchInput)
    .type(actionName);

  cy.byTestID(customizationPO.developerCatalog.formSection)
    .find(customizationPO.role.option)
    .contains(actionName)
    .click();

  cy.byTestID(customizationPO.developerCatalog.formSection)
    .find(customizationPO.developerCatalog.removeSelectedAction)
    .click();
});

Given('user disables all the items in Add page', () => {
  cy.byTestID(customizationPO.addPage.formSection)
    .find(customizationPO.addPage.addAllAction)
    .scrollIntoView()
    .click();
});

Given('user disables {string} the item in Add page', (actionName: string) => {
  cy.byTestID(customizationPO.addPage.formSection)
    .find(customizationPO.addPage.removeAllAction)
    .click();

  cy.byTestID(customizationPO.addPage.formSection)
    .find(customizationPO.addPage.availableSearchInput)
    .type(actionName);

  cy.byTestID(customizationPO.addPage.formSection)
    .find(customizationPO.role.option)
    .contains(actionName)
    .scrollIntoView()
    .click();

  cy.byTestID(customizationPO.addPage.formSection)
    .find(customizationPO.addPage.addSelectedAction)
    .scrollIntoView()
    .click();
});

Then('user will see Save message', () => {
  cy.get(customizationPO.successAlert).scrollIntoView().should('be.visible').click();
});

Then(
  'user will not see "Developer Catalog" and all the sub-catalogs in Add page and Topology page',
  () => {
    perspective.switchTo(switchPerspective.Administrator);
    perspective.switchTo(switchPerspective.Developer);
    navigateTo(devNavigationMenu.Add);
    cy.exec('oc -n openshift-console rollout status deployment/console --timeout=1m').then(() => {
      cy.reload();
      app.waitForDocumentLoad();
      cy.byTestID('card developer-catalog').should('not.exist');
    });
  },
);

Then(
  'user will not get any entry point to catalog page in add page, topology actions, empty states, quick search, and the catalog itself',
  () => {
    navigateTo(devNavigationMenu.Add);
    cy.reload();
    app.waitForDocumentLoad();
    cy.byTestID('card developer-catalog').should('not.exist');

    navigateTo(devNavigationMenu.Topology);
    cy.byTestID('quick-search').click();
    cy.byTestID('quick-search-bar').find('input').type('node');
    cy.get('#devCatalog').should('not.exist');
  },
);

Then(
  'user will see "Developer Catalog" and all the sub-catalogs in Add page and Topology page except "HelmChart"',
  () => {
    perspective.switchTo(switchPerspective.Administrator);
    perspective.switchTo(switchPerspective.Developer);
    navigateTo(devNavigationMenu.Add);
    cy.exec('oc -n openshift-console rollout status deployment/console --timeout=2m').then(() => {
      cy.get('body')
        .then(($body) => {
          if (!$body.find('card developer-catalog').length) {
            cy.wait(30000);
            cy.reload();
            app.waitForDocumentLoad();
          }
        })
        .then(() => {
          cy.byTestID('card developer-catalog').should('be.visible');
          cy.byTestID('item operator-backed').should('be.visible');
          cy.byTestID('item dev-catalog').should('be.visible');
          cy.byTestID('item helm').should('not.exist');
        });
    });
  },
);

Then(
  'user will only see "Developer Catalog" and "HelmChart" type in Add page and Topology page',
  () => {
    perspective.switchTo(switchPerspective.Administrator);
    perspective.switchTo(switchPerspective.Developer);
    navigateTo(devNavigationMenu.Add);
    cy.exec('oc -n openshift-console rollout status deployment/console --timeout=2m').then(() => {
      cy.get('body')
        .then(($body) => {
          if (!$body.find('item helm').length) {
            cy.wait(30000);
            cy.reload();
            app.waitForDocumentLoad();
          }
        })
        .then(() => {
          cy.byTestID('card developer-catalog').should('be.visible');
          cy.byTestID('item helm').should('be.visible');
          cy.byTestID('item operator-backed').should('not.exist');
        });
    });
  },
);

Then('user will not see any cards in Add page except Getting Started', () => {
  navigateTo(devNavigationMenu.Add);
  cy.exec('oc -n openshift-console rollout status deployment/console --timeout=1m').then(() => {
    cy.reload();
    app.waitForDocumentLoad();
    cy.byTestID('getting-started').should('be.visible');
    cy.byTestID('add-page').find('[data-test^=card]').should('have.length', 2);
  });
});

Then('user will not see any "Import from Git" card in Add page', () => {
  navigateTo(devNavigationMenu.Add);
  cy.exec('oc -n openshift-console rollout status deployment/console --timeout=1m').then(() => {
    cy.reload();
    app.waitForDocumentLoad();
    cy.byTestID('card git-repository').should('not.exist');
  });
});
