import { safeLoad, safeDump } from 'js-yaml';
import * as _ from 'lodash';
import { checkErrors, testName } from '../../support';
import { projectDropdown } from '../../views/common';
import { detailsPage } from '../../views/details-page';
import { errorMessage } from '../../views/form';
import { listPage } from '../../views/list-page';
import { modal } from '../../views/modal';
import { nav } from '../../views/nav';
import { roleBindings } from '../../views/rolebindings';
import * as yamlEditor from '../../views/yaml-editor';

const roleName = 'example-role';
const clusterRoleName = 'example-cluster-role';
const roleBindingName = 'example-rolebinding';
const clusterRoleBindingName = 'example-cluster-rolebinding';

const createExampleRoles = () => {
  cy.log('create Role instance');
  nav.sidenav.clickNavLink(['User Management', 'Roles']);
  listPage.rows.shouldBeLoaded();
  projectDropdown.selectProject(testName);
  projectDropdown.shouldContain(testName);
  listPage.clickCreateYAMLbutton();
  // sidebar needs to be fully loaded, else it sometimes overlays the Create button
  cy.byTestID('resource-sidebar').should('exist');
  yamlEditor.isLoaded();
  let newContent;
  yamlEditor.getEditorContent().then((content) => {
    newContent = _.defaultsDeep({}, { metadata: { name: roleName } }, safeLoad(content));
    yamlEditor.setEditorContent(safeDump(newContent)).then(() => {
      yamlEditor.clickSaveCreateButton();
      cy.get(errorMessage).should('not.exist');
    });
  });
  detailsPage.breadcrumb(0).click();

  cy.log('create ClusterRole instance');
  listPage.rows.shouldBeLoaded();
  listPage.clickCreateYAMLbutton();
  cy.byTestID('resource-sidebar').should('exist');
  yamlEditor.isLoaded();
  yamlEditor.getEditorContent().then((content) => {
    newContent = _.defaultsDeep(
      {},
      { kind: 'ClusterRole', metadata: { name: clusterRoleName } },
      safeLoad(content),
    );
    yamlEditor.setEditorContent(safeDump(newContent)).then(() => {
      yamlEditor.clickSaveCreateButton();
      cy.get(errorMessage).should('not.exist');
    });
  });
  detailsPage.breadcrumb(0).click();
};

const createExampleRoleBindings = () => {
  cy.log('create RoleBindings instance');
  nav.sidenav.clickNavLink(['User Management', 'RoleBindings']);
  listPage.rows.shouldBeLoaded();
  listPage.clickCreateYAMLbutton();
  roleBindings.titleShouldHaveText('Create RoleBinding');
  roleBindings.inputName(roleBindingName);
  roleBindings.selectNamespace(testName);
  roleBindings.selectRole('cluster-admin');
  roleBindings.inputSubject('subject-name');
  roleBindings.clickSaveChangesButton();
  cy.get(errorMessage).should('not.exist');

  cy.log('create ClusterRoleBindings instance');
  nav.sidenav.clickNavLink(['User Management', 'RoleBindings']);
  listPage.rows.shouldBeLoaded();
  listPage.clickCreateYAMLbutton();
  roleBindings.titleShouldHaveText('Create RoleBinding');
  cy.byTestID('Cluster-wide role binding (ClusterRoleBinding)-radio-input').click();
  roleBindings.inputName(clusterRoleBindingName);
  roleBindings.selectRole('cluster-admin');
  roleBindings.inputSubject('subject-name');
  roleBindings.clickSaveChangesButton();
  cy.get(errorMessage).should('not.exist');
  nav.sidenav.clickNavLink(['User Management', 'RoleBindings']);
};

const deleteClusterExamples = () => {
  cy.log('delete ClusterRole instance');
  nav.sidenav.clickNavLink(['User Management', 'Roles']);
  listPage.rows.shouldBeLoaded();
  listPage.filter.byName(clusterRoleName);
  listPage.rows.clickKebabAction(clusterRoleName, 'Delete ClusterRole');
  modal.shouldBeOpened();
  modal.submit();
  modal.shouldBeClosed();
  detailsPage.isLoaded();
  cy.log('delete ClusterRoleBindings instance');
  nav.sidenav.clickNavLink(['User Management', 'RoleBindings']);
  listPage.rows.shouldBeLoaded();
  listPage.filter.byName(clusterRoleBindingName);
  listPage.rows.clickKebabAction(clusterRoleBindingName, 'Delete ClusterRoleBinding');
  modal.shouldBeOpened();
  modal.submit();
  modal.shouldBeClosed();
  detailsPage.isLoaded();
};

