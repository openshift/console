import { detailsPage } from '../../../../integration-tests-cypress/views/details-page';
import { devNavigationMenu } from '../constants';
import { pagePO } from '../pageObjects';
import { routesPO } from '../pageObjects/route-po';
import { createForm, navigateTo } from './app';

export const routesPage = {
  createRoute: (routeName: string, service: string, targetPort: string, hostname?: string) => {
    navigateTo(devNavigationMenu.Routes);
    cy.get(pagePO.create)
      .should('be.visible')
      .click();
    cy.get(routesPO.name)
      .should('be.visible')
      .clear()
      .type(routeName);
    if (hostname) {
      cy.get(routesPO.hostname)
        .scrollIntoView()
        .should('be.visible')
        .clear()
        .type(hostname);
    }
    cy.get(routesPO.service)
      .scrollIntoView()
      .should('be.visible')
      .click();
    cy.byTestDropDownMenu(service)
      .should('be.visible')
      .click();
    cy.get(routesPO.targetPort)
      .scrollIntoView()
      .should('be.visible')
      .click();
    const port: string = targetPort.substring(0, 4);
    cy.byTestDropDownMenu(`${port}-tcp`)
      .should('be.visible')
      .click();
    createForm.clickCreate();
    cy.get(pagePO.breadcrumb)
      .contains('Routes')
      .should('be.visible');
    detailsPage.titleShouldContain(routeName);
  },
};
