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
    cy.testA11y('Create Namespace modal');
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
    cy.testA11y('Delete Namespace modal');
    modal.submit();
    modal.shouldBeClosed();
    cy.resourceShouldBeDeleted(testName, 'namespaces', newName);
  });
});
