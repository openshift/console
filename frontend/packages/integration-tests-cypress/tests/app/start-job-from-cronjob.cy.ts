import { checkErrors, testName } from '../../support';
import { detailsPage } from '../../views/details-page';
import { listPage } from '../../views/list-page';
import * as yamlEditor from '../../views/yaml-editor';

const CRONJOB_NAME = 'cronjob1';

const cronJobReqPayload = `apiVersion: batch/v1
kind: CronJob
metadata:
  name: ${CRONJOB_NAME}
  namespace:  ${testName}
spec:
  schedule: '@daily'
  jobTemplate:
    spec:
      template:
        spec:
          containers:
            - name: hello
              image: busybox
              args:
                - /bin/sh
                - '-c'
                - date; echo Hello from the Openshift cluster
          restartPolicy: OnFailure`;

describe('Start a Job from a CronJob', () => {
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

  it('verify "Start Job" on the CronJob details page', () => {
    cy.visit(`/k8s/ns/${testName}/import`);
    yamlEditor.isImportLoaded();
    yamlEditor.setEditorContent(cronJobReqPayload).then(() => {
      yamlEditor.clickSaveCreateButton();
      detailsPage.sectionHeaderShouldExist('CronJob details');
    });
    detailsPage.clickPageActionFromDropdown('Start Job');
    detailsPage.isLoaded();
    detailsPage.sectionHeaderShouldExist('Job details');
    detailsPage.titleShouldContain(`${CRONJOB_NAME}`);
  });

  it('verify "Start Job" on the CronJob list page', () => {
    cy.visit(`/k8s/ns/${testName}/cronjobs`);
    listPage.rows.shouldBeLoaded();
    listPage.rows.clickKebabAction(CRONJOB_NAME, 'Start Job');
    detailsPage.isLoaded();
    detailsPage.sectionHeaderShouldExist('Job details');
    detailsPage.titleShouldContain(`${CRONJOB_NAME}`);
  });

  it('verify the number of Jobs in CronJob > Jobs tab list page', () => {
    cy.visit(`/k8s/ns/${testName}/cronjobs`);
    listPage.rows.shouldBeLoaded();
    cy.visit(`/k8s/ns/${testName}/cronjobs/${CRONJOB_NAME}/jobs`);
    listPage.rows.countShouldBe(2);
  });
});
