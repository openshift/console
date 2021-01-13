import { checkErrors, testName } from '../../support';
import { nav } from '../../views/nav';
import { listPage } from '../../views/list-page';
import { modal } from '../../views/modal';
import { detailsPage } from '../../views/details-page';
import { roleBindings } from '../../views/rolebindings';
import { errorMessage } from '../../views/form';

describe('RoleBindings', () => {
  const bindingName = `${testName}-cluster-admin`;
  const roleName = 'cluster-admin';
  before(() => {
    cy.login();
    cy.visit('/');
    nav.sidenav.switcher.changePerspectiveTo('Administrator');
    nav.sidenav.switcher.shouldHaveText('Administrator');
    cy.createProject(testName);
  });

  afterEach(() => {
    checkErrors();
  });

  after(() => {
    cy.deleteProject(testName);
    cy.logout();
  });

  it('creates a RoleBinding, displays the RoleBinding in the list view, and then deletes it', () => {
    cy.visit(`/k8s/all-namespaces/rolebindings`);
    detailsPage.isLoaded();
    listPage.clickCreateYAMLbutton();
    roleBindings.titleShouldHaveText('Create Role Binding');
    roleBindings.inputName(bindingName);
    roleBindings.selectNamespace(testName);
    roleBindings.selectRole(roleName);
    roleBindings.inputSubject('subject-name');
    roleBindings.clickSaveChangesButton();
    cy.get(errorMessage).should('not.exist');
    cy.visit(`/k8s/all-namespaces/rolebindings`);
    listPage.rows.shouldBeLoaded();
    listPage.filter.byName(bindingName);
    listPage.rows.shouldExist(bindingName);
    listPage.rows.clickKebabAction(bindingName, 'Delete Role Binding');
    modal.shouldBeOpened();
    modal.submit();
    modal.shouldBeClosed();
    cy.resourceShouldBeDeleted(testName, 'RoleBinding', bindingName);
  });
});