describe('Roles and RoleBindings', () => {
  before(() => {
    cy.login();
    cy.createProject(testName);
    createExampleRoles();
    createExampleRoleBindings();
  });

  afterEach(() => {
    checkErrors();
  });

  after(() => {
    deleteClusterExamples();
    cy.deleteProject(testName);
    cy.logout();
  });

  const allProjectsDropdownLabel = 'All Projects';
  ['Roles', 'RoleBindings'].forEach((rolesOrBindings) => {
    const roleOrBindingName = rolesOrBindings === 'Roles' ? roleName : roleBindingName;
    const clusterRoleOrBindingName =
      rolesOrBindings === 'Roles' ? clusterRoleName : clusterRoleBindingName;

    it(`test ${rolesOrBindings} detail page breadcrumbs to list page restores 'All Projects' dropdown`, () => {
      nav.sidenav.clickNavLink(['User Management', rolesOrBindings]);
      projectDropdown.selectProject(allProjectsDropdownLabel);
      listPage.rows.shouldBeLoaded();
      listPage.filter.by('namespace');
      listPage.filter.byName(roleOrBindingName);
      listPage.rows.clickRowByName(roleOrBindingName);
      detailsPage.isLoaded();
      projectDropdown.shouldContain(testName);
      detailsPage
        .breadcrumb(0)
        .contains(rolesOrBindings)
        .click();
      listPage.rows.shouldBeLoaded();
      projectDropdown.shouldContain(allProjectsDropdownLabel);
    });

    it(`test ${rolesOrBindings} detail page breadcrumbs to list page restores last selected project`, () => {
      nav.sidenav.clickNavLink(['User Management', rolesOrBindings]);
      projectDropdown.selectProject(testName);
      projectDropdown.shouldContain(testName);
      listPage.rows.shouldBeLoaded();
      listPage.filter.by('namespace');
      listPage.filter.byName(roleOrBindingName);
      listPage.rows.clickRowByName(roleOrBindingName);
      detailsPage.isLoaded();
      projectDropdown.shouldContain(testName);
      detailsPage
        .breadcrumb(0)
        .contains(rolesOrBindings)
        .click();
      listPage.rows.shouldBeLoaded();
      projectDropdown.shouldContain(testName);
    });

    it(`test Cluster${rolesOrBindings} detail page breadcrumbs to list page restores 'All Projects' dropdown`, () => {
      nav.sidenav.clickNavLink(['User Management', rolesOrBindings]);
      projectDropdown.selectProject(allProjectsDropdownLabel);
      listPage.rows.shouldBeLoaded();
      listPage.filter.by('cluster');
      listPage.filter.numberOfActiveFiltersShouldBe(1);
      listPage.filter.byName(clusterRoleOrBindingName);
      listPage.rows.clickRowByName(clusterRoleOrBindingName);
      detailsPage.isLoaded();
      projectDropdown.shouldNotExist();
      detailsPage
        .breadcrumb(0)
        .contains(rolesOrBindings)
        .click();
      listPage.rows.shouldBeLoaded();
      projectDropdown.shouldContain(allProjectsDropdownLabel);
    });

    it(`test Cluster${rolesOrBindings} detail page breadcrumbs to list page restores last selected project`, () => {
      nav.sidenav.clickNavLink(['User Management', rolesOrBindings]);
      listPage.rows.shouldBeLoaded();
      projectDropdown.selectProject(testName);
      projectDropdown.shouldContain(testName);
      listPage.filter.by('cluster');
      listPage.filter.byName(clusterRoleOrBindingName);
      listPage.rows.clickRowByName(clusterRoleOrBindingName);
      detailsPage.isLoaded();
      projectDropdown.shouldNotExist();
      detailsPage
        .breadcrumb(0)
        .contains(rolesOrBindings)
        .click();
      listPage.rows.shouldBeLoaded();
      projectDropdown.shouldContain(testName);
    });
  });
});
