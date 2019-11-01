import { click } from '@console/shared/src/test-utils/utils';
import * as view from '../../views/dialogs/networkInterface.view';
import { fillInput, selectOptionByText } from '../utils/utils';
import { NetworkResource } from '../utils/types';
import { applyButton } from '../../views/kubevirtDetailView.view';
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
    await selectOptionByText(view.nicBinding, type);
  }

  async fillMAC(mac: string) {
    await fillInput(view.nicMACAddress, mac);
  }

  async create(nic: NetworkResource) {
    await waitForNoLoaders();
    await this.fillName(nic.name);
    await this.selectModel(nic.model);
    await this.selectNetwork(nic.network);
    await this.selectType(nic.type);
    await this.fillMAC(nic.mac);
    await click(applyButton);
    await waitForNoLoaders();
  }
}
