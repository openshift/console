import { checkErrors, testName } from '../../support';
import { detailsPage } from '../../views/details-page';
import { listPage } from '../../views/list-page';
import { logs } from '../../views/logs';

describe('Pod log viewer tab', () => {
  const POD_NAME = 'examplepod1';
  const POD_ANNO_NAME = 'wraplogpod';
  const examplepodFilename = 'pod-with-space.yaml';
  const podAnnoFilename = 'pod-with-wrap-annotation.yaml';
  before(() => {
    cy.login();
    cy.createProjectWithCLI(testName);
  });

  afterEach(() => {
    checkErrors();
  });

  it('Open logs from pod details page tab and verify the log buffer sizes', () => {
    cy.visit(
      `/k8s/ns/openshift-kube-apiserver/core~v1~Pod?name=kube-apiserver-ip-&status=Running&orderBy=asc&sortBy=Owner`,
    );
    listPage.dvRows.clickFirstLinkInFirstRow();
    detailsPage.isLoaded();
    detailsPage.selectTab('Logs');
    detailsPage.isLoaded();
    // Verify the default log buffer size
    cy.byTestID('resource-log-no-lines').contains('1000 lines');
    // Verify the log exceeds the default log buffer size
    cy.byTestID('resource-log-options-toggle').click();
    cy.byTestDropDownMenu('show-full-log').click();
    // eslint-disable-next-line cypress/no-unnecessary-waiting
    cy.wait(5000);
    cy.byTestID('resource-log-no-lines').should('not.contain', '1000 lines');
  });

  it('Enable white space retain in resource logs', () => {
    cy.exec(`oc create -f ./fixtures/${examplepodFilename} -n ${testName}`).then((result) => {
      expect(result.stdout).includes('created');
    });
    cy.visit(`/k8s/ns/${testName}/pods/${POD_NAME}/logs`);
    cy.byTestID('container-select').click();
    cy.byTestDropDownMenu('container2').click();
    logs.setLogWrap(true);
    cy.get('span[class$=c-log-viewer__text]').as('log-text').should('contain', 'Log   TEST');
    logs.setLogWrap(false);
    cy.get('@log-text').should('contain', 'Log   TEST');
    logs.searchLogs('test');
    cy.get('.pf-m-match').its('length').should('be.greaterThan', 0);
  });

  it('Pod annotation could change default behavior for Wrap lines', () => {
    cy.exec(`oc create -f ./fixtures/${podAnnoFilename} -n ${testName}`);
    cy.visit(`/k8s/ns/${testName}/pods/${POD_NAME}/logs`);
    logs.setLogWrap(false);
    logs.checkLogWraped(false);
    cy.visit(`/k8s/ns/${testName}/pods/${POD_ANNO_NAME}/logs`);
    logs.checkLogWraped(true);
    logs.setLogWrap(false);
    cy.visit(`/k8s/ns/${testName}/pods/${POD_NAME}/logs`);
    logs.checkLogWraped(false);
    cy.visit(`/k8s/ns/${testName}/pods/${POD_ANNO_NAME}/logs`);
    logs.checkLogWraped(true);
    cy.pause();
    logs.setLogWrap(false);
  });
});
