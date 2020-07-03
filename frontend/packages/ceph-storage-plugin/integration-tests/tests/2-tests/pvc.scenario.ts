import { execSync } from 'child_process';
import { browser } from 'protractor';
import { appHost, testName } from '@console/internal-integration-tests/protractor.conf';
import { resourceRowsPresent } from '@console/internal-integration-tests/views/crud.view';
import {
  addStorage,
  createNewPersistentVolumeClaim,
  deletePersistentVolumeClaim,
  goToPersistentVolumeClaims,
  pvcStatus,
  pvcSize,
} from '../../views/pvc.view';
import {
  PVC_STATUS,
  SIZE_UNITS,
  STORAGE_CLASS_PATTERNS,
  VOLUME_ACCESS_MODES,
} from '../../utils/consts';
import { deployment, testDeployment } from '../../mocks/deploymentData';

describe('Test PVC creation with options.', () => {
  beforeAll(async () => {
    await browser.get(`${appHost}/`);
    execSync(`echo '${JSON.stringify(deployment)}' | kubectl create -n ${testName} -f -`);
  });

  it('Test RBD PVC is created and gets bound', async () => {
    const testPvc = {
      name: 'rbdpvc',
      namespace: testName,
      size: '5',
      sizeUnits: SIZE_UNITS.GI,
      storageClass: STORAGE_CLASS_PATTERNS.RBD,
      accessMode: VOLUME_ACCESS_MODES.RWO,
    };
    await createNewPersistentVolumeClaim(testPvc, true);
    expect(pvcStatus.getText()).toEqual(PVC_STATUS.BOUND);
    await goToPersistentVolumeClaims();
    await resourceRowsPresent();
    await deletePersistentVolumeClaim(testPvc.name, testName);
  });

  it('Test PVC size is rounded', async () => {
    // PVC size of 1.5 should be rounded to 2
    // https://bugzilla.redhat.com/show_bug.cgi?id=1746156
    const testPvc = {
      name: 'rbdpvc',
      namespace: testName,
      size: '1.5',
      sizeUnits: SIZE_UNITS.GI,
      storageClass: STORAGE_CLASS_PATTERNS.RBD,
      accessMode: VOLUME_ACCESS_MODES.RWO,
    };
    await createNewPersistentVolumeClaim(testPvc, true);
    expect(pvcSize.getText()).toEqual('2Gi');
    await goToPersistentVolumeClaims();
    await resourceRowsPresent();
    await deletePersistentVolumeClaim(testPvc.name, testName);
  });

  it('Test cephFS PVC is created and gets bound', async () => {
    const testPvc = {
      name: 'cephfspvc',
      namespace: testName,
      size: '1',
      sizeUnits: SIZE_UNITS.TI,
      storageClass: STORAGE_CLASS_PATTERNS.FS,
      accessMode: VOLUME_ACCESS_MODES.RWO,
    };
    await createNewPersistentVolumeClaim(testPvc, true);
    expect(pvcStatus.getText()).toEqual(PVC_STATUS.BOUND);
    await goToPersistentVolumeClaims();
    await resourceRowsPresent();
    await deletePersistentVolumeClaim(testPvc.name, testName);
  });

  it('Test RWX RBD PVC is created and gets bound', async () => {
    const testPvc = {
      name: 'rwxrbdpvc',
      namespace: testName,
      size: '512',
      sizeUnits: SIZE_UNITS.MI,
      storageClass: STORAGE_CLASS_PATTERNS.RBD,
      accessMode: VOLUME_ACCESS_MODES.RWX,
    };
    await createNewPersistentVolumeClaim(testPvc, true);
    expect(pvcStatus.getText()).toEqual(PVC_STATUS.BOUND);
    await goToPersistentVolumeClaims();
    await resourceRowsPresent();
    await deletePersistentVolumeClaim(testPvc.name, testName);
  });

  it('Test RWX CephFS PVC is created and gets bound', async () => {
    const testPvc = {
      name: 'rwxcephfspvc',
      namespace: testName,
      size: '5',
      sizeUnits: SIZE_UNITS.GI,
      storageClass: STORAGE_CLASS_PATTERNS.FS,
      accessMode: VOLUME_ACCESS_MODES.RWX,
    };
    await createNewPersistentVolumeClaim(testPvc, true);
    expect(pvcStatus.getText()).toEqual(PVC_STATUS.BOUND);
    await goToPersistentVolumeClaims();
    await resourceRowsPresent();
    await deletePersistentVolumeClaim(testPvc.name, testName);
  });

  it('Test RWX CephFS PVC can be successfully attached to deployment', async () => {
    const testPvc = {
      name: 'rwxcephfspvc',
      namespace: testName,
      size: '5',
      sizeUnits: SIZE_UNITS.GI,
      storageClass: STORAGE_CLASS_PATTERNS.FS,
      accessMode: VOLUME_ACCESS_MODES.RWX,
    };
    await createNewPersistentVolumeClaim(testPvc, true);
    await addStorage(testDeployment, testPvc.name, testName);
  });

  afterAll(async () => {
    execSync(`echo '${JSON.stringify(deployment)}' | kubectl delete -n ${testName} -f -`);
    await goToPersistentVolumeClaims();
    await resourceRowsPresent();
    await deletePersistentVolumeClaim('rwxcephfspvc', testName);
  });
});
