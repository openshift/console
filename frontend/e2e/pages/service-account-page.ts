import { expect, type Locator } from '@playwright/test';

import BasePage from './base-page';

export class ServiceAccountPage extends BasePage {
  private readonly actionsMenuButton: Locator = this.page.getByTestId('actions-menu-button');
  private readonly impersonateAction: Locator = this.page.getByRole('menuitem', {
    name: /Impersonate service account/,
  });
  private readonly downloadKubeconfigAction: Locator = this.page.getByRole('menuitem', {
    name: 'Download kubeconfig',
  });

  async navigateToDetails(namespace: string, name: string): Promise<void> {
    await this.goTo(`/k8s/ns/${namespace}/~v1~ServiceAccount/${name}`);
    await this.waitForDetailsReady(name);
  }

  // Waits for the URL to stop changing before reading history state. Console
  // can redirect to a "last visited resource" fallback some time after a
  // page otherwise looks settled (e.g. after impersonating a user with
  // almost no cluster access); proceeding earlier races that redirect, which
  // then fires later and silently steals focus away from wherever the test
  // has since navigated.
  async waitForNavigationToSettle(): Promise<void> {
    await this.waitForUrlStable();
  }

  // Returns the browser's current history length. Compare two readings taken
  // before and after an intervening action (e.g. impersonating) to compute
  // exactly how many entries that action pushed, so goBackSteps() can step
  // back the right number of times regardless of how many entries any retry
  // logic along the way happened to add.
  async historyLength(): Promise<number> {
    return this.page.evaluate(() => window.history.length);
  }

  // Returns to a previously visited details page via browser history instead
  // of a fresh navigation. Unlike page.goto(), history navigation is handled
  // client-side by the SPA's router, so in-memory app state (e.g. an active
  // impersonation session, which lives only in Redux) survives the trip.
  async goBackSteps(steps: number, name: string): Promise<void> {
    for (let i = 0; i < steps; i++) {
      await this.page.goBack();
    }
    await this.waitForDetailsReady(name);
  }

  // Waits for the details page to be ready without triggering a navigation.
  // Use this after a client-side transition (e.g. goBackToDetails()) where a
  // fresh navigateToDetails() call would cause a full page reload.
  async waitForDetailsReady(name: string): Promise<void> {
    await expect(
      this.page.getByRole('heading', { level: 1 }).filter({ hasText: name }),
    ).toBeVisible({
      timeout: 60_000,
    });
    await this.waitForDetailsActions(this.actionsMenuButton);
  }

  async impersonateFromDetails(): Promise<void> {
    await this.robustClick(this.actionsMenuButton);
    await this.robustClick(this.impersonateAction);
  }

  async openActionsMenu(): Promise<void> {
    await this.robustClick(this.actionsMenuButton);
  }

  async downloadKubeconfigFromDetails(): Promise<void> {
    await this.robustClick(this.actionsMenuButton);
    await this.robustClick(this.downloadKubeconfigAction);
  }

  getDownloadKubeconfigAction(): Locator {
    return this.downloadKubeconfigAction;
  }
}
