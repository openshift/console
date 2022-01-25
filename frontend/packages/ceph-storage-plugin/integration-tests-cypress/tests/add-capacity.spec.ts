import * as _ from 'lodash';
import { ODFCommon } from '../../../integration-tests-cypress/views/common';
import { listPage } from '../../../integration-tests-cypress/views/list-page';
import { modal } from '../../../integration-tests-cypress/views/modal';
import {
  CLUSTER_STATUS,
  STORAGE_SYSTEM_NAME,
  STORAGE_CLUSTER_NAME,
  NS as CLUSTER_NAMESPACE,
  CEPH_CLUSTER_NAME,
} from '../consts';
import {
  createOSDTreeMap,
  getDeviceCount,
  getIds,
  getNewOSDIds,
  getPodRestartCount,
  isNodeReady,
  SIZE_MAP,
  verifyNodeOSDMapping,
  getPresentPod,
  getPodName,
} from '../helpers';

const ROOK_CONF_PATH = '/var/lib/rook/openshift-storage/openshift-storage.config';

describe('OCS Operator Expansion of Storage Class Test', () => {
  before(() => {
    cy.login();
    cy.visit('/');
    cy.install();
  });

  beforeEach(() => {
    cy.visit('/');
  });

  after(() => {
    cy.logout();
  });

  it.only('Add additional capacity to Storage Cluster', () => {
    const initialState = {
      storageCluster: null,
      cephCluster: null,
      osdTree: null,
      pods: null,
      formattedOSDTree: null,
      osdIDs: null,
    };

    cy.exec(`oc get storagecluster ${STORAGE_CLUSTER_NAME} -n ${CLUSTER_NAMESPACE} -o json`).then(
      (res) => {
        const storageCluster = JSON.parse(res.stdout);
        _.set(initialState, 'storageCluster', storageCluster);
      },
    );
    cy.exec(`oc get cephCluster ${CEPH_CLUSTER_NAME} -n ${CLUSTER_NAMESPACE} -o json`).then(
      (res) => {
        const cephCluster = JSON.parse(res.stdout);
        _.set(initialState, 'cephCluster', cephCluster);

        cy.log('Check if ceph cluster is healthy before expansion');
        expect(cephCluster.status.ceph.health).not.toBe(CLUSTER_STATUS.HEALTH_ERROR);
      },
    );
    cy.exec(
      `oc -n ${CLUSTER_NAMESPACE} rsh $(oc get po -n ${CLUSTER_NAMESPACE} | grep ceph-operator | awk '{print$1}') ceph --conf=${ROOK_CONF_PATH} osd tree --format=json`,
      { timeout: 120000 },
    ).then((res) => {
      const osdTree = JSON.parse(res.stdout);
      _.set(initialState, 'osdTree', osdTree);

      const formattedOSDTree = createOSDTreeMap(osdTree.nodes);
      _.set(initialState, 'formattedOSDTree', formattedOSDTree);

      const osdIDs = getIds(osdTree.nodes, 'osd');
      _.set(initialState, 'osdIDs', osdIDs);
    });
    cy.exec(`oc get po -n ${CLUSTER_NAMESPACE} -o json`).then((res) => {
      const pods = JSON.parse(res.stdout);
      _.set(initialState, 'pods', pods);

      ODFCommon.visitStorageDashboard();
      ODFCommon.visitStorageSystemList();
      listPage.searchInList(STORAGE_SYSTEM_NAME);
      // Todo(bipuladh): Add a proper data-selector once the list page is migrated
      // eslint-disable-next-line cypress/require-data-selectors
      cy.get('a')
        .contains(STORAGE_SYSTEM_NAME)
        .should('exist');
      cy.byLegacyTestID('kebab-button').click();
      cy.byTestActionID('Add Capacity').click();
      modal.shouldBeOpened();

      const initialCapacity =
        SIZE_MAP[
          initialState.storageCluster?.spec?.storageDeviceSets?.[0]?.dataPVCTemplate?.spec
            ?.resources?.requests?.storage
        ];
      cy.byLegacyTestID('requestSize').should('have.value', String(initialCapacity));
      cy.byTestID('provisioned-capacity').contains(
        `${String((initialCapacity * 3).toFixed(0))} TiB`,
      );
      cy.byTestID('add-cap-sc-dropdown', { timeout: 10000 }).should('be.visible');
      modal.submit();
      modal.shouldBeClosed();

      cy.clickNavLink(['Operators', 'Installed Operators']);
      cy.byLegacyTestID('item-filter').type('Openshift Data Foundation');
      cy.byTestRows('resource-row')
        .get('td')
        .first()
        .click();
      cy.byLegacyTestID('horizontal-link-Storage System').click();
      cy.contains(STORAGE_SYSTEM_NAME).click();
      cy.contains('Resources').click();
      cy.byTestOperandLink(STORAGE_CLUSTER_NAME).click();
      // Wait for the storage cluster to reach Ready
      // Storage Cluster CR flickers so wait for 10 seconds
      // Disablng until ocs-operator fixes above issue
      // eslint-disable-next-line cypress/no-unnecessary-waiting
      cy.wait(10000);
      cy.byTestID('resource-status').contains('Ready', { timeout: 900000 });
    });
    cy.exec(`oc get storagecluster ${STORAGE_CLUSTER_NAME} -n ${CLUSTER_NAMESPACE} -o json`).then(
      (res) => {
        const storageCluster = JSON.parse(res.stdout);
        // Assertion of increment of device count
        cy.log('Check cluster device set count has increased');
        expect(getDeviceCount(initialState.storageCluster)).toEqual(
          getDeviceCount(storageCluster) - 1,
        );
      },
    );
    cy.exec(`oc get cephCluster ${CEPH_CLUSTER_NAME} -n ${CLUSTER_NAMESPACE} -o json`).then(
      (res) => {
        const cephCluster = JSON.parse(res.stdout);

        cy.log('Check if ceph cluster is healthy after expansion');
        expect(cephCluster.status.ceph.health).not.toBe(CLUSTER_STATUS.HEALTH_ERROR);
      },
    );
    cy.exec(`oc get po -n ${CLUSTER_NAMESPACE} -o json`).then((res) => {
      const pods = JSON.parse(res.stdout);

      cy.log('Check Pods have not restarted unexpectedly');
      initialState.pods.items.forEach((pod) => {
        const initalRestarts = getPodRestartCount(pod);
        const updatedPod = getPresentPod(pods, getPodName(pod));
        if (updatedPod) {
          const currentRestarts = getPodRestartCount(updatedPod);
          expect(initalRestarts).toEqual(currentRestarts);
        }
      });
    });
    cy.exec(
      `oc -n ${CLUSTER_NAMESPACE} rsh $(oc get po -n ${CLUSTER_NAMESPACE} | grep ceph-operator | awk '{print$1}') ceph --conf=${ROOK_CONF_PATH} osd tree --format=json`,
      { timeout: 120000 },
    ).then((res) => {
      const osdTree = JSON.parse(res.stdout);
      const formattedOSDTree = createOSDTreeMap(osdTree.nodes);
      const newOSDIds = getNewOSDIds(osdTree.nodes, initialState.osdIDs);

      cy.log('New OSDs are added correctly to the right nodes', () => {
        const nodes = getIds(osdTree.nodes, 'host');
        expect(verifyNodeOSDMapping(nodes, newOSDIds, formattedOSDTree)).toBeTruthy();
      });
    });
    cy.exec('oc get nodes -o json').then((res) => {
      const nodes = JSON.parse(res.stdout);
      const allNodesReady = nodes.items.every(isNodeReady);
      cy.log('No Nodes should go to Not Ready state');
      expect(allNodesReady).toBeTruthy();
    });
  });
});
