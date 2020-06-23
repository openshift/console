/* eslint-disable no-await-in-loop */
import * as view from '../../views/dialogs/editNodeSelectorView';
import { fillInput } from '@console/shared/src/test-utils/utils';
import { click } from '@console/dev-console/integration-tests/utilities/elementInteractions';
import { MatchLabels } from '@console/internal/module/k8s';

export class NodeSelectorDialog {
  private extractID(id: string) {
    return id.split('-')[1];
  }

  /**
   * Adds new row if needed.
   * Returns string with index of next empty row.
   */
  async addRow(): Promise<string> {
    if ((await view.emptyKeyInputs.count()) === 0) {
      await click(view.addLabelBtn);
    }
    return this.extractID(await view.emptyKeyInputs.first().getAttribute('id'));
  }

  async addLabel(key: string, value: string) {
    const id = await this.addRow();
    await fillInput(view.labelKeyInputByID(id), key);
    await fillInput(view.labelValueInputByID(id), value);
  }

  async addLabels(labels: MatchLabels) {
    for (const [key, value] of Object.entries(labels)) {
      await this.addLabel(key, value);
    }
  }

  async deleteLabel(key: string) {
    const id = this.extractID(await view.keyInputByKey(key).getAttribute('id'));
    await click(view.deleteBtnByID(id));
  }
}
