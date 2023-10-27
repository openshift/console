import { checkErrors, testName } from '../../support';
import { detailsPage } from '../../views/details-page';
import { errorMessage } from '../../views/form';
import { listPage } from '../../views/list-page';
import * as yamlEditor from '../../views/yaml-editor';

const POD_NAME = `pod1`;
const CONTAINER_NAME = `container1`;
const testPod = `apiVersion: v1
kind: Pod
metadata:
  name: ${POD_NAME}
  labels:
    role: testrole
spec:
  containers:
    - name:  ${CONTAINER_NAME}
      image: nginx
      ports:
        - name: web
          containerPort: 80
          protocol: TCP
`;

describe('Pod log viewer tab', () => {
  before(() => {
    cy.login();
    cy.createProjectWithCLI(testName);
  });

  afterEach(() => {
    checkErrors();
  });

  after(() => {
    cy.visit('/');
    cy.deleteProjectWithCLI(testName);
  });

  it('Create test pod', () => {
    cy.visit(`/k8s/ns/${testName}/import`);
    yamlEditor.isImportLoaded();
    yamlEditor.setEditorContent(testPod).then(() => {
      yamlEditor.clickSaveCreateButton();
      cy.get(errorMessage).should('not.exist');
      detailsPage.sectionHeaderShouldExist('Pod details');
    });
  });

  it('Open logs from pod details page tab', () => {
    cy.visit(`/k8s/ns/${testName}/pods`);
    listPage.rows.shouldExist(POD_NAME);
    cy.visit(`/k8s/ns/${testName}/pods/${POD_NAME}`);
    detailsPage.isLoaded();
    detailsPage.selectTab('Logs');
    detailsPage.isLoaded();
    cy.byTestID('popover-show-full-log').click();
    cy.byTestID('popover-show-full-log').uncheck();
  });
});
