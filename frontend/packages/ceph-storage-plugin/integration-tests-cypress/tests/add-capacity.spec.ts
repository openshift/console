import * as _ from 'lodash';
import { checkErrors } from '../../../integration-tests-cypress/support';
import { modal } from '../../../integration-tests-cypress/views/modal';
import { CLUSTER_STATUS } from '../../integration-tests/utils/consts';
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
import { commonFlows } from '../views/common';

describe('OCS Operator Expansion of Storage Class Test', () => {
  before(() => {
    cy.login();
    cy.visit('/');
    cy.install();
  });

  beforeEach(() => {
    cy.visit('/');
  });

  afterEach(() => {
    checkErrors();
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

    cy.exec('oc get storagecluster ocs-storagecluster -n openshift-storage -o json').then((res) => {
      const storageCluster = JSON.parse(res.stdout);
      _.set(initialState, 'storageCluster', storageCluster);
    });
    cy.exec('oc get cephCluster ocs-storagecluster-cephcluster -n openshift-storage -o json').then(
      (res) => {
        const cephCluster = JSON.parse(res.stdout);
        _.set(initialState, 'cephCluster', cephCluster);

        cy.log('Check if ceph cluster is healthy before expansion');
        expect(cephCluster.status.ceph.health).not.toBe(CLUSTER_STATUS.HEALTH_ERROR);
      },
    );
    cy.exec(
      `oc -n openshift-storage rsh $(oc get po -n openshift-storage | grep ceph-operator | awk '{print$1}') ceph --conf=/var/lib/rook/openshift-storage/openshift-storage.config osd tree --format=json`,
      { timeout: 120000 },
    ).then((res) => {
      const osdTree = JSON.parse(res.stdout);
      _.set(initialState, 'osdTree', osdTree);

      const formattedOSDTree = createOSDTreeMap(osdTree.nodes);
      _.set(initialState, 'formattedOSDTree', formattedOSDTree);

      const osdIDs = getIds(osdTree.nodes, 'osd');
      _.set(initialState, 'osdIDs', osdIDs);
    });
    cy.exec('oc get po -n openshift-storage -o json').then((res) => {
      const pods = JSON.parse(res.stdout);
      _.set(initialState, 'pods', pods);

      commonFlows.navigateToOCS();

      cy.byLegacyTestID('horizontal-link-Storage Cluster').click();
      cy.byLegacyTestID('kebab-button').click();
      cy.byTestActionID('Add Capacity').click();
      modal.shouldBeOpened();

      const initialCapcity =
        SIZE_MAP[
          initialState.storageCluster?.spec?.storageDeviceSets?.[0]?.dataPVCTemplate?.spec
            ?.resources?.requests?.storage
        ];
      cy.byLegacyTestID('requestSize').should('have.value', String(initialCapcity));
      cy.byTestID('provisioned-capacity').contains(
        `${String((initialCapcity * 3).toFixed(2))} TiB`,
      );
      cy.byTestID('add-cap-sc-dropdown', { timeout: 10000 }).should('be.visible');
      modal.submit();
      modal.shouldBeClosed();

      // Wait for the storage cluster to reach Ready
      // Storage Cluster CR flickers so wait for 10 seconds
      // Disablng until ocs-operator fixes above issue
      // eslint-disable-next-line cypress/no-unnecessary-waiting
      cy.wait(10000);
      cy.byTestOperandLink('ocs-storagecluster').click();
      cy.byTestID('resource-status').contains('Ready', { timeout: 900000 });
    });
    cy.exec('oc get storagecluster ocs-storagecluster -n openshift-storage -o json').then((res) => {
      const storageCluster = JSON.parse(res.stdout);
      // Assertion of increment of device count
      cy.log('Check cluster deivce set count has increased');
      expect(getDeviceCount(initialState.storageCluster)).toEqual(
        getDeviceCount(storageCluster) - 1,
      );
    });
    cy.exec('oc get cephCluster ocs-storagecluster-cephcluster -n openshift-storage -o json').then(
      (res) => {
        const cephCluster = JSON.parse(res.stdout);

        cy.log('Check if ceph cluster is healthy after expansion');
        expect(cephCluster.status.ceph.health).not.toBe(CLUSTER_STATUS.HEALTH_ERROR);
      },
    );
    cy.exec('oc get po -n openshift-storage -o json').then((res) => {
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
      `oc -n openshift-storage rsh $(oc get po -n openshift-storage | grep ceph-operator | awk '{print$1}') ceph --conf=/var/lib/rook/openshift-storage/openshift-storage.config osd tree --format=json`,
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
