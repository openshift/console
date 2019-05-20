/* eslint-disable no-unused-vars, no-undef */
import { browser } from 'protractor';

import { appHost, testName } from '../../../protractor.conf';
import { clickHorizontalTab } from '../../../views/horizontal-nav.view';
import { isLoaded, resourceTitle } from '../../../views/crud.view';

export class DetailView {
  readonly name: string;
  readonly namespace: string;
  readonly kind: string;

  constructor(name: string, namespace: string, kind: string) {
    this.name = name;
    this.namespace = namespace;
    this.kind = kind;
  }

  static async getResourceTitle() {
    return resourceTitle.getText();
  }

  async navigateToTab(tabName: string) {
    if (!await resourceTitle.isPresent() || await resourceTitle.getText() !== this.name) {
      await browser.get(`${appHost}/k8s/ns/${this.namespace}/${this.kind}/${this.name}`);
      await isLoaded();
    }
    await clickHorizontalTab(tabName);
    await isLoaded();
  }

  async navigateToListView() {
    const vmsListUrl = (namespace) => `${appHost}/k8s/ns/${namespace}/${this.kind}`;
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
