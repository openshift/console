import { checkErrors, testName } from '../../support';
import { listPage } from '../../views/list-page';
import { modal } from '../../views/modal';

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

  it('lists, creates, edits labels, and deletes', () => {
    const labelAppFrontend = 'app=frontend';
    cy.log('test Namespace list page');
    cy.visit('/k8s/cluster/namespaces');
    listPage.rows.shouldNotExist(newName);
    listPage.filter.byName(testName);
    listPage.rows.shouldExist(testName); // created via cy.createProject(testName) above

    cy.log('creates the Namespace');
    listPage.clickCreateYAMLbutton();
    modal.shouldBeOpened();
    cy.byTestID('input-name').type(newName);
    modal.submit();
    modal.shouldBeClosed();
    cy.url().should('include', `/k8s/cluster/namespaces/${newName}`);

    cy.log('updates the Namespace labels');
    cy.visit('/k8s/cluster/namespaces');
    listPage.filter.byName(newName);
    listPage.rows.hasLabel(newName, 'No labels');
    listPage.rows.clickKebabAction(newName, 'Edit Labels');
    modal.shouldBeOpened();
    cy.byTestID('tags-input').type(labelAppFrontend);
    modal.submit();
    modal.shouldBeClosed();
    listPage.rows.hasLabel(newName, labelAppFrontend);

    cy.log('delete the Namespace');
    cy.visit('/k8s/cluster/namespaces');
    listPage.filter.byName(newName);
    listPage.rows.shouldExist(newName);
    listPage.rows.clickKebabAction(newName, 'Delete Namespace');
    modal.shouldBeOpened();
    cy.byTestID('project-name-input').type(newName);
    modal.submit();
    modal.shouldBeClosed();
    listPage.rows.shouldNotExist(newName);
  });
});
