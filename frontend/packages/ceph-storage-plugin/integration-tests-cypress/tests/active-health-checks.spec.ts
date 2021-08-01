import { checkErrors } from '../../../integration-tests-cypress/support';
import { scaleDeployments } from '../common-operations';
import { MINUTE } from '../consts';

const enum Deployments {
  ROOK_CEPH_MON_A = 'rook-ceph-mon-a',
  ROOK_CEPH_MON_B = 'rook-ceph-mon-b',
  ROOK_CEPH_MGR_A = 'rook-ceph-mgr-a',
}

const messages = {
  warnings: {
    MON_DOWN: '1/3 mons down, quorum b,c',
    MGR_DOWN: 'no active mgr',
  },
  errors: {
    ERROR: 'failed to get status. . timed out: exit status 1',
  },
};

const checkHCPopover = () => {
  cy.byTestID('Storage Cluster-secondary-status', { timeout: 5 * MINUTE }).should('be.visible');
  cy.byTestID('Storage Cluster-health-item')
    .contains('Storage Cluster')
    .click();
};

const verifyMessages = (expectedMessages: string[]) => {
  expectedMessages.forEach((expectedMessage) => {
    cy.byTestID('healthcheck-message').contains(expectedMessage, {
      timeout: 5 * MINUTE,
    });
  });
};

const isStorageClusterHealthy = () => {
  // Check if cluster is in a healthy state (secondary status is not displayed when cluster is healthy).
  cy.byTestID('Storage Cluster-secondary-status', { timeout: 5 * MINUTE }).should('not.exist');
};

describe('Test Popover behaviour for different active health check cases.', () => {
  before(() => {
    cy.login();
    cy.visit('/');
    cy.install();
    cy.visit('/ocs-dashboards/block-file');
  });

  after(() => {
    checkErrors();
    cy.logout();
  });

  it('Popover shows all warnings.', () => {
    isStorageClusterHealthy();
    const resources = [Deployments.ROOK_CEPH_MON_A, Deployments.ROOK_CEPH_MGR_A];
    scaleDeployments(resources, 0);
    checkHCPopover();
    verifyMessages(Object.values(messages.warnings));
    scaleDeployments(resources, 1);
    isStorageClusterHealthy();
  });

  it('Popover shows the error.', () => {
    isStorageClusterHealthy();
    const resources = [Deployments.ROOK_CEPH_MON_A, Deployments.ROOK_CEPH_MON_B];
    scaleDeployments(resources, 0);
    checkHCPopover();
    verifyMessages(Object.values(messages.errors));
    scaleDeployments(resources, 1);
    isStorageClusterHealthy();
  });
});
