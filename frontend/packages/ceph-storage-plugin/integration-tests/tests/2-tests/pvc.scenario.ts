import { browser } from 'protractor';
import { appHost } from '@console/internal-integration-tests/protractor.conf';
import { resourceRowsPresent } from '@console/internal-integration-tests/views/crud.view';
import {
  createNewPersistentVolumeClaim,
  deletePersistentVolumeClaim,
  goToPersistentVolumeClaims,
  pvcStatus,
  pvcSize,
} from '../../views/pvc.view';
import {
  NS,
  PVC_STATUS,
  SIZE_UNITS,
  STORAGE_CLASS_PATTERNS,
  VOLUME_ACCESS_MODES,
} from '../../utils/consts';

describe('Test PVC creation with options.', () => {
  beforeAll(async () => {
    await browser.get(`${appHost}/`);
  });

  it('Test RBD PVC is created and gets bound', async () => {
    const testPvc = {
      name: 'rbdpvc',
      namespace: NS,
      size: '5',
      sizeUnits: SIZE_UNITS.GI,
      storageClass: STORAGE_CLASS_PATTERNS.RBD,
      accessMode: VOLUME_ACCESS_MODES.RWO,
    };
    await createNewPersistentVolumeClaim(testPvc, true);
    expect(pvcStatus.getText()).toEqual(PVC_STATUS.BOUND);
    await goToPersistentVolumeClaims();
    await resourceRowsPresent();
    await deletePersistentVolumeClaim('rbdpvc', NS);
  });

  it('Test PVC size is rounded', async () => {
    // PVC size of 1.5 should be rounded to 2
    // https://bugzilla.redhat.com/show_bug.cgi?id=1746156
    const testPvc = {
      name: 'rbdpvc',
      namespace: NS,
      size: '1.5',
      sizeUnits: SIZE_UNITS.GI,
      storageClass: STORAGE_CLASS_PATTERNS.RBD,
      accessMode: VOLUME_ACCESS_MODES.RWO,
    };
    await createNewPersistentVolumeClaim(testPvc, true);
    expect(pvcSize.getText()).toEqual('2 GiB');
    await goToPersistentVolumeClaims();
    await resourceRowsPresent();
    await deletePersistentVolumeClaim('rbdpvc', NS);
  });

  it('Test cephFS PVC is created and gets bound', async () => {
    const testPvc = {
      name: 'cephfspvc',
      namespace: NS,
      size: '1',
      sizeUnits: SIZE_UNITS.TI,
      storageClass: STORAGE_CLASS_PATTERNS.FS,
      accessMode: VOLUME_ACCESS_MODES.RWO,
    };
    await createNewPersistentVolumeClaim(testPvc, true);
    expect(pvcStatus.getText()).toEqual(PVC_STATUS.BOUND);
    await goToPersistentVolumeClaims();
    await resourceRowsPresent();
    await deletePersistentVolumeClaim('cephfspvc', NS);
  });

  it('Test RWX RBD PVC is created and gets bound', async () => {
    const testPvc = {
      name: 'rwxrbdpvc',
      namespace: NS,
      size: '512',
      sizeUnits: SIZE_UNITS.MI,
      storageClass: STORAGE_CLASS_PATTERNS.RBD,
      accessMode: VOLUME_ACCESS_MODES.RWX,
    };
    await createNewPersistentVolumeClaim(testPvc, true);
    expect(pvcStatus.getText()).toEqual(PVC_STATUS.BOUND);
    await goToPersistentVolumeClaims();
    await resourceRowsPresent();
    await deletePersistentVolumeClaim('rwxrbdpvc', NS);
  });

  it('Test RWX CephFS PVC is created and gets bound', async () => {
    const testPvc = {
      name: 'rwxcephfspvc',
      namespace: NS,
      size: '5',
      sizeUnits: SIZE_UNITS.GI,
      storageClass: STORAGE_CLASS_PATTERNS.FS,
      accessMode: VOLUME_ACCESS_MODES.RWX,
    };
    await createNewPersistentVolumeClaim(testPvc, true);
    expect(pvcStatus.getText()).toEqual(PVC_STATUS.BOUND);
    await goToPersistentVolumeClaims();
    await resourceRowsPresent();
    await deletePersistentVolumeClaim('rwxcephfspvc', NS);
  });
});
