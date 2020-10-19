import { execSync } from 'child_process';
import { browser, ExpectedConditions as until } from 'protractor';
import * as _ from 'lodash';
import { Base64 } from 'js-base64';
import * as crudView from '@console/internal-integration-tests/views/crud.view';
import { click } from '@console/shared/src/test-utils/utils';
import {
  LOCAL_STORAGE_NAMESPACE,
  DISCOVERY_CR_NAME,
} from '@console/local-storage-operator-plugin/src/constants';
import {
  MINUTE,
  OCS_NODE_LABEL,
  POD_NAME_PATTERNS,
  STORAGE_CLASS_PATTERNS,
  STORAGE_CLUSTER_NAME,
  SECOND,
  NS as OCS_NS,
  LSO_INFO_MSG,
  SC_STEPS_NAME,
  CONFIRM_MODAL_TITLE,
} from '../../utils/consts';
import {
  InstallCluster,
  filterInput,
  goToStorageClasses,
  TEST_PLATFORM,
  MODE,
  Platform,
  Mode,
  currentSelectors,
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
  testPodIsSucceeded,
} from '../../utils/helpers';
import { ClusterMetadata } from '../../mocks/independent-external-cluster-data';
import { testNoProvisionerSC } from '../../mocks/storage-class';
import { MINIMUM_NODES } from '../../../src/constants';
import { goToInstalledOperators } from '../../views/add-capacity.view';

const Installer = new InstallCluster();

/**
 *  - Tests the namespace creation (Remove this)
 *  - Installs OCS Operator from Operator Hub
 *  - Tests for various resources associated with OCS Operator to be in acceptable state
 *  - Creates Storage Cluster
 *  - Tests for resources associated with Storage Cluster to be in acceptable state
 */

