import { checkErrors, testName } from '../../support';
import { projectDropdown } from '../../views/common';
import { detailsPage } from '../../views/details-page';
import { listPage } from '../../views/list-page';
import { modal } from '../../views/modal';
import { nav } from '../../views/nav';

describe('Namespace', () => {
  before(() => {
    cy.login();
    cy.createProjectWithCLI(testName);
  });

  afterEach(() => {
    checkErrors();
  });

  after(() => {
    cy.deleteProjectWithCLI(testName);
  });

  const newName = `${testName}-ns`;
  const defaultProjectName = 'default';
  const allProjectsDropdownLabel = 'All Projects';

  it('lists, creates, and deletes', () => {
    cy.log('test Namespace list page');
    nav.sidenav.clickNavLink(['Administration', 'Namespaces']);
    listPage.dvRows.shouldNotExist(newName);
    listPage.dvFilter.byName(testName);
    listPage.dvRows.shouldExist(testName); // created via cy.createProjectWithCLI(testName) above
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
    listPage.dvFilter.byName(newName);
    listPage.dvRows.shouldExist(newName);
    listPage.dvRows.clickKebabAction(newName, 'Delete Namespace');
    modal.shouldBeOpened();
    cy.byTestID('project-name-input').type(newName);
    cy.testA11y('Delete Namespace modal');
    modal.submit();
    modal.shouldBeClosed();
    cy.resourceShouldBeDeleted(testName, 'namespaces', newName);
  });

  it('Nav and breadcrumbs restores last selected "All Projects" when navigating from details to list view', () => {
    nav.sidenav.clickNavLink(['Workloads', 'Pods']);
    projectDropdown.selectProject(allProjectsDropdownLabel);
    projectDropdown.shouldContain(allProjectsDropdownLabel);
    listPage.dvRows.shouldBeLoaded();

    cy.log(
      'List page to details page should change Project from "All Projects" to resource specific project',
    );

    listPage.dvRows
      .getFirstElementName()
      .invoke('text')
      .then((text) => {
        listPage.dvFilter.byName(text);
        listPage.dvRows.countShouldBeWithin(1, 3);
        listPage.dvRows.clickRowByName(text);
        detailsPage.isLoaded();
        projectDropdown.shouldNotContain(allProjectsDropdownLabel);
        nav.sidenav.clickNavLink(['Workloads', 'Pods']);
        listPage.dvRows.shouldBeLoaded();
        projectDropdown.shouldContain(allProjectsDropdownLabel);
        cy.log(
          'Details page to list page via breadcrumb should change Project back to "All Projects"',
        );
        listPage.dvFilter.byName(text);
        listPage.dvRows.countShouldBeWithin(1, 3);
        listPage.dvRows.clickRowByName(text);
        detailsPage.isLoaded();
        projectDropdown.shouldNotContain(allProjectsDropdownLabel);
        detailsPage.breadcrumb(0).contains('Pods').click();
        listPage.dvRows.shouldBeLoaded();
        projectDropdown.shouldContain(allProjectsDropdownLabel);
      });
  });

  it('Nav and breadcrumbs restores last selected project when navigating from details to list view', () => {
    nav.sidenav.clickNavLink(['Workloads', 'Secrets']);
    projectDropdown.selectProject(defaultProjectName);
    projectDropdown.shouldContain(defaultProjectName);
    listPage.dvRows.clickFirstLinkInFirstRow();
    detailsPage.isLoaded();
    projectDropdown.shouldContain(defaultProjectName);
    nav.sidenav.clickNavLink(['Workloads', 'Secrets']);
    projectDropdown.shouldContain(defaultProjectName);
    listPage.dvRows.clickFirstLinkInFirstRow();
    detailsPage.isLoaded();
    projectDropdown.shouldContain(defaultProjectName);
    detailsPage.breadcrumb(0).contains('Secrets').click();
    listPage.dvRows.shouldBeLoaded();
    projectDropdown.shouldContain(defaultProjectName);
  });
});
