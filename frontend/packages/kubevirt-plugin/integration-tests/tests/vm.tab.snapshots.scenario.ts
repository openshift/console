import { browser, ExpectedConditions as until } from 'protractor';

import { testName } from '@console/internal-integration-tests/protractor.conf';
import {
  addLeakableResource,
  click,
  createResource,
  removeLeakedResources,
} from '@console/shared/src/test-utils/utils';

import { READY } from '../../src/utils/strings';
import { listViewAction } from '../views/actions.view';
import { saveButton } from '../views/kubevirtUIResource.view';
import * as editVMSnapshotsView from '../views/vm.snapshots.view';
import { getVMManifest } from './mocks/mocks';
import { VirtualMachine } from './models/virtualMachine';
import { ON_CI, VM_CREATE_AND_EDIT_TIMEOUT_SECS } from './utils/constants/common';
import { ProvisionSource } from './utils/constants/enums/provisionSource';
import { getRandStr } from './utils/utils';

const TEST_SNAPSHOT = 'test-snapshot';

describe('KubeVirt VM Snapshots', () => {
  const leakedResources = new Set<string>();

  afterAll(() => {
    removeLeakedResources(leakedResources);
  });

  // CI doesn't currently support snapshot-enabled storage classes
  if (!ON_CI) {
    it(
      'ID(CNV-4717) create, restore and delete a snapshot',
      async () => {
        const testVM = getVMManifest(
          ProvisionSource.CONTAINER,
          testName,
          `snapshotresourcevm-${getRandStr(5)}`,
          null,
          true,
        );
        const vm = new VirtualMachine(testVM.metadata);

        createResource(testVM);
        addLeakableResource(leakedResources, testVM);

        await vm.navigateToSnapshots();
        await click(editVMSnapshotsView.addSnapshotBtn);
        await editVMSnapshotsView.snapshotNameInput
          .clear()
          .then(() => editVMSnapshotsView.snapshotNameInput.sendKeys(TEST_SNAPSHOT));
        if (await editVMSnapshotsView.approveUnsupportedCheckbox.isPresent()) {
          await click(editVMSnapshotsView.approveUnsupportedCheckbox);
        }
        await click(saveButton);

        // wait for snapshot to be ready
        await browser.wait(
          until.textToBePresentInElement(
            editVMSnapshotsView.getStatusElement(TEST_SNAPSHOT),
            READY,
          ),
        );

        // restore and wait for completion
        await click(editVMSnapshotsView.getRestoreButton(TEST_SNAPSHOT));
        await click(editVMSnapshotsView.restoreModalButton);

        await browser.wait(
          until.not(
            until.textToBePresentInElement(
              editVMSnapshotsView.getRestoreTimestamp(TEST_SNAPSHOT),
              '-',
            ),
          ),
        );

        // delete snapshot
        await listViewAction(TEST_SNAPSHOT)(editVMSnapshotsView.DELETE_SNAPSHOT_TEXT, true);
        await browser.wait(
          until.textToBePresentInElement(
            editVMSnapshotsView.snapshotStatusBox,
            editVMSnapshotsView.EMPTY_SNAPSHOTS_TEXT,
          ),
        );
      },
      VM_CREATE_AND_EDIT_TIMEOUT_SECS,
    );
  }

  it(
    'do not allow saving of snapshots if no snapshot-enabled disk exists on the VM',
    async () => {
      const testVM = getVMManifest(
        ProvisionSource.CONTAINER,
        testName,
        `snapshotresourcevm-${getRandStr(5)}`,
        null,
        true,
      );
      const vm = new VirtualMachine(testVM.metadata);

      createResource(testVM);
      addLeakableResource(leakedResources, testVM);

      await vm.navigateToSnapshots();
      await click(editVMSnapshotsView.addSnapshotBtn);
      expect(saveButton.getAttribute('class')).toContain('pf-m-disabled');
    },
    VM_CREATE_AND_EDIT_TIMEOUT_SECS,
  );
});