describe('Testing OCS Subscription', () => {
  it(
    'tests subscription flow for OCS Operator',
    async () => {
      await Installer.subscribeToOperator();
      await Installer.checkOCSOperatorInstallation();
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

if (TEST_PLATFORM === Platform.OCP || (TEST_PLATFORM === Platform.OCS && MODE === Mode.CONVERGED)) {
  describe('Test creation of Converged Storage Cluster', () => {
    it(
      'creates a storage cluster',
      async () => {
        const { selectedNodes } = await Installer.createConvergedStorageCluster();
        browser.sleep(2 * SECOND);
        const text = await crudView.resourceTitle.getText();
        expect(text).toEqual(STORAGE_CLUSTER_NAME);
        // Verify all the nodes have the required labels
        // Wait for 5 seconds for label to apply
        await browser.sleep(5 * SECOND);
        let nodes: string[] = await Promise.all(selectedNodes);
        // Data syntax Node\nN\n<node-name>
        nodes = nodes.map((node) => node.split('\n')[2]);
        nodes.forEach((node) => expect(verifyNodeLabels(node, OCS_NODE_LABEL)).toBeTruthy());
        const storageCR = JSON.parse(
          execSync(
            `kubectl get storageclusters ${STORAGE_CLUSTER_NAME} -n ${OCS_NS} -o json`,
          ).toString(),
        );
        const scFromCR =
          storageCR?.spec?.storageDeviceSets?.[0]?.dataPVCTemplate?.spec?.storageClassName;
        const sizeFromCR =
          storageCR?.spec?.storageDeviceSets?.[0]?.dataPVCTemplate?.spec?.resources?.requests
            ?.storage;
        const defaultSC = execSync(`kubectl get storageclasses | grep -Po '\\w+(?=.*default)'`)
          .toString()
          .trim();
        expect(sizeFromCR).toEqual('512Gi');
        expect(defaultSC).toEqual(scFromCR);
      },
      16 * MINUTE,
    );
  });
}

if (TEST_PLATFORM === Platform.OCP || (TEST_PLATFORM === Platform.OCS && MODE === Mode.EXTERNAL)) {
  describe('Test creation of External Storage Cluster', () => {
    beforeAll(async () => {
      await Installer.createExternalStorageCluster();
    });

    it('Test secret is created with required data', async () => {
      const secret = JSON.parse(
        execSync(
          `kubectl get secret rook-ceph-external-cluster-details -n openshift-storage -o json`,
        ).toString(),
      );
      const fileData = JSON.parse(Base64.decode(secret.data.external_cluster_details));
      expect(_.isEqual(fileData, ClusterMetadata)).toEqual(true);
    });

    it('Test Storage Cluster CR is created with externalStorage set to true', async () => {
      const storageCluster = JSON.parse(
        execSync(
          `kubectl get storagecluster ocs-independent-storagecluster -n openshift-storage -o json`,
        ).toString(),
      );
      expect(storageCluster.spec.externalStorage.enable).toEqual(true);
    });
  });
}

if (TEST_PLATFORM === Platform.OCS && MODE === Mode.ATTACHED_DEVICES) {
  describe('Test creation of Attached Storage Cluster', () => {
    it('Info Alert should be shown as LSO will not be installed', async () => {
      await Installer.createAttachedStorageCluster();
      const msg = await currentSelectors.LSOAlert.getText();
      expect(msg.includes(LSO_INFO_MSG)).toBe(true);
    });

    it(
      'tests subscription flow for LSO Operator',
      async () => {
        await Installer.subscribeToLSOOperator();
      },
      3 * MINUTE,
    );

    it('Create Storage Class Wizard should be present once LSO is installed and no storage class is present', async () => {
      await goToInstalledOperators();
      await Installer.selectOCSOperator();
      await Installer.createAttachedStorageCluster();
      expect(currentSelectors.LSOWizard.isPresent()).toBeTruthy();
    });

    it('Create Storage Cluster View should be present when LSO is installed and storage class is present', async () => {
      execSync(`echo '${JSON.stringify(testNoProvisionerSC)}' | oc apply -f -`);
      await goToInstalledOperators();
      await Installer.selectOCSOperator();
      await Installer.createAttachedStorageCluster();
      expect(currentSelectors.LSOWizard.isPresent()).toBeFalsy();

      // installation page should not be present
      const msg = await currentSelectors.LSOAlert.getText();
      expect(msg.includes(LSO_INFO_MSG)).toBe(false);
      execSync(`echo '${JSON.stringify(testNoProvisionerSC)}' | oc delete -f -`);
    });

    it('Should show error message on Create Storage Cluster View, if storage class does not contain minimum 3 nodes ', async () => {
      execSync(`echo '${JSON.stringify(testNoProvisionerSC)}' | oc apply -f -`);
      await goToInstalledOperators();
      await Installer.selectOCSOperator();
      await Installer.createAttachedStorageCluster();
      await click(currentSelectors.scDropdown);
      await click(currentSelectors.selectSC(testNoProvisionerSC.metadata.name));
      await browser.wait(until.visibilityOf(currentSelectors.createNewSCBtn));
      await browser.wait(until.and(crudView.untilNoLoadersPresent));
      expect(currentSelectors.errorAlert.isPresent()).toBeTruthy();
      execSync(`echo '${JSON.stringify(testNoProvisionerSC)}' | oc delete -f -`);
    });

    describe('Should be able to create storage class via the wizard, when no storage class is present for attached devices', async () => {
      const scName = 'lvs';
      let step = '';

      beforeAll(async () => {
        await goToInstalledOperators();
        await Installer.selectOCSOperator();
        await Installer.createAttachedStorageCluster();
      });

      it('Should see the 1st step - Discover Disks', async () => {
        await browser.wait(until.and(crudView.untilNoLoadersPresent));
        step = await currentSelectors.currentStep.getText();
        expect(step.includes(SC_STEPS_NAME.DISCOVERY)).toBeTruthy();
        // next btn
        await click(currentSelectors.primaryButton);
      });

      it('Should see the 2nd step - Create Local volume Set and all the required conditions should be met', async () => {
        // 2nd step
        await browser.wait(until.and(crudView.untilNoLoadersPresent));

        // verify dicovery CR got created
        const discoveryCR = JSON.parse(
          execSync(
            `kubectl get LocalVolumeDiscovery ${DISCOVERY_CR_NAME} -n ${LOCAL_STORAGE_NAMESPACE} -o json`,
          ).toString(),
        );
        const numOfNodes =
          discoveryCR?.spec?.nodeSelector?.nodeSelectorTerms?.[0]?.matchExpressions?.[0]?.values
            ?.length;
        expect(numOfNodes).toBe(MINIMUM_NODES);

        await browser.wait(until.visibilityOf(currentSelectors.localVolumeSetView));
        step = await currentSelectors.currentStep.getText();
        expect(step.includes(SC_STEPS_NAME.STORAGECLASS)).toBeTruthy();
        let classes = await currentSelectors.primaryButton.getAttribute('class');
        // next btn should be disabled as lvs name is not yet entered
        expect(classes).toContain('pf-m-disabled');

        await currentSelectors.volumeSetName.sendKeys(scName);
        classes = await currentSelectors.primaryButton.getAttribute('class');
        // next btn should be enabled now as lvs name is entered
        expect(classes).not.toContain('pf-m-disabled');
        const nodesCnt = await currentSelectors.nodesCntOnLVS.getText();
        expect(nodesCnt.includes(MINIMUM_NODES)).toBeTruthy();
        // next btn
        await click(currentSelectors.primaryButton);

        // confirm Modal
        const modalTitle = await currentSelectors.confirmModal.getText();
        expect(modalTitle.includes(CONFIRM_MODAL_TITLE)).toBe(true);
        await click(currentSelectors.confirmBtn);
      });

      it('Should see the 3rd step - Create storage cluster and all the required conditions should be met', async () => {
        // 3rd step
        await browser.wait(until.and(crudView.untilNoLoadersPresent));
        await browser.wait(until.visibilityOf(currentSelectors.createStorageClusterView));
        step = await currentSelectors.currentStep.getText();
        expect(step.includes(SC_STEPS_NAME.STORAGECLUSTER)).toBe(true);
        // need to wait for the nodes to get associated properly to storage class
        await browser.sleep(40 * SECOND);
        await click(currentSelectors.scDropdown);
        await click(currentSelectors.selectSC(scName));
        await currentSelectors.nodeListHandler();

        const nodeNames = await currentSelectors.nodeNamesForAD;
        const selectedNodes = nodeNames.map((nodeName) => nodeName.getText());

        await click(currentSelectors.primaryButton);
        await browser.wait(until.and(crudView.untilNoLoadersPresent));

        const text = await crudView.resourceTitle.getText();
        expect(text).toEqual(STORAGE_CLUSTER_NAME);
        // Verify all the nodes have the required labels
        // Wait for 5 seconds for label to apply
        await browser.sleep(5 * SECOND);
        let nodes: string[] = await Promise.all(selectedNodes);
        // Data syntax Node\nN\n<node-name>
        nodes = nodes.map((node) => node.split('\n')[2]);
        nodes.forEach((node) => expect(verifyNodeLabels(node, OCS_NODE_LABEL)).toBeTruthy());
        const storageCR = JSON.parse(
          execSync(
            `kubectl get storageclusters ${STORAGE_CLUSTER_NAME} -n ${OCS_NS} -o json`,
          ).toString(),
        );
        const scFromCR =
          storageCR?.spec?.storageDeviceSets?.[0]?.dataPVCTemplate?.spec?.storageClassName;
        const monDataDirHostPath = storageCR?.spec?.monDataDirHostPath;
        const portable = storageCR?.spec?.storageDeviceSets?.[0]?.portable;
        expect(scFromCR).toEqual(scName);
        expect(monDataDirHostPath).toBe('/var/lib/rook');
        expect(portable).toBeFalsy();
      });
    });
  });
}

if (TEST_PLATFORM === 'OCS') {
  describe('Tests for pods and storage classes', () => {
    let pods = null;

    beforeAll(async () => {
      // Wait for cluster to come to ready state
      await checkIfClusterIsReady();
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

    it('tests if 3 rook-ceph-osd-prepare-ocs-deviceset have succeeded', () => {
      const podList = getPodData(pods, POD_NAME_PATTERNS.ROOK_CEPH_OSD_PREPARE);
      expect(podList.length).toBe(2);
      podList.forEach((pod) => {
        testPodIsSucceeded(getPodPhase(pod));
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
}
