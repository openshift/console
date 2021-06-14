import { checkErrors, testName } from '../../support';
import { projectDropdown } from '../../views/common';
import { detailsPage } from '../../views/details-page';
import { listPage } from '../../views/list-page';
import { modal } from '../../views/modal';
import { nav } from '../../views/nav';

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
  const defaultProjectName = 'default';
  const allProjectsDropdownLabel = 'All Projects';

  it('lists, creates, and deletes', () => {
    cy.log('test Namespace list page');
    nav.sidenav.clickNavLink(['Administration', 'Namespaces']);
    listPage.rows.shouldNotExist(newName);
    listPage.filter.byName(testName);
    listPage.rows.shouldExist(testName); // created via cy.createProject(testName) above
    cy.testA11y('Namespace List page');

    cy.log('creates the Namespace');
    listPage.clickCreateYAMLbutton();
    modal.shouldBeOpened();
    cy.byTestID('input-name').type(newName);
    cy.testA11y('Create Namespace modal');
    modal.submit();
    modal.shouldBeClosed();
    cy.url().should('include', `/k8s/cluster/namespaces/${newName}`);

    cy.log('delete the Namespace');
    nav.sidenav.clickNavLink(['Administration', 'Namespaces']);
    listPage.filter.byName(newName);
    listPage.rows.shouldExist(newName);
    listPage.rows.clickKebabAction(newName, 'Delete Namespace');
    modal.shouldBeOpened();
    cy.byTestID('project-name-input').type(newName);
    cy.testA11y('Delete Namespace modal');
    modal.submit();
    modal.shouldBeClosed();
    cy.resourceShouldBeDeleted(testName, 'namespaces', newName);
  });

  it('Nav and breadcrumbs restores last selected "All Projects" when navigating from details to list view', () => {
    nav.sidenav.clickNavLink(['Networking', 'Services']);
    projectDropdown.selectProject(allProjectsDropdownLabel);
    projectDropdown.shouldContain(allProjectsDropdownLabel);
    listPage.rows.shouldBeLoaded();
    cy.log(
      'List page to details page should change Project from "All Projects" to resource specific project',
    );
    listPage.filter.byName('kubernetes');
    listPage.rows.countShouldBe(1);
    listPage.rows.clickRowByName('kubernetes');
    detailsPage.isLoaded();
    projectDropdown.shouldContain(defaultProjectName);
    nav.sidenav.clickNavLink(['Networking', 'Services']);
    listPage.rows.shouldBeLoaded();
    projectDropdown.shouldContain(allProjectsDropdownLabel);
    cy.log('Details page to list page via breadcrumb should change Project back to "All Projects"');
    listPage.filter.byName('kubernetes');
    listPage.rows.countShouldBe(1);
    listPage.rows.clickRowByName('kubernetes');
    detailsPage.isLoaded();
    projectDropdown.shouldContain(defaultProjectName);
    detailsPage
      .breadcrumb(0)
      .contains('Services')
      .click();
    listPage.rows.shouldBeLoaded();
    projectDropdown.shouldContain(allProjectsDropdownLabel);
  });

  it('Nav and breadcrumbs restores last selected project when navigating from details to list view', () => {
    nav.sidenav.clickNavLink(['Workloads', 'Secrets']);
    projectDropdown.selectProject(defaultProjectName);
    projectDropdown.shouldContain(defaultProjectName);
    listPage.rows.clickFirstLinkInFirstRow();
    detailsPage.isLoaded();
    projectDropdown.shouldContain(defaultProjectName);
    nav.sidenav.clickNavLink(['Workloads', 'Secrets']);
    projectDropdown.shouldContain(defaultProjectName);
    listPage.rows.clickFirstLinkInFirstRow();
    detailsPage.isLoaded();
    projectDropdown.shouldContain(defaultProjectName);
    detailsPage
      .breadcrumb(0)
      .contains('Secrets')
      .click();
    listPage.rows.shouldBeLoaded();
    projectDropdown.shouldContain(defaultProjectName);
  });
});
