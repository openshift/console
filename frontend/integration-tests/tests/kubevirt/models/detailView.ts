/* eslint-disable no-unused-vars, no-undef */
import { browser } from 'protractor';

import { appHost } from '../../../protractor.conf';
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
}
