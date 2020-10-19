import { execSync } from 'child_process';
import * as _ from 'lodash';
import { browser, ExpectedConditions as until } from 'protractor';
import { click } from '@console/shared/src/test-utils/utils';
import { isNodeReady } from '@console/shared/src/selectors/node';
import { PodKind } from '@console/internal/module/k8s';
import { getName } from '@console/shared/src/selectors/common';
import { DeviceSet } from '../../../src/types';
import { verifyFields, selectSCDropdown, currentACSelector } from '../../views/add-capacity.view';
import {
  CLUSTER_STATUS,
  EXPAND_WAIT,
  HOST,
  KIND,
  NS,
  OSD,
  POD_NAME_PATTERNS,
  SECOND,
  ZONE,
  MINUTE,
  STORAGE_CLUSTER_NAME,
  OSD_SIZES_MAP,
} from '../../utils/consts';
import {
  createOSDTreeMap,
  getIds,
  getNewOSDIds,
  getPodName,
  getPodPhase,
  getPodRestartCount,
  isPodPresent,
  NodeType,
  FormattedOsdTreeType,
  testPodIsSucceeded,
  verifyNodeOSDMapping,
  verifyZoneOSDMapping,
} from '../../utils/helpers';
import { TEST_PLATFORM } from '../../views/installFlow.view';
import { testNoProvisionerSC } from '../../mocks/storage-class';

const storageCluster = JSON.parse(execSync(`kubectl get -o json -n ${NS} ${KIND}`).toString());
const cephValue = JSON.parse(execSync(`kubectl get cephCluster -n ${NS} -o json`).toString());
const clusterStatus = storageCluster.items[0];
const cephHealth = cephValue.items[0];

const expansionObjects: ExpansionObjectsType = {
  clusterJSON: {},
  previousCnt: 0,
  updatedCnt: 0,
  updatedClusterJSON: {},
  previousPods: { items: [] },
  updatedPods: { items: [] },
  previousOSDTree: { nodes: [] },
  updatedOSDTree: { nodes: [] },
  formattedOSDTree: {},
  previousOSDIds: [],
  newOSDIds: [],
  uid: '',
  defaultSC: '',
  name: '',
};

