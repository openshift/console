import { safeLoad, safeDump } from 'js-yaml';
import * as _ from 'lodash';
import { checkErrors, testName } from '../../support';
import { detailsPage } from '../../views/details-page';
import { listPage } from '../../views/list-page';
import { modal } from '../../views/modal';
import * as yamlEditor from '../../views/yaml-editor';

describe('Filtering and Searching', () => {
  let WORKLOAD_NAME;
  let WORKLOAD_LABEL;

  before(() => {
    cy.login();
    cy.createProjectWithCLI(testName);
    cy.visit(`/k8s/ns/${testName}/deployments`);
    listPage.clickCreateYAMLbutton();
    cy.byTestID('yaml-view-input').click();

    WORKLOAD_NAME = `filter-${testName}`;
    WORKLOAD_LABEL = `lbl-filter=${testName}`;

    yamlEditor.isLoaded();
    yamlEditor.getEditorContent().then((content) => {
      const newContent = _.defaultsDeep(
        {},
        { metadata: { name: WORKLOAD_NAME, labels: { 'lbl-filter': testName } } },
        safeLoad(content),
      );
      yamlEditor.setEditorContent(safeDump(newContent)).then(() => {
        yamlEditor.clickSaveCreateButton();
        cy.byTestID('yaml-error').should('not.exist');
        detailsPage.sectionHeaderShouldExist('Deployment details');
      });
    });
  });

  afterEach(() => {
    checkErrors();
  });

  after(() => {
    cy.visit(`/k8s/ns/${testName}/deployments`);
    listPage.rows.shouldBeLoaded();
    listPage.filter.byName(WORKLOAD_NAME);
    listPage.rows.clickKebabAction(WORKLOAD_NAME, 'Delete Deployment');
    modal.shouldBeOpened();
    modal.submit();
    modal.shouldBeClosed();
    cy.deleteProjectWithCLI(testName);
  });

  it('filters Pod from object detail', () => {
    cy.visit(`/k8s/ns/${testName}/deployments`);
    listPage.rows.shouldExist(WORKLOAD_NAME);
    cy.visit(`/k8s/ns/${testName}/deployments/${WORKLOAD_NAME}/pods`);
    listPage.rows.shouldBeLoaded();
    listPage.filter.byName(WORKLOAD_NAME);
    listPage.rows.shouldExist(WORKLOAD_NAME);
  });

  it('filters invalid Pod from object detail', () => {
    cy.visit(`/k8s/ns/${testName}/deployments/${WORKLOAD_NAME}/pods`);
    listPage.rows.shouldBeLoaded();
    listPage.filter.byName('XYZ123');
    cy.byTestID('empty-message').should('be.visible');
  });

  it('filters from Pods list', () => {
    cy.visit(`/k8s/all-namespaces/pods`);
    listPage.rows.shouldBeLoaded();
    listPage.filter.byName(WORKLOAD_NAME);
    listPage.rows.shouldExist(WORKLOAD_NAME);
  });

  it('searches for object by kind and label', () => {
    cy.visit(`/search/ns/${testName}`, { qs: { kind: 'Deployment', q: WORKLOAD_LABEL } });
    listPage.rows.shouldExist(WORKLOAD_NAME);
  });

  it('searches for object by kind, label, and name', () => {
    cy.visit(`/search/all-namespaces`, {
      qs: { kind: 'Pod', q: 'app=name', name: WORKLOAD_NAME },
    });
    listPage.rows.shouldExist(WORKLOAD_NAME);
  });
});
