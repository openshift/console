import { execSync } from 'child_process';
import { browser } from 'protractor';
import * as crudView from '@console/internal-integration-tests/views/crud.view';
import {
  MINUTE,
  NS,
  OCS_NODE_LABEL,
  POD_NAME_PATTERNS,
  STORAGE_CLASS_PATTERNS,
  STORAGE_CLUSTER_NAME,
  SECOND,
  SUCCESS,
} from '../../utils/consts';
import {
  InstallCluster,
  filterInput,
  goToStorageClasses,
  ocsOperatorStatus,
} from '../../views/installFlow.view';
import {
  checkIfClusterIsReady,
  getDataFromRowAndCol,
  getPodData,
  getPodPhase,
  podNameFilter,
  sendKeys,
  testPodIsRunning,
  verifyNodeLabels,
} from '../../utils/helpers';

const Installer = new InstallCluster(NS);

describe('Testing OCS Subscription', () => {
  beforeAll(async () => {
    await Installer.createNamespace();
    expect(browser.getCurrentUrl()).toContain(NS);
  }, 2 * MINUTE);

  it(
    'tests subscription flow for ocs operator',
    async () => {
      await Installer.subscribeToOperator();
      const text = await ocsOperatorStatus.getText();
      expect(text.includes(SUCCESS)).toBe(true);
    },
    3 * MINUTE,
  );

  it('tests for presence of 3 operator pods', async () => {
    const podList = JSON.parse(
      execSync('kubectl get po -n openshift-storage -o json').toString('utf-8'),
    );
    const pods = podList.items;
    let pod = getPodData(pods, POD_NAME_PATTERNS.OCS);
    let phase = getPodPhase(pod);
    expect(phase).toBe('Running');
    pod = getPodData(pods, POD_NAME_PATTERNS.ROOK);
    phase = getPodPhase(pod);
    expect(phase).toBe('Running');
    pod = getPodData(pods, POD_NAME_PATTERNS.NOOBA_OPERATOR);
    expect(getPodPhase(pod)).toBe('Running');
  });
});

describe('Test creation of Storage Cluster', () => {
  it(
    'creates a storage cluster',
    async () => {
      const nodes = await Installer.createStorageCluster();
      const text = await crudView.resourceTitle.getText();
      expect(text).toEqual(STORAGE_CLUSTER_NAME);
      // Verify all the nodes have the required labels
      // Wait for 5 seconds for label to apply
      await browser.sleep(5 * SECOND);
      nodes.forEach((node) => {
        expect(verifyNodeLabels(node, OCS_NODE_LABEL)).toBe(true);
      });
      // Wait for cluster to come to ready state
      await checkIfClusterIsReady();
    },
    16 * MINUTE,
  );
});

describe('Tests for pods and storage classes', () => {
  let pods = null;

  beforeAll(() => {
    const podList = JSON.parse(
      execSync('kubectl get po -n openshift-storage -o json').toString('utf-8'),
    );
    pods = podList.items;
  });

  it('tests if ocs-operator is running', () => {
    const pod = getPodData(pods, POD_NAME_PATTERNS.OCS);
    testPodIsRunning(getPodPhase(pod));
  });

  it('tests if rook-ceph-operator is running', () => {
    const pod = getPodData(pods, POD_NAME_PATTERNS.ROOK);
    testPodIsRunning(getPodPhase(pod));
  });

  it('tests if noobaa-operator is running', () => {
    const pod = getPodData(pods, POD_NAME_PATTERNS.NOOBA_OPERATOR);
    testPodIsRunning(getPodPhase(pod));
  });

  it('tests if noobaa-core is running', () => {
    const pod = getPodData(pods, POD_NAME_PATTERNS.NOOBAA_CORE);
    testPodIsRunning(getPodPhase(pod));
  });

  it("tests if 3 rook-ceph-mon's are running", () => {
    const podList = getPodData(pods, POD_NAME_PATTERNS.ROOK_CEPH_MON);
    expect(podList.length).toBe(3);
    podList.forEach((pod) => {
      testPodIsRunning(getPodPhase(pod));
    });
  });

  it('tests if rook-ceph-mgr is running', () => {
    const pod = getPodData(pods, POD_NAME_PATTERNS.ROOK_CEPH_MGR);
    testPodIsRunning(getPodPhase(pod));
  });

  // 3 cephfsplugin-* 2 csi-cephfsplugin-provisioner-*
  it('tests if 5 csi-cephfsplugin are running', () => {
    const podList = getPodData(pods, POD_NAME_PATTERNS.CSI_CEPHFS);
    expect(podList.length).toBe(5);
    podList.forEach((pod) => {
      testPodIsRunning(getPodPhase(pod));
    });
  });

  // 2 csi-rbdplugin-provisioner-* 3 csi-rbd-plugin-*
  it('tests if 5 csi-rbdplugin are running', () => {
    const podList = getPodData(pods, POD_NAME_PATTERNS.CSI_RBD);
    expect(podList.length).toBe(5);
    podList.forEach((pod) => {
      testPodIsRunning(getPodPhase(pod));
    });
  });

  it('tests if 2 rook-ceph-mds-ocs-storagecluster-cephfilesystem pods are running', () => {
    const podList = getPodData(pods, POD_NAME_PATTERNS.ROOK_CEPH_MDS);
    expect(podList.length).toBe(2);
    podList.forEach((pod) => {
      testPodIsRunning(getPodPhase(pod));
    });
  });

  it('tests if all ceph-rbd, cephfs, noobaa storage classes are shown', async () => {
    await goToStorageClasses();
    await sendKeys(filterInput, STORAGE_CLASS_PATTERNS.RBD);
    const rdbClass = await getDataFromRowAndCol(0, 1, podNameFilter);
    expect(rdbClass.includes(STORAGE_CLASS_PATTERNS.RBD)).toBe(true);
    await sendKeys(filterInput, STORAGE_CLASS_PATTERNS.FS);
    const fsClass = await getDataFromRowAndCol(0, 1, podNameFilter);
    expect(fsClass.includes(STORAGE_CLASS_PATTERNS.FS)).toBe(true);
    await sendKeys(filterInput, STORAGE_CLASS_PATTERNS.NOOBAA);
    const noobaaClass = await getDataFromRowAndCol(0, 1, podNameFilter);
    expect(noobaaClass.includes(STORAGE_CLASS_PATTERNS.NOOBAA)).toBe(true);
  });
});
