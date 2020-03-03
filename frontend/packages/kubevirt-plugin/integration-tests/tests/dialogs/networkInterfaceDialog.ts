import { click } from '@console/shared/src/test-utils/utils';
import * as view from '../../views/dialogs/networkInterface.view';
import { fillInput, selectOptionByText, getSelectOptions } from '../utils/utils';
import { NetworkResource } from '../utils/types';
import { modalSubmitButton, saveButton } from '../../views/kubevirtDetailView.view';
import { waitForNoLoaders } from '../../views/wizard.view';

export class NetworkInterfaceDialog {
  async fillName(name: string) {
    await fillInput(view.nicName, name);
  }

  async selectModel(model: string) {
    await selectOptionByText(view.nicModel, model);
  }

  async selectNetwork(network: string) {
    await selectOptionByText(view.nicNetwork, network);
  }

  async selectType(type: string) {
    await selectOptionByText(view.nicType, type);
  }

  async fillMAC(mac: string) {
    await fillInput(view.nicMACAddress, mac);
  }

  async getNetworks(): Promise<string[]> {
    return getSelectOptions(view.nicNetwork);
  }

  async create(NIC: NetworkResource) {
    await waitForNoLoaders();
    await this.fillName(NIC.name);
    await this.selectModel(NIC.model);
    await this.selectNetwork(NIC.network);
    await this.selectType(NIC.type);
    await this.fillMAC(NIC.mac);
    await click(modalSubmitButton);
    await waitForNoLoaders();
  }

  async edit(NIC) {
    await waitForNoLoaders();
    if (NIC.name) {
      await this.fillName(NIC.name);
    }
    if (NIC.model) {
      await this.selectModel(NIC.model);
    }
    if (NIC.network) {
      await this.selectNetwork(NIC.network);
    }
    if (NIC.type) {
      await this.selectType(NIC.type);
    }
    if (NIC.mac) {
      await this.fillMAC(NIC.mac);
    }
    await click(saveButton);
    await waitForNoLoaders();
  }
}
