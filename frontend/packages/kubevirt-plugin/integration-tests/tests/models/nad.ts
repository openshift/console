/* eslint-disable no-await-in-loop */
import { browser, ExpectedConditions as until } from 'protractor';
import { click, waitForCount } from '@console/shared/src/test-utils/utils';
import { createYAMLButton, saveChangesBtn } from '@console/internal-integration-tests/views/crud.view';
import { TAB, diskTabCol, networkTabCol, PAGE_LOAD_TIMEOUT_SECS } from '../utils/consts';
import { fillInput, selectOptionByText } from '../utils/utils';
import { StorageResource, NetworkResource } from '../utils/types';
import * as kubevirtDetailView from '../../views/kubevirtDetailView.view';
import { confirmAction } from '../../views/vm.actions.view';
import { vmDetailFlavorEditButton, vmDetailCdEditButton } from '../../views/virtualMachine.view';
import * as editCD from '../../views/editCDView';
import { NetworkInterfaceDialog } from '../dialogs/networkInterfaceDialog';
import { DiskDialog } from '../dialogs/diskDialog';
import { DetailView } from './detailView';
import * as editFlavor from './editFlavorView';
import * as nadView from '../../views/nad.view';

export class NAD extends DetailView {
  constructor(nadConfig) {
    super({ ...nadConfig, kind: 'networkattachmentdefinitions' });
  }

  async create({
    name,
    description,
    networkType,
    bridgeName,
    bridgeVlanTagNum,
  }: nadConfig) {
    await click(createYAMLButton);
    await fillInput(nadView.nadName, name);
    await fillInput(nadView.nadDesc, description);
    await selectOptionByText(nadView.nadNetworkType, networkType);
    await fillInput(nadView.bridgeName, bridgeName);
    await click(saveChangesBtn)
    await this.navigateToDetail();
  }

  asResource() {
    return {
      kind: 'networkattachmentdefinitions',
      metadata: {
        namespace: this.namespace,
        name: this.name,
      },
    };
  }
}