describe('Check add capacity functionality for ocs service', () => {
  describe('For common test cases', () => {
    beforeAll(async () => {
      [expansionObjects.clusterJSON] = storageCluster.items;
      expansionObjects.name = getName(expansionObjects.clusterJSON);
      const initialDeviceSet: DeviceSet =
        expansionObjects.clusterJSON?.spec?.storageDeviceSets?.[0];
      expansionObjects.previousCnt = initialDeviceSet?.count;

      expansionObjects.uid = expansionObjects.clusterJSON?.metadata?.uid;
      expansionObjects.previousPods = JSON.parse(
        execSync(`kubectl get pods -n ${NS} -o json`).toString(),
      );

      expansionObjects.previousOSDTree = JSON.parse(
        execSync(
          `oc -n ${NS} rsh  $(oc -n ${NS} get pod | grep ceph-operator| awk '{print$1}') ceph --conf=/var/lib/rook/${NS}/${NS}.config osd tree --format=json`,
        ).toString(),
      );
      expansionObjects.previousOSDIds = getIds(expansionObjects.previousOSDTree.nodes, OSD);
      const initialClusterCapacity =
        initialDeviceSet?.dataPVCTemplate?.spec?.resources?.requests?.storage;

      await selectSCDropdown(expansionObjects.uid);

      // eslint-disable-next-line no-useless-escape
      expansionObjects.defaultSC = execSync(
        `kubectl get storageclasses | grep -Po '\\w+(?=.*default)'`,
      )
        .toString()
        .trim();
      await click(currentACSelector.getSCOption(expansionObjects.defaultSC));
      verifyFields(OSD_SIZES_MAP[initialClusterCapacity]);
      await click(currentACSelector.confirmButton);

      await browser.sleep(5 * SECOND);

      expansionObjects.updatedClusterJSON = JSON.parse(
        execSync(`kubectl get -o json -n ${NS} ${KIND} ${expansionObjects.name}`).toString(),
      );
      expansionObjects.updatedCnt = _.get(
        expansionObjects.updatedClusterJSON,
        'spec.storageDeviceSets[0].count',
      );
    });

    it('Newly added capacity should takes into effect at the storage level', () => {
      expect(expansionObjects.updatedCnt - expansionObjects.previousCnt).toEqual(1);
    });

    it('Selected storage class should be sent in the YAML', () => {
      const storageCR = JSON.parse(
        execSync(`kubectl get storageclusters ${STORAGE_CLUSTER_NAME} -n ${NS} -o json`).toString(),
      );
      const scFromYAML =
        storageCR?.spec?.storageDeviceSets?.[0]?.dataPVCTemplate?.spec?.storageClassName;
      expect(expansionObjects.defaultSC).toEqual(scFromYAML);
    });
  });

  describe('Addition tests for Baremetal infra', () => {
    beforeAll(async () => {
      await selectSCDropdown(expansionObjects.uid);
      execSync(`echo '${JSON.stringify(testNoProvisionerSC)}' | oc apply -f -`);
      // need to wait for some time in order to reflect the storage class
      await browser.sleep(40 * SECOND);
      await click(currentACSelector.getSCOption(testNoProvisionerSC.metadata.name));
    });

    afterAll(async () => {
      execSync(`echo '${JSON.stringify(testNoProvisionerSC)}' | oc delete -f -`);
    });

    it('Raw Capacity field should be hidden', () => {
      expect(currentACSelector.capacityValueInput.isPresent()).toBe(false);
      expect(currentACSelector.totalRequestedcapacity.isPresent()).toBe(false);
    });
  });
});

