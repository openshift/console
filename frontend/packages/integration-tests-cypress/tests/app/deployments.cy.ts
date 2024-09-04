import { checkErrors, testName } from '../../support';
import { detailsPage } from '../../views/details-page';
import { listPage } from '../../views/list-page';
import { modal } from '../../views/modal';

describe('Deployment resource details page', () => {
  let WORKLOAD_NAME;
  let CREATE_DEPLOYMENT;
  let CREATE_HPA;

  before(() => {
    cy.login();
    cy.initAdmin();
    cy.createProjectWithCLI(testName);

    WORKLOAD_NAME = `deployment-${testName}`;
    CREATE_DEPLOYMENT = `oc create deployment ${WORKLOAD_NAME} --image=httpd --replicas=0`;
    CREATE_HPA = `oc autoscale deployment ${WORKLOAD_NAME} --min=1 --max=10`;

    // Create a deployment named foo with 0 replicas using the cli
    cy.exec(CREATE_DEPLOYMENT, {
      failOnNonZeroExit: false,
    });
    // Create an HorizontalPodAutoscaler using the cli that autoscales the deployment foo
    cy.exec(CREATE_HPA, { failOnNonZeroExit: false });
    cy.visit(`/k8s/ns/${testName}/deployments`);
  });

  beforeEach(() => {
    cy.visitAndWait(`/k8s/ns/${testName}/deployments/${WORKLOAD_NAME}`);
    detailsPage.isLoaded();
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

  it('Enable deployment autoscale button should exist', () => {
    cy.byTestID('enable-autoscale').should('exist').click();
  });
  it('Enable deployment autoscale button should not exist', () => {
    cy.byTestID('enable-autoscale').should('not.exist');
  });
});
