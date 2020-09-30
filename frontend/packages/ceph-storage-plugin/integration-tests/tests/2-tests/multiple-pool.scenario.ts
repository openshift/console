import { browser, ExpectedConditions as until } from 'protractor';
import { execSync } from 'child_process';
import { click } from '@console/shared/src/test-utils/utils';
import { NS, CLUSTER_STATUS } from '../../utils/consts';
import {
  prepareStorageClassForm,
  allowExpand,
  poolDropdownButton,
  createPoolDropdown,
  createPool,
  poolForm,
  poolStatusCheck,
  poolMessage,
  POOL_STATUS,
  finishButton,
  dropdownPoolName,
  poolDescription,
  modalPresence,
  showProvisioner,
} from '../../views/multiple-pool.view';

const cephValue = JSON.parse(execSync(`kubectl get cephCluster -n ${NS} -o json`).toString());
const cephStatus = cephValue.items[0];

if (cephStatus?.status?.phase !== CLUSTER_STATUS.READY) {
  describe('Check for pool creation if ceph cluster is not in ready state', () => {
    beforeAll(async () => {
      prepareStorageClassForm('openshift-storage.rbd.csi.ceph.com');
    });

    it('Should show that provisioner supports expanding', () => {
      expect(allowExpand.getText()).toEqual('Allow persistent volume claims to be expanded');
    });

    it('Should open a modal when clicked on create new pool and report the ceph cluster is not ready', async () => {
      await click(createPoolDropdown);
      expect(poolStatusCheck.getText()).toEqual(poolMessage.PROGRESS);
    });
  });
}

if (cephStatus?.status?.phase === CLUSTER_STATUS.READY) {
  describe('Check for pool creation if ceph cluster is in ready state', () => {
    beforeAll(async () => {
      prepareStorageClassForm('openshift-storage.rbd.csi.ceph.com');
      await click(poolDropdownButton);
      await click(createPoolDropdown);
    });

    afterAll(async () => {
      execSync(`kubectl delete CephBlockPool foo -n ${NS}`);
    });

    it('Should show that provisioner supports expanding', () => {
      expect(allowExpand.getText()).toEqual('Allow persistent volume claims to be expanded');
    });

    it('Should show the pool form', () => {
      expect(poolForm.getText()).toEqual('Pool Name');
    });

    it('Should initiate pool creation', async () => {
      createPool();
      await browser.wait(until.presenceOf(poolStatusCheck));
      expect(poolStatusCheck.getText()).toEqual(poolMessage.POOL_START);
    });

    it('Should successfully create a pool', async () => {
      await browser.wait(until.textToBePresentInElement(poolStatusCheck, poolMessage.POOL_CREATED));
      const poolValue = JSON.parse(
        execSync(`kubectl get Cephblockpool foo -n ${NS} -o json`).toString(),
      );
      expect(poolValue.status.phase).toEqual(POOL_STATUS.READY);
      expect(poolStatusCheck.getText()).toEqual(poolMessage.POOL_CREATED);
    });

    it('Should successfully close the modal', async () => {
      await click(finishButton);
      expect(modalPresence.isPresent()).toBe(false);
    });

    it('Should add the pool to the dropdown', async () => {
      await browser.refresh();
      showProvisioner('openshift-storage.rbd.csi.ceph.com');
      await click(poolDropdownButton);
      expect(dropdownPoolName.getText()).toEqual('foo');
      expect(poolDescription.getText()).toEqual('Replica 2, no compression');
    });

    it('Should throw an error if duplicate pool is created', async () => {
      await click(createPoolDropdown);
      createPool();
      await browser.wait(
        until.textToBePresentInElement(poolStatusCheck, poolMessage.POOL_DUPLICATED),
      );
      expect(poolStatusCheck.getText()).toEqual(poolMessage.POOL_DUPLICATED);
    });
  });
}
