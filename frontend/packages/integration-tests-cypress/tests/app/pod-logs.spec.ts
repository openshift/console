import { podWithDefaultContainer } from '../../mocks/default-container';
import { checkErrors, testName } from '../../support';

describe('Pod logs', () => {
  before(() => {
    cy.login();
    cy.exec(`kubectl create namespace ${testName}`);
    cy.exec(
      `echo '${JSON.stringify(podWithDefaultContainer)}' | kubectl create -n ${testName} -f -`,
    );
  });

  afterEach(() => {
    checkErrors();
  });

  after(() => {
    cy.exec(`kubectl delete namespace ${testName}`);
    cy.logout();
  });

  it('shows correct default container log', () => {
    const podName = podWithDefaultContainer.metadata.name;
    const defaultContainer =
      podWithDefaultContainer.metadata.annotations['kubectl.kubernetes.io/default-container'];
    cy.visit(`/k8s/ns/${testName}/pods/${podName}/logs`);
    cy.byTestID('container-dropdown').should('contain', defaultContainer);
  });
});
