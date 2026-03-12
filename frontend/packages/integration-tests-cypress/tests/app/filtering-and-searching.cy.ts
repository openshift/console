import { safeLoad, safeDump } from 'js-yaml';
import * as _ from 'lodash';
import { checkErrors, testName } from '../../support';
import { detailsPage } from '../../views/details-page';
import { listPage } from '../../views/list-page';
import { modal } from '../../views/modal';
import * as yamlEditor from '../../views/yaml-editor';

const SEARCH_NAMESPACE = 'openshift-authentication-operator';
const SEARCH_DEPLOYMENT_NAME = 'authentication-operator';

describe('Filtering and Searching', () => {
  let WORKLOAD_NAME;
  let WORKLOAD_LABEL;

  before(() => {
    cy.login();
    cy.createProjectWithCLI(testName);
    cy.visit(`/k8s/ns/${testName}/apps~v1~Deployment`);
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
    cy.visit(`/k8s/ns/${testName}/apps~v1~Deployment`);
    listPage.dvRows.shouldBeLoaded();
    listPage.dvFilter.byName(WORKLOAD_NAME);
    listPage.dvRows.clickKebabAction(WORKLOAD_NAME, 'Delete Deployment');
    modal.shouldBeOpened();
    modal.submit();
    modal.shouldBeClosed();
    cy.deleteProjectWithCLI(testName);
  });

  it('filters Pod from object detail', () => {
    cy.visit(`/k8s/ns/${testName}/apps~v1~Deployment`);
    listPage.dvRows.shouldExist(WORKLOAD_NAME);
    cy.visit(`/k8s/ns/${testName}/apps~v1~Deployment/${WORKLOAD_NAME}/pods`);
    listPage.dvRows.shouldBeLoaded();
    listPage.dvFilter.byName(WORKLOAD_NAME);
    listPage.dvRows.countShouldBe(3);
  });

  it('filters invalid Pod from object detail', () => {
    cy.visit(`/k8s/ns/${testName}/apps~v1~Deployment/${WORKLOAD_NAME}/pods`);
    listPage.dvRows.shouldBeLoaded();
    listPage.dvFilter.byName('XYZ123');
    cy.get('[data-test="data-view-table"]').within(() => {
      cy.get('.pf-v6-l-bullseye').should('contain', 'No Pods found');
    });
  });

  it('filters from Pods list', () => {
    cy.visit(`/k8s/all-namespaces/core~v1~Pod`);
    listPage.dvRows.shouldBeLoaded();
    listPage.dvFilter.byName(WORKLOAD_NAME);
    listPage.dvRows.countShouldBe(3);
  });

  it('displays namespace on Search when All Namespaces is selected', () => {
    cy.visit(
      `/search/all-namespaces?kind=apps~v1~Deployment&page=1&perPage=50&name=${SEARCH_DEPLOYMENT_NAME}`,
    );
    listPage.dvRows.countShouldBe(1);
    cy.get(`[data-test-id="${SEARCH_NAMESPACE}"]`).should('exist');
  });

  it('does not display namespace on Search when namespace is selected', () => {
    cy.visit(
      `/search/ns/${SEARCH_NAMESPACE}?kind=apps~v1~Deployment&page=1&perPage=50&name=${SEARCH_DEPLOYMENT_NAME}`,
    );
    listPage.dvRows.countShouldBe(1);
    cy.get(`[data-test-id="${SEARCH_NAMESPACE}"]`).should('not.exist');
  });

  it('searches for object by kind and label', () => {
    cy.visit(`/search/ns/${testName}`, { qs: { kind: 'Deployment', q: WORKLOAD_LABEL } });
    listPage.dvRows.shouldExist(WORKLOAD_NAME);
  });

  it('searches for object by kind, label, and name', () => {
    cy.visit(`/search/all-namespaces`, {
      qs: { kind: 'Pod', q: 'app=name', name: WORKLOAD_NAME },
    });
    listPage.dvRows.countShouldBe(3);
  });
});
