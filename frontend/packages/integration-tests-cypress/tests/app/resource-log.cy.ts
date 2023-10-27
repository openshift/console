import { checkErrors } from '../../support';
import { detailsPage } from '../../views/details-page';
import { listPage, listPage } from '../../views/list-page';

describe('Pod log viewer tab', () => {
  before(() => {
    cy.login();
  });

  afterEach(() => {
    checkErrors();
  });

  it('Open logs from pod details page tab and verify the log buffer sizes', () => {
    cy.visit(
      `/k8s/ns/openshift-kube-apiserver/core~v1~Pod?name=kube-apiserver-ip-&rowFilter-pod-status=Running&orderBy=desc&sortBy=Owner`,
    );
    listPage.rows.clickFirstLinkInFirstRow();
    detailsPage.isLoaded();
    detailsPage.selectTab('Logs');
    detailsPage.isLoaded();
    // Verify the default log buffer size
    cy.byTestID('no-log-lines').contains('1000 lines');
    // Verify the log exceeds the default log buffer size
    cy.byTestID('show-full-log').check();
    // eslint-disable-next-line cypress/no-unnecessary-waiting
    cy.wait(5000);
    cy.byTestID('no-log-lines').should('not.contain', '1000 lines');
  });
});
