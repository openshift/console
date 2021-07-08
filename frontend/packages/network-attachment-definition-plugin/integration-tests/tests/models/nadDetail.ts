import { createYAMLLink, isLoaded } from '@console/internal-integration-tests/views/crud.view';
import { clickHorizontalTab } from '@console/internal-integration-tests/views/horizontal-nav.view';
import { clickNavLink } from '@console/internal-integration-tests/views/sidenav.view';
import { isLoaded as yamlPageIsLoaded } from '@console/internal-integration-tests/views/yaml.view';
import { listViewAction, detailViewAction } from '@console/shared/src/test-utils/actions.view';
import { click } from '@console/shared/src/test-utils/utils';
import * as NADListView from '../../views/nad.list.view';
import { NAD_ACTION } from '../utils/constants';
import { NADForm } from './nadForm';

const noConfirmDialogActions: NAD_ACTION[] = [
  NAD_ACTION.Edit,
  NAD_ACTION.EditAnnotations,
  NAD_ACTION.EditLabels,
];

export class NADDetail {
  readonly name: string;

  readonly namespace: string;

  constructor(instance) {
    this.name = instance.name;
    this.namespace = instance.namespace || 'all-namespaces';
  }

  async navigateToListView() {
    await clickNavLink(['Networking', 'Network Attachment Definitions']);
    await isLoaded();
  }

  async navigateToDetail() {
    await this.navigateToListView();
    await NADListView.nadListByName(this.name).click();
    await isLoaded();
    await clickHorizontalTab('Details');
    await isLoaded();
  }

  async navigateToForm() {
    await this.navigateToListView();
    const form = new NADForm();
    await form.openNADForm();
  }

  async navigateToYAMLEditor() {
    await this.navigateToForm();
    await click(createYAMLLink);
    await yamlPageIsLoaded();
  }

  async detailViewAction(action: NAD_ACTION) {
    await this.navigateToDetail();
    await detailViewAction(action, !noConfirmDialogActions.includes(action));
  }

  async listViewAction(action: NAD_ACTION) {
    await this.navigateToListView();
    await listViewAction(this.name)(action, !noConfirmDialogActions.includes(action));
  }
}
