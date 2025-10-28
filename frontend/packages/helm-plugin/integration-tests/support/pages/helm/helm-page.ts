import { helmActions } from '@console/dev-console/integration-tests/support/constants';
import { helmPO } from '@console/dev-console/integration-tests/support/pageObjects';

export const helmPage = {
  verifyMessage: (noHelmReleasesFound: string) =>
    cy.get(helmPO.noHelmReleasesMessage).should('contain.text', noHelmReleasesFound),
  verifyInstallHelmLink: () =>
    cy
      .get('a')
      .contains('Browse the catalog to discover available Helm Charts')
      .should('be.visible'),
  search: (name: string) => {
    cy.get(helmPO.filters).within(() => cy.get('.pf-v6-c-menu-toggle').first().click());
    cy.get('.pf-v6-c-menu__list-item').contains('Name').click();
    cy.get('[aria-label="Name filter"]').clear().type(name);
  },
  verifyHelmReleasesDisplayed: () => cy.get(helmPO.table).should('be.visible'),
  clickHelmReleaseName: (name: string) => cy.get(`a[title="${name}"]`).click(),
  selectAllHelmFilter: () => {
    cy.get(helmPO.deployedCheckbox).check();
    cy.get(helmPO.failedCheckbox).check();
    cy.get(helmPO.otherCheckbox).check();
  },
  selectHelmFilter: (filterName: string) => {
    switch (filterName) {
      case 'Deployed': {
        cy.get(helmPO.deployedCheckbox).check();
        break;
      }
      case 'Failed': {
        cy.get(helmPO.failedCheckbox).check();
        break;
      }
      case 'Other': {
        cy.get(helmPO.otherCheckbox).check();
        break;
      }
      case 'All': {
        helmPage.selectAllHelmFilter();
        break;
      }
      default: {
        throw new Error(`${filterName} filter is not available in filter drop down`);
      }
    }
    helmPage.selectHelmFilterDropDown();
  },
  verifyStatusInHelmReleasesTable: (helmReleaseName: string = 'Nodejs') => {
    cy.get(helmPO.table).should('exist');
    cy.get('tr td:nth-child(1)').each(($el, index) => {
      const text = $el.text();
      if (text.includes(helmReleaseName)) {
        cy.get('tbody tr').eq(index).find('td:nth-child(4) button').click();
      }
    });
  },
  selectKebabMenu: () => {
    cy.get(helmPO.table).should('exist');
    cy.byLegacyTestID('kebab-button').first().click();
  },
  verifyHelmChartsListed: () => {
    cy.get(helmPO.noHelmSearchMessage)
      .get(helmPO.table)
      .get('table')
      .its('length')
      .should('be.greaterThan', 0);
  },
  verifyHelmChartStatus: () => {
    cy.byTestID('success-icon').should('be.visible');
    cy.byTestID('status-text').should('exist');
  },
  verifySearchMessage: (message: string) =>
    cy.get(helmPO.noHelmSearchMessage).should('contain.text', message),
  selectHelmFilterDropDown: () => {
    cy.get(helmPO.filters).within(() => cy.get('.pf-v6-c-menu-toggle').first().click());
    cy.get('.pf-v6-c-menu__list-item').contains('Status').click();
  },
  selectHelmFilterOption: (filterName: string) => {
    cy.get(helmPO.filterDropdown).click();
    cy.get(`[data-ouia-component-id="DataViewCheckboxFilter-filter-item-${filterName}"]`).click();
    cy.url().should('include', `=${filterName}`);
    cy.get(helmPO.filterDropdown).click();
  },
  getItemFromReleaseTable: (header: string) => {
    cy.get(helmPO.table)
      .find('[data-test="data-view-cell-helm-release-name"]')
      .first()
      .should('be.visible')
      .parent()
      .find('[data-test="status-text"]')
      .should('contain.text', header);
  },
  verifyHelmFilterUnSelected: (filterName: string) => {
    helmPage.selectHelmFilterDropDown();
    cy.get(helmPO.filterDropdown).click();
    switch (filterName) {
      case 'Deployed': {
        cy.get(helmPO.deployedCheckbox).uncheck().should('not.be.checked');
        break;
      }
      case 'Failed': {
        cy.get(helmPO.failedCheckbox).uncheck().should('not.be.checked');
        break;
      }
      case 'Other': {
        cy.get(helmPO.failedCheckbox).uncheck().should('not.be.checked');
        break;
      }
      case 'All': {
        cy.get(helmPO.deployedCheckbox).uncheck().should('not.be.checked');
        cy.get(helmPO.failedCheckbox).uncheck().should('not.be.checked');
        cy.get(helmPO.otherCheckbox).uncheck().should('not.be.checked');
        break;
      }
      default: {
        throw new Error(`${filterName} filter is not available in filter drop down`);
      }
    }
  },
  verifyHelmFilterSelected: (filterName: string) => {
    helmPage.selectHelmFilterDropDown();
    cy.get(helmPO.filterDropdown).click();
    switch (filterName) {
      case 'Deployed': {
        cy.get(helmPO.deployedCheckbox).should('be.checked');
        break;
      }
      case 'Failed': {
        cy.get(helmPO.failedCheckbox).should('be.checked');
        break;
      }
      case 'Other': {
        cy.get(helmPO.otherCheckbox).should('be.checked');
        break;
      }
      case 'All': {
        cy.get(helmPO.deployedCheckbox).should('be.checked');
        cy.get(helmPO.failedCheckbox).should('be.checked');
        cy.get(helmPO.otherCheckbox).should('be.checked');
        break;
      }
      default: {
        throw new Error(`${filterName} filter is not available in filter drop down`);
      }
    }
    helmPage.selectHelmFilterDropDown();
  },
  clearAllFilter: () => {
    // eslint-disable-next-line promise/catch-or-return
    cy.get(helmPO.filterToolBar).then((body) => {
      if (body.find(`button`).text().includes('Clear all filters')) {
        cy.get('[data-test="filter-toolbar"] button').contains('Clear all filters').click();
      }
    });
  },
  selectHelmActionFromMenu: (actionName: helmActions | string) => {
    switch (actionName) {
      case 'Upgrade':
      case helmActions.upgrade:
        cy.get(helmPO.helmActions.upgrade).click();
        break;
      case 'Rollback':
      case helmActions.rollback:
        cy.get(helmPO.helmActions.rollBack).click();
        break;
      case 'Delete Helm Release':
      case helmActions.deleteHelmRelease:
        cy.get(helmPO.helmActions.deleteHelmRelease).click();
        break;
      default:
        cy.log(`${actionName} is not available in dropdown menu`);
        break;
    }
  },
  verifyInstallHelmChartLink: (installLink: string) =>
    cy.get('a').contains(installLink).should('be.visible'),
  verifyDropdownItem: (item1: string, item2: string, item3: string) => {
    cy.get(helmPO.filterDropdown).click();
    cy.get(helmPO.filter.pendingInstall).should('contain.text', item1);
    cy.get(helmPO.filter.pendingUpgrade).should('contain.text', item2);
    cy.get(helmPO.filter.pendingRollback).should('contain.text', item3);
  },
};
