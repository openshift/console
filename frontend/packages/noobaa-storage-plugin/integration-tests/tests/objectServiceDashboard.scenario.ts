import {
  goToObjectServiceDashboard,
  msgStatus,
  noobaaBuckets,
  obs,
  obcs,
} from '../views/objectServiceDashboard.view';
import { OCP_HEALTH_ICON_COLORS } from '@console/ceph-storage-plugin/integration-tests/utils/consts';
import { CreateOBCHandler, goToOBCPage } from '../views/obcPage.view';
import { testName } from '@console/internal-integration-tests/protractor.conf';
import {
  namespaceDropdown,
  selectItemFromDropdown,
} from '@console/ceph-storage-plugin/integration-tests/views/pvc.view';
import { OBC_NAME, OBC_STORAGE_CLASS } from '../utils/consts';

describe('Check data on Object Service Dashboard.', () => {
  let obcHandler;

  beforeAll(async () => {
    await goToObjectServiceDashboard();
  });

  it('Check Multicloud Service Gateway is healthy', () => {
    expect(msgStatus.getAttribute('fill')).toEqual(OCP_HEALTH_ICON_COLORS.GREEN);
  });

  it('Check that initial number of Noobaa buckets is 1', () => {
    expect(noobaaBuckets.getText()).toEqual('1 NooBaa Bucket\n0 Objects');
  });

  it('Check that initial number of object buckets is 0', () => {
    expect(obs.getText()).toEqual('0 Object Buckets\n0 Objects');
  });

  it('Check that initial number of object bucket claims is 0', () => {
    expect(obcs.getText()).toEqual('0 Object Bucket Claims\n0 Objects');
  });

  it('Check that number of obs is updated after ob creation', async () => {
    obcHandler = new CreateOBCHandler(OBC_NAME, testName, OBC_STORAGE_CLASS, '');
    await obcHandler.createBucketClaim();
    await goToObjectServiceDashboard();
    expect(obs.getText()).toContain('Object');
    await goToOBCPage();
    await selectItemFromDropdown('ALL_NS#', namespaceDropdown);
    await obcHandler.deleteBucketClaim();
  });
});
