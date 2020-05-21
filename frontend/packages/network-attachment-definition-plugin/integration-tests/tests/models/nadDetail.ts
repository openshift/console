import { browser } from 'protractor';
import { appHost, testName } from '@console/internal-integration-tests/protractor.conf';
import { clickHorizontalTab } from '@console/internal-integration-tests/views/horizontal-nav.view';
import { createYAMLLink, isLoaded } from '@console/internal-integration-tests/views/crud.view';
import { isLoaded as yamlPageIsLoaded } from '@console/internal-integration-tests/views/yaml.view';
import { click } from '@console/shared/src/test-utils/utils';
import { listViewAction, detailViewAction } from '@console/shared/src/test-utils/actions.view';
import * as NADListView from '../../views/nad.list.view';
import { NADForm } from './nadForm';
import { NAD_ACTION } from '../utils/constants';

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
    const nadsListURL = (namespace) =>
      `${appHost}/k8s/${
        namespace === 'all-namespaces' ? '' : 'ns/'
      }${namespace}/k8s.cni.cncf.io~v1~NetworkAttachmentDefinition/`;
    const currentURL = await browser.getCurrentUrl();
    if (![nadsListURL(testName), nadsListURL('all-namespaces')].includes(currentURL)) {
      await browser.get(nadsListURL(this.namespace));
      await isLoaded();
    }
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