if (TEST_PLATFORM === 'OCS') {
  describe('Check availability of ocs cluster', () => {
    if (clusterStatus) {
      it('Should check if the ocs cluster is Ready for expansion', () => {
        expect(clusterStatus?.status?.phase).toBe(CLUSTER_STATUS.READY);
      });
    } else {
      it('Should state that ocs cluster is not ready for expansion', () => {
        expect(clusterStatus).toBeUndefined();
      });
    }
  });

  describe('Check availability of Ceph cluster', () => {
    if (cephHealth) {
      it('Check if the Ceph cluster is healthy before expansion', () => {
        expect(cephHealth.status.ceph.health).not.toBe(CLUSTER_STATUS.HEALTH_ERROR);
      });
    } else {
      it('Should state that Ceph cluster doesnt exist', () => {
        expect(cephHealth).toBeUndefined();
      });
    }
  });

  if (clusterStatus && cephHealth) {
    describe('Check for remaining tests for add capacity functionality for ocs service', () => {
      beforeAll(async () => {
        const statusCol = currentACSelector
          .storageClusterRow(expansionObjects.uid)
          .$('td:nth-child(3)');
        // need to wait as cluster states fluctuates for some time. Waiting for 2 secs for the same
        await browser.sleep(2 * SECOND);

        await browser.wait(
          until.textToBePresentInElement(
            currentACSelector.getProgressingStateEl(statusCol),
            CLUSTER_STATUS.PROGRESSING,
          ),
        );
        await browser.wait(
          until.textToBePresentInElement(
            currentACSelector.getReadyStateEl(statusCol),
            CLUSTER_STATUS.READY,
          ),
        );

        expansionObjects.updatedPods = JSON.parse(
          execSync(`kubectl get pod -o json -n ${NS}`).toString(),
        );
        // need to wait to get the new osds reflected in osd tree
        await browser.sleep(1 * MINUTE);
        expansionObjects.updatedOSDTree = JSON.parse(
          execSync(
            `oc -n ${NS} rsh  $(oc -n ${NS} get pod | grep ceph-operator| awk '{print$1}') ceph --conf=/var/lib/rook/${NS}/${NS}.config osd tree --format=json`,
          ).toString(),
        );
        expansionObjects.formattedOSDTree = createOSDTreeMap(
          expansionObjects.updatedOSDTree.nodes,
        ) as FormattedOsdTreeType;
        expansionObjects.newOSDIds = getNewOSDIds(
          expansionObjects.updatedOSDTree.nodes,
          expansionObjects.previousOSDIds,
        );
      }, EXPAND_WAIT);

      it('No ocs pods should get restarted unexpectedly', () => {
        expansionObjects.previousPods.items.forEach((pod) => {
          const prevRestartCnt = getPodRestartCount(pod);
          const updatedpod = isPodPresent(expansionObjects.updatedPods, getPodName(pod));
          if (updatedpod) {
            const updatedRestartCnt = getPodRestartCount(updatedpod);
            expect(prevRestartCnt).toBe(updatedRestartCnt);
          }
        });
      });

      it('No ocs nodes should go to NotReady state', () => {
        const nodes = JSON.parse(execSync(`kubectl get nodes -o json`).toString());
        const areAllNodes = nodes.items.every((node) => isNodeReady(node));

        expect(areAllNodes).toEqual(true);
      });

      it('Ceph cluster should be healthy after expansion', () => {
        const cephValueAfter = JSON.parse(
          execSync(`kubectl get cephCluster -n ${NS} -o json`).toString(),
        );
        const cephHealthAfter = cephValueAfter.items[0];
        expect(cephHealthAfter.status.ceph.health).not.toBe(CLUSTER_STATUS.HEALTH_ERROR);
      });

      it('New osds are added correctly to the availability zones/failure domains', () => {
        const zones = getIds(expansionObjects.updatedOSDTree.nodes, ZONE);
        expect(
          verifyZoneOSDMapping(
            zones,
            expansionObjects.newOSDIds,
            expansionObjects.formattedOSDTree,
          ),
        ).toEqual(true);
      });

      it('New osds are added correctly to the right nodes', () => {
        const nodes = getIds(expansionObjects.updatedOSDTree.nodes, HOST);
        expect(
          verifyNodeOSDMapping(
            nodes,
            expansionObjects.newOSDIds,
            expansionObjects.formattedOSDTree,
          ),
        ).toEqual(true);
      });
    });

    it('New osd pods corresponding to the additional capacity should be in running state', () => {
      const newOSDPods = [] as PodKind[];
      const newOSDPreparePods = [] as PodKind[];

      expansionObjects.updatedPods.items.forEach((pod) => {
        const podName = getPodName(pod);
        if (!isPodPresent(expansionObjects.previousPods, podName)) {
          if (podName.includes(POD_NAME_PATTERNS.ROOK_CEPH_OSD_PREPARE)) {
            newOSDPreparePods.push(pod);
          } else if (podName.includes(POD_NAME_PATTERNS.ROOK_CEPH_OSD)) {
            newOSDPods.push(pod);
          }
        }
      });

      expect(newOSDPods.length).toEqual(3);
      expect(newOSDPreparePods.length).toEqual(3);

      newOSDPreparePods.forEach((pod) => {
        testPodIsSucceeded(getPodPhase(pod));
      });
    });
  }
}
type PodType = {
  items: PodKind[];
};

export type ExpansionObjectsType = {
  clusterJSON: any;
  previousCnt: number;
  updatedCnt: number;
  updatedClusterJSON: {};
  previousPods: PodType;
  updatedPods: PodType;
  previousOSDTree: { nodes: NodeType[] };
  updatedOSDTree: { nodes: NodeType[] };
  formattedOSDTree: FormattedOsdTreeType;
  previousOSDIds: number[];
  newOSDIds: number[];
  uid: string;
  defaultSC: string;
  name: string;
};
