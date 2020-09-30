import { click, fillInput } from '@console/shared/src/test-utils/utils';
import * as view from '../../views/dialogs/networkInterface.view';
import { selectOptionByText, getSelectOptions, selectItemFromDropdown } from '../utils/utils';
import { Network } from '../types/types';
import { modalSubmitButton, saveButton } from '../../views/kubevirtUIResource.view';
import { waitForNoLoaders } from '../../views/wizard.view';

export class NetworkInterfaceDialog {
  async fillName(name: string) {
    await fillInput(view.nicName, name);
  }

  async selectModel(model: string) {
    await selectItemFromDropdown(view.nicModel, view.nicDropDownItem(model));
  }

  async selectNetwork(network: string) {
    await selectOptionByText(view.nicNetwork, network);
  }

  async selectType(type: string) {
    await selectItemFromDropdown(view.nicType, view.nicDropDownItem(type));
  }

  async fillMAC(mac: string) {
    await fillInput(view.nicMACAddress, mac);
  }

  async getNetworks(): Promise<string[]> {
    return getSelectOptions(view.nicNetwork);
  }

  async create(NIC: Network) {
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
