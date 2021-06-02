import { isEmpty } from 'lodash';
import { NADConfig } from '../../types';
import { NADDetail } from './nadDetail';
import { NADForm } from './nadForm';

export class NetworkAttachmentDefinition extends NADDetail {
  async create({ name, description, bridgeName, vlanTagNum }: NADConfig, networkTypeID: string) {
    await this.navigateToListView();

    const form = new NADForm();
    await form.openNADForm();
    await form.fillName(name);

    if (!isEmpty(description)) {
      await form.fillDescription(description);
    }

    await form.selectNetworkTypeByID(networkTypeID);
    await form.fillBridgeName(bridgeName);

    if (!isEmpty(vlanTagNum)) {
      await form.fillVLANTagNumInput(vlanTagNum);
    }

    await form.create();
    await form.waitForCreation();
  }
}
