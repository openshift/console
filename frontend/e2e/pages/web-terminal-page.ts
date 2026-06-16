import type { Locator } from '@playwright/test';

import BasePage from './base-page';

export class WebTerminalPage extends BasePage {
  private readonly terminalIcon = this.page.locator(
    'button[data-tour-id="tour-cloud-shell-button"]',
  );
  private readonly terminalContainer = this.page.locator('.co-cloudshell-terminal__container');
  private readonly terminalWindow = this.page.locator('div.xterm-screen>div.xterm-rows');
  private readonly addTabButton = this.page
    .getByTestId('multi-tab-terminal')
    .getByLabel('Add new tab');
  private readonly closeTabButtons = this.page.getByLabel('Close terminal tab');
  private readonly tabsList = this.page.getByTestId('multi-tab-terminal').locator('ul');
  private readonly drawerCloseButton = this.page.getByTestId('cloudshell-drawer-close-button');
  private readonly loadingBox = this.page.getByTestId('loading-box');
  private readonly timeoutLink = this.page.getByText('Timeout', { exact: true });
  private readonly incrementButton = this.page.getByTestId('Increment');
  private readonly timeoutInput = this.page.getByLabel('Input');
  private readonly startButton = this.page.getByTestId('save-changes');
  private readonly resourceTitle = this.page.getByTestId('resource-title');
  private readonly monacoEditor = this.page.locator('div.lines-content.monaco-editor-background');
  private readonly openInNewTabLink = this.page.locator("a[href='/terminal']");
  private readonly closeTerminalButton = this.page.getByLabel(/Close terminal/);
  private readonly inactivityMessageArea = this.page.locator('div.co-cloudshell-exec__error-msg');

  async waitForTerminalIconVisible(maxRetries = 10): Promise<void> {
    await this.goTo('/');
    try {
      await this.terminalIcon.waitFor({ state: 'visible', timeout: 30_000 });
      return;
    } catch {
      // Icon not visible on first load — retry with reloads
    }
    for (let attempt = 0; attempt < maxRetries; attempt++) {
      await this.page.reload();
      try {
        await this.terminalIcon.waitFor({ state: 'visible', timeout: 15_000 });
        return;
      } catch {
        // Retry
      }
    }
    throw new Error(`Terminal icon not visible after ${maxRetries} retries`);
  }

  async clickTerminalIcon(): Promise<void> {
    await this.robustClick(this.terminalIcon);
    await this.loadingBox.waitFor({ state: 'detached', timeout: 60_000 }).catch(() => {});
  }

  async waitForTerminalWindow(timeoutMs = 60_000): Promise<void> {
    await this.terminalContainer.waitFor({ state: 'visible', timeout: timeoutMs });
    await this.terminalWindow.waitFor({ state: 'visible', timeout: timeoutMs });
  }

  async closeTerminalDrawer(): Promise<void> {
    await this.robustClick(this.drawerCloseButton);
    await this.terminalContainer.waitFor({ state: 'hidden', timeout: 10_000 }).catch(() => {});
  }

  async closeTerminalSession(): Promise<void> {
    await this.robustClick(this.closeTerminalButton.first());
    const confirmButton = this.page.getByRole('button', { name: 'Close' });
    await this.robustClick(confirmButton);
  }

  async clickAdvancedTimeout(): Promise<void> {
    await this.timeoutLink.waitFor({ state: 'visible', timeout: 30_000 });
    await this.robustClick(this.timeoutLink);
  }

  async setTimeoutValue(value: string): Promise<void> {
    await this.incrementButton.waitFor({ state: 'visible', timeout: 10_000 });
    await this.robustClick(this.incrementButton);
    await this.timeoutInput.fill(value);
    await this.timeoutInput.press('Tab');
  }

  async clickStartButton(): Promise<void> {
    await this.robustClick(this.startButton);
    await this.waitForLoadingComplete(10_000);
  }

  async addTerminalTabs(count: number): Promise<void> {
    for (let i = 0; i < count; i++) {
      await this.robustClick(this.addTabButton);
    }
  }

  async closeTerminalTab(tabIndex: number): Promise<void> {
    await this.robustClick(this.closeTabButtons.nth(tabIndex));
  }

  async getOpenTabCount(): Promise<number> {
    const children = this.tabsList.locator('> *');
    return children.count();
  }

  async getResourceTitle(): Promise<string> {
    await this.resourceTitle.waitFor({ state: 'visible' });
    return (await this.resourceTitle.textContent()) || '';
  }

  getMonacoEditor(): Locator {
    return this.monacoEditor;
  }

  getTerminalIcon(): Locator {
    return this.terminalIcon;
  }

  getTerminalWindow(): Locator {
    return this.terminalWindow;
  }

  getOpenInNewTabLink(): Locator {
    return this.openInNewTabLink;
  }

  getInactivityMessageArea(): Locator {
    return this.inactivityMessageArea;
  }

  async clickProjectDropdown(): Promise<void> {
    const dropdown = this.page.getByTestId('namespace-bar-dropdown').getByRole('button');
    await this.robustClick(dropdown);
  }

  async selectCreateProject(): Promise<void> {
    const createBtn = this.page.locator('[data-test-dropdown-menu="#CREATE_RESOURCE_ACTION#"]');
    await this.robustClick(createBtn);
  }

  async typeProjectName(name: string): Promise<void> {
    await this.page.getByTestId('input-name').fill(name);
  }

  async confirmProjectCreation(): Promise<void> {
    await this.robustClick(this.page.getByTestId('confirm-action'));
  }

  async selectProjectFromDropdown(name: string): Promise<void> {
    const filterInput = this.page.getByTestId('dropdown-text-filter');
    await filterInput.fill(name);
    const item = this.page.getByTestId('console-select-item').filter({ hasText: name });
    await this.robustClick(item);
  }

  async navigateToDevWorkspaceSearch(namespace: string): Promise<void> {
    await this.goTo(`/search/ns/${namespace}?kind=workspace.devfile.io~v1alpha2~DevWorkspace`);
    await this.waitForLoadingComplete(30_000);
  }

  async navigateToDevWorkspaceYaml(namespace: string, name: string): Promise<void> {
    await this.goTo(`/k8s/ns/${namespace}/workspace.devfile.io~v1alpha2~DevWorkspace/${name}/yaml`);
    await this.waitForLoadingComplete(30_000);
  }

}
