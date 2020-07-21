/* eslint-disable no-await-in-loop */
import * as view from '../../views/dialogs/editLabelView';
import { asyncForEach, click, fillInput } from '@console/shared/src/test-utils/utils';
import { MatchLabels } from '@console/internal/module/k8s';

export class AddDialog {
  private extractID(id: string) {
    return id.split('-')[1];
  }

  /**
   * Adds new row if needed.
   * Returns string with index of next empty row.
   */
  async addRow(placeholder: string): Promise<string> {
    if ((await view.emptyKeyInputs(placeholder).count()) === 0) {
      await click(view.addLabelBtn);
    }
    return this.extractID(
      await view
        .emptyKeyInputs(placeholder)
        .first()
        .getAttribute('id'),
    );
  }

  async addLabel(name: string, placeholder: string, key: string, value: string) {
    const id = await this.addRow(placeholder);
    await fillInput(view.keyInputByID(name, id), key);
    await fillInput(view.valueInputByID(name, id), value);
  }

  async addLabels(name: string, placeholder: string, labels: MatchLabels) {
    for (const [key, value] of Object.entries(labels)) {
      await this.addLabel(name, placeholder, key, value);
    }
  }

  async deleteLabel(name: string, placeholder: string, value: string) {
    const id = this.extractID(await view.keyInputByKey(placeholder, value).getAttribute('id'));
    await click(view.deleteBtnByID(name, id));
  }

  async deleteLabels(name: string, placeholder: string, labels: MatchLabels) {
    return asyncForEach(Object.keys(labels), async (key: string) => {
      await this.deleteLabel(name, placeholder, key);
    });
  }
}
