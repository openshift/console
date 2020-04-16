import { browser } from 'protractor';
import { appHost, testName } from '@console/internal-integration-tests/protractor.conf';
import { clickHorizontalTab } from '@console/internal-integration-tests/views/horizontal-nav.view';
import { isLoaded, resourceTitle } from '@console/internal-integration-tests/views/crud.view';
import { activeTab } from '../../views/detailView.view';
import * as VmsListView from '../../views/vms.list.view';
import { TAB } from '../utils/consts';
import { getResourceObject } from '../utils/utils';

export class DetailView {
  readonly name: string;

  readonly namespace: string;

  readonly kind: string;

  constructor(instance) {
    this.name = instance.name;
    this.namespace = instance.namespace;
    this.kind = instance.kind;
  }

  getResource() {
    return getResourceObject(this.name, this.namespace, this.kind);
  }

  static async getResourceTitle() {
    return resourceTitle.getText();
  }

  async navigateToTab(tabName: string) {
    if (!(await resourceTitle.isPresent()) || (await resourceTitle.getText()) !== this.name) {
      await browser.get(`${appHost}/k8s/ns/${this.namespace}/${this.kind}/${this.name}`);
      await isLoaded();
    }
    if ((await activeTab.getText()) !== tabName) {
      await clickHorizontalTab(tabName);
      await isLoaded();
    }
  }

  // Similar to navigateToTab(TABS.OVERVIEW) but passes through resource list page
  async navigateToDetail() {
    await this.navigateToListView();
    await VmsListView.vmListByName(this.name).click();
    await isLoaded();
    await clickHorizontalTab(TAB.Details);
    await isLoaded();
  }

  async navigateToDashboard() {
    await this.navigateToListView();
    await VmsListView.vmListByName(this.name).click();
    await isLoaded();
    await clickHorizontalTab(TAB.Overview);
    await isLoaded();
  }

  async navigateToConsoles() {
    await this.navigateToListView();
    await VmsListView.vmListByName(this.name).click();
    await isLoaded();
    await clickHorizontalTab(TAB.Consoles);
    await isLoaded();
  }

  async navigateToListView() {
    const vmsListUrl = (namespace) =>
      `${appHost}/k8s/${namespace === 'all-namespaces' ? '' : 'ns/'}${namespace}/${this.kind}`;
    const currentUrl = await browser.getCurrentUrl();
    if (![vmsListUrl(testName), vmsListUrl('all-namespaces')].includes(currentUrl)) {
      await browser.get(vmsListUrl(this.namespace));
      await isLoaded();
    }
  }

  asResource() {
    return {
      kind: this.kind,
      metadata: {
        namespace: this.namespace,
        name: this.name,
      },
    };
  }
}
