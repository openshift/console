import { ExpectedConditions as until, browser } from 'protractor';
import { execSync, ExecFileOptionsWithStringEncoding } from 'child_process';
import { K8sResourceKind } from '@console/internal/module/k8s';
import { appHost } from '@console/internal-integration-tests/protractor.conf';
import { click } from '@console/shared/src/test-utils/utils';
import { DeviceSet } from '../../../src/components/ocs-install/ocs-request-data';
import { OCS_INTERNAL_CR_NAME } from '../../../src/constants';
import { getCurrentDeviceSetIndex } from '../../../src/utils/add-capacity';
import { testEbsSC, testNoProvisionerSC } from '../../mocks/storage-class';
import {
  goToInstalledOperators,
  currentACSelector,
  clickKebabAction,
} from '../../views/add-capacity.view';
import { NS } from '../../utils/consts';

const fetchStorageClusterJson = () => {
  const options: ExecFileOptionsWithStringEncoding = {
    encoding: 'utf8',
  };
  return JSON.parse(
    execSync(
      `kubectl get --ignore-not-found storagecluster ${OCS_INTERNAL_CR_NAME} -n ${NS} -o json`,
      options,
    ),
  );
};

const addCapacity = async (uid: string, scName: string) => {
  await clickKebabAction(uid, 'Add Capacity');
  await click(currentACSelector.scDropdown);
  await click(currentACSelector.getSCOption(scName));
  await click(currentACSelector.confirmButton);
};

describe('Add capacity using multiple storage classes', () => {
  const beforeCapacityAddition = {
    deviceSets: null,
    portability: null,
    devicesCount: null,
  };
  beforeAll(async () => {
    execSync(`echo '${JSON.stringify(testEbsSC)}' | kubectl apply -f -`);
    execSync(`echo '${JSON.stringify(testNoProvisionerSC)}' | kubectl apply -f -`);
    await browser.get(`${appHost}/`);
    await goToInstalledOperators();
    await click(currentACSelector.ocsOp);
    await browser.wait(until.presenceOf(currentACSelector.storageClusterNav));
    await click(currentACSelector.storageClusterNav);
  });
  afterAll(() => {
    execSync(`echo '${JSON.stringify(testEbsSC)}' | kubectl delete -f -`);
    execSync(`echo '${JSON.stringify(testNoProvisionerSC)}' | kubectl delete -f -`);
  });
  describe('Add capacity with a new storage class having EBS as provisioner', async () => {
    const { name: scName } = testEbsSC.metadata;
    let index: number;
    let deviceSets: DeviceSet[];
    beforeAll(async () => {
      const json: K8sResourceKind = fetchStorageClusterJson();
      beforeCapacityAddition.deviceSets = json.spec.storageDeviceSets.length;
      await addCapacity(json.metadata.uid, scName);
      const latestJson: K8sResourceKind = fetchStorageClusterJson();
      deviceSets = latestJson.spec.storageDeviceSets;
      index = getCurrentDeviceSetIndex(deviceSets, scName);
    });
    it('New device set is created', () =>
      expect(deviceSets.length).toBe(beforeCapacityAddition.deviceSets + 1));
    it('Device count is 1 in the new device set', () => expect(deviceSets[index].count).toBe(1));
    it('Osd portability is enabled in the new device set', () =>
      expect(deviceSets[index].portable).toBe(true));
  });
  describe('Add capacity with an existing storage class having EBS as provisioner', async () => {
    const { name: scName } = testEbsSC.metadata;
    let latestDeviceSets: DeviceSet[];
    let latestIndex: number;
    beforeAll(async () => {
      const json: K8sResourceKind = fetchStorageClusterJson();
      const deviceSets: DeviceSet[] = json.spec.storageDeviceSets;
      const index = getCurrentDeviceSetIndex(deviceSets, scName);
      beforeCapacityAddition.deviceSets = deviceSets.length;
      beforeCapacityAddition.portability = deviceSets[index].portable;
      beforeCapacityAddition.devicesCount = deviceSets[index].count;
      await addCapacity(json.metadata.uid, scName);
      const latestJson: K8sResourceKind = fetchStorageClusterJson();
      latestDeviceSets = latestJson.spec.storageDeviceSets;
      latestIndex = getCurrentDeviceSetIndex(latestDeviceSets, scName);
    });

    it('New device set is not created', () =>
      expect(latestDeviceSets.length).toBe(beforeCapacityAddition.deviceSets));
    it('Devices count is incremented by 1 in the corresponding device set', () =>
      expect(latestDeviceSets[latestIndex].count).toBe(beforeCapacityAddition.devicesCount + 1));
    it('Osd portability is not modified in the corresponding device set', () =>
      expect(latestDeviceSets[latestIndex].portable).toBe(beforeCapacityAddition.portability));
  });
  describe(`Add capacity with a new storage class having NO-PROVISIONER as provisioner`, async () => {
    const { name: scName } = testNoProvisionerSC.metadata;
    let deviceSets: DeviceSet[];
    let index: number;
    beforeAll(async () => {
      const json: K8sResourceKind = fetchStorageClusterJson();
      beforeCapacityAddition.deviceSets = json.spec.storageDeviceSets.length;
      await addCapacity(json.metadata.uid, scName);
      const latestJson: K8sResourceKind = fetchStorageClusterJson();
      deviceSets = latestJson.spec.storageDeviceSets;
      index = getCurrentDeviceSetIndex(deviceSets, scName);
    });
    it('New device set is created', () =>
      expect(deviceSets.length).toBe(beforeCapacityAddition.deviceSets + 1));
    it('Device count is 1 in the new device set', () => expect(deviceSets[index].count).toBe(1));
    it('Osd portability is disabled in the new device set', () =>
      expect(deviceSets[index].portable).toBe(false));
  });
});
