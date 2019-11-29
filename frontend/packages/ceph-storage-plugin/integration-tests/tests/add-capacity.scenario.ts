import { execSync } from 'child_process';
import * as _ from 'lodash';
import { browser, ExpectedConditions as until } from 'protractor';
import { appHost } from '@console/internal-integration-tests/protractor.conf';
import { click } from '@console/shared/src/test-utils/utils';
import { isNodeReady } from '@console/shared/src/selectors/node';
import {
  addCapacityLbl,
  addCapacityBtn,
  ocsOp,
  storageClusterView,
  storageClusterRow,
} from '../views/add-capacity.view';

const NAMESPACE = 'openshift-storage';
const KIND = 'storagecluster';

let clusterJSON;
let previousCnt;
let previousPods;
let updatedClusterJSON;
let updatedCnt;
let updatedPods;

const storageCluster = JSON.parse(
  execSync(`kubectl get ${KIND} -n ${NAMESPACE} -o json`).toString(),
);

describe('Check availability of OCS cluster', () => {
  if (storageCluster.items[0]) {
    it('Should check if the OCS cluster is Ready for expansion', () => {
      expect(_.get(storageCluster.items[0], 'status.phase')).toBe('Ready');
    });
  } else {
    it('Should state that OCS cluster is not ready for expansion', () => {
      expect(storageCluster.items[0]).toBeUndefined();
    });
  }
});

if (storageCluster.items[0]) {
  describe('Check add capacity functionality for ocs service', () => {
    beforeAll(async () => {
      const { name } = storageCluster.items[0].metadata;
      clusterJSON = JSON.parse(
        execSync(`kubectl get -o json -n ${NAMESPACE} ${KIND} ${name}`).toString(),
      );
      previousCnt = _.get(clusterJSON, 'spec.storageDeviceSets[0].count', undefined);
      const uid = _.get(clusterJSON, 'metadata.uid', undefined).toString();
      previousPods = JSON.parse(execSync(`kubectl get pods -n ${NAMESPACE} -o json`).toString());

      await browser.get(
        `${appHost}/k8s/ns/openshift-storage/operators.coreos.com~v1alpha1~ClusterServiceVersion`,
      );

      await click(ocsOp);
      await click(storageClusterView);

      await browser.wait(until.presenceOf(storageClusterRow(uid)));
      const kebabMenu = storageClusterRow(uid).$('button[data-test-id="kebab-button"]');

      await click(kebabMenu);
      await click(addCapacityLbl);
      await click(addCapacityBtn);

      updatedClusterJSON = JSON.parse(
        execSync(`kubectl get -o json -n ${NAMESPACE} ${KIND} ${name}`).toString(),
      );

      updatedCnt = _.get(updatedClusterJSON, 'spec.storageDeviceSets[0].count', undefined);
      const statusCol = storageClusterRow(uid).$('td:nth-child(4)');

      // need to wait as cluster states fluctuates for some time. Waiting for 2 secs for the same
      browser.sleep(2000);

      await browser.wait(until.textToBePresentInElement(statusCol, 'Progressing'));
      await browser.wait(
        until.textToBePresentInElement(statusCol.$('span.co-icon-and-text span'), 'Ready'),
      );

      updatedPods = JSON.parse(execSync(`kubectl get pod -o json -n ${NAMESPACE}`).toString());
    }, 150000);

    it('Newly added capacity should takes into effect at the storage level', () => {
      // by default 2Tib capacity is being added
      expect(updatedCnt - previousCnt).toEqual(1);
    });

    it('New osd pods corresponding to the additional capacity should be in running state', () => {
      const isPodPresent = (podName) =>
        previousPods.items.find((pod) => pod.metadata.name === podName) !== undefined;

      const newPods = [];
      updatedPods.items.forEach((pod) => {
        if (!isPodPresent(pod.metadata.name) && pod.metadata.name.startsWith('rook-ceph-osd')) {
          newPods.push(pod.metadata.name);
        }
      });

      /* since rook-ceph-osd-prepare-ocs-deviceset- keeps changing their last 4 characters,
      hence subtracting the count of previous  rook-ceph-osd-prepare-ocs-deviceset- pods */
      expect(newPods.length - previousCnt * 3).toEqual(6);
    });

    it('Ceph cluster should be healthy after expansion', () => {
      const cephValueAfter = JSON.parse(
        execSync(`kubectl get cephCluster -n ${NAMESPACE} -o json`).toString(),
      );
      expect(cephValueAfter.items[0].status.ceph.health === 'HEALTH_OK');
    });

    it('No ocs pods should get restarted unexpectedly', () => {
      const isAllPodRunning = previousPods.items.every(
        (pod) => pod.status.phase === 'Running' || pod.status.phase === 'Succeeded',
      );
      expect(isAllPodRunning).toEqual(true);
    });

    it('No OCP/OCS nodes should go to NotReady state', () => {
      const nodes = JSON.parse(execSync(`kubectl get nodes -o json`).toString());
      const isAllNodes = nodes.items.every((node) => isNodeReady(node));

      expect(isAllNodes).toEqual(true);
    });
  });
}
