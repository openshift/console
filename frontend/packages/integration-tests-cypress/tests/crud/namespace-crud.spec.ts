import { checkErrors, testName } from '../../support';
import { listPage } from '../../views/list-page';
import { modal } from '../../views/modal';
import { nav } from '../../views/nav';
import { projectDropdown } from '../../views/common';

describe('Namespace', () => {
  before(() => {
    cy.login();
    cy.createProject(testName);
  });

  afterEach(() => {
    checkErrors();
  });

  after(() => {
    cy.deleteProject(testName);
    cy.logout();
  });

  const newName = `${testName}-ns`;

  it('lists, creates, and deletes', () => {
    cy.log('test Namespace list page');
    cy.visit('/k8s/cluster/namespaces');
    listPage.rows.shouldNotExist(newName);
    listPage.filter.byName(testName);
    listPage.rows.shouldExist(testName); // created via cy.createProject(testName) above
    cy.testA11y('Namespace List page');

    cy.log('creates the Namespace');
    listPage.clickCreateYAMLbutton();
    modal.shouldBeOpened();
    cy.byTestID('input-name').type(newName);
    cy.testA11y('Create Namespace modal', '#modal-container');
    modal.submit();
    modal.shouldBeClosed();
    cy.url().should('include', `/k8s/cluster/namespaces/${newName}`);

    cy.log('delete the Namespace');
    cy.visit('/k8s/cluster/namespaces');
    listPage.filter.byName(newName);
    listPage.rows.shouldExist(newName);
    listPage.rows.clickKebabAction(newName, 'Delete Namespace');
    modal.shouldBeOpened();
    cy.byTestID('project-name-input').type(newName);
    cy.testA11y('Delete Namespace modal', '#modal-container');
    modal.submit();
    modal.shouldBeClosed();
    cy.resourceShouldBeDeleted(testName, 'namespaces', newName);
  });

  it('nav and breadcrumbs restores last selected "All Projects" when navigating from details to list view', () => {
    nav.sidenav.clickNavLink(['Workloads', 'Secrets']);
    projectDropdown.selectProject('All Projects');
    projectDropdown.shouldContain('All Projects');
    cy.log(
      'Nav from list page to details page should change Project from "All Projects" to resource specific project',
    );
    cy.get(`[data-test-rows="resource-row"]`)
      .first()
      .find('a')
      .first()
      .click();
    projectDropdown.shouldNotContain('All Projects'); // after drilldown to Details page, project should be specific to resource
    cy.log(
      'Nav back to list page from details page via sidebar nav menu should change Project back to "All Projects"',
    );
    nav.sidenav.clickNavLink(['Workloads', 'Secrets']);
    projectDropdown.shouldContain('All Projects');
    cy.log(
      'Nav back to list page from details page via sidebar nav menu should change Project back to "All Projects"',
    );
    cy.get(`[data-test-rows="resource-row"]`)
      .first()
      .find('a')
      .first()
      .click();
    projectDropdown.shouldNotContain('All Projects'); // after drilldown to Details page, project should be specific to resource
    cy.byLegacyTestID('breadcrumb-link-0').click();
    projectDropdown.shouldContain('All Projects');
  });

  it('nav and breadcrumbs restores last selected Project when navigating from details to list view', () => {
    nav.sidenav.clickNavLink(['Workloads', 'Secrets']);
    projectDropdown.selectProject('default');
    projectDropdown.shouldContain('default');
    cy.get(`[data-test-rows="resource-row"]`)
      .first()
      .find('a')
      .first()
      .click();
    projectDropdown.shouldContain('default');
    nav.sidenav.clickNavLink(['Workloads', 'Secrets']);
    projectDropdown.shouldContain('default');
    cy.get(`[data-test-rows="resource-row"]`)
      .first()
      .find('a')
      .first()
      .click();
    projectDropdown.shouldContain('default');
    cy.byLegacyTestID('breadcrumb-link-0').click();
    projectDropdown.shouldContain('default');
  });
});
