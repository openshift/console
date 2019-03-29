import { volumeRows } from '../../../views/kubevirt/virtualMachineInstance.view';
import { DetailView } from './detailView';

export class VirtualMachineInstance extends DetailView {
  constructor(name: string, namespace: string) {
    super(name, namespace, 'pods');
  }

  async getVolumes() {
    const disks = [];
    for (const row of await volumeRows) {
      disks.push(await row.$$('div').first().getText());
    }
    return disks;
  }
}
