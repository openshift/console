/* eslint-disable no-unused-vars, no-undef, no-await-in-loop, no-console */
import { volumeRows } from '../../views/virtualMachineInstance.view';
import { DetailView } from './detailView';

export class VirtualMachineInstance extends DetailView {
  constructor(vmiConfig) {
    super({ ...vmiConfig, kind: 'pods' });
  }

  async getVolumes() {
    const disks = [];
    for (const row of await volumeRows) {
      disks.push(
        await row
          .$$('td')
          .first()
          .getText(),
      );
    }
    return disks;
  }
}
