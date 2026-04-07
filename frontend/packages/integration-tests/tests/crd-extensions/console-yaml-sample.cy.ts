import { safeLoad, safeDump } from 'js-yaml';
import * as _ from 'lodash';
import { checkErrors, testName } from '../../support';
import { detailsPage } from '../../views/details-page';
import { listPage } from '../../views/list-page';
import * as resourceSidebar from '../../views/resource-sidebar';
import * as yamlEditor from '../../views/yaml-editor';

const crd = 'ConsoleYAMLSample';
const testJobName = 'test-job';

describe(`${crd} CRD`, () => {
  const name = `${testName}-cys`;
  const namespace = name;
  const crdObj = {
    apiVersion: 'console.openshift.io/v1',
    kind: 'ConsoleYAMLSample',
    metadata: {
      name,
    },
    spec: {
      targetResource: {
        apiVersion: 'batch/v1',
        kind: 'Job',
      },
      title: 'Example Job',
      description: 'An example Job YAML sample',
      yaml: `apiVersion: batch/v1
kind: Job
metadata:
  name: ${testJobName}
  namespace: ${namespace}
  spec:
  template:
    metadata:
      name: countdown
      namespace: ${namespace}
    spec:
      containers:
      - name: counter
        image: centos:7
        command:
        - "bin/bash"
        - "-c"
        - "echo Test"
      restartPolicy: Never`,
    },
  };

  before(() => {
    cy.login();
    cy.initAdmin();
    cy.createProjectWithCLI(testName);
  });

  after(() => {
    cy.deleteProjectWithCLI(testName);
    checkErrors();
  });

  it(`creates, displays, tests and deletes a new ${crd} instance`, () => {
    cy.visit(`/k8s/cluster/customresourcedefinitions?name=${crd}`);
    listPage.isCreateButtonVisible();
    listPage.dvRows.shouldBeLoaded();
    listPage.dvRows.clickKebabAction(crd, 'View instances');
    listPage.titleShouldHaveText(crd);
    listPage.clickCreateYAMLbutton();
    yamlEditor.isLoaded();
    yamlEditor.getEditorContent().then((content) => {
      const newContent = _.defaultsDeep({}, crdObj, safeLoad(content));
      yamlEditor.setEditorContent(safeDump(newContent, { sortKeys: true })).then(() => {
        yamlEditor.clickSaveCreateButton();
        cy.byTestID('yaml-error').should('not.exist');
      });
    });

    cy.visit(`/k8s/cluster/console.openshift.io~v1~${crd}`);
    listPage.dvRows.shouldBeLoaded();
    cy.log('Additional printer columns should not exist.');
    cy.get('[data-test^="additional-printer-column-header-"]').should('not.exist');
    cy.log('Created date should exist since Age does not.');
    cy.byTestID('column-header-Created').should('exist');
    cy.byTestID('column-data-Created').should('exist');

    // Check if ConsoleYAMLSample CR was created
    cy.visit(`/k8s/cluster/console.openshift.io~v1~${crd}/${name}`);
    detailsPage.isLoaded();
    detailsPage.titleShouldContain(name);
    cy.log('Additional printer columns should not exist.');
    cy.byTestID('additional-printer-columns').should('not.exist');

    // Create Job from sample
    cy.visit(`k8s/ns/${testName}/batch~v1~Job`);
    listPage.clickCreateYAMLbutton();
    resourceSidebar.isLoaded();
    yamlEditor.isLoaded();
    resourceSidebar.selectTab('Samples');
    resourceSidebar.isSampleListLoaded();
    resourceSidebar.loadFirstSample();
    yamlEditor.clickSaveCreateButton();

    // Check if Job was created
    cy.visit(`k8s/ns/${testName}/batch~v1~Job/${testJobName}`);
    detailsPage.titleShouldContain(testJobName);

    // Delete CRD
    cy.exec(`oc delete ${crd} ${name}`);
  });
});
