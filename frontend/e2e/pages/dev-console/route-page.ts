import type { Locator } from '@playwright/test';

import BasePage from '../base-page';

export class RoutePage extends BasePage {
  private readonly name = this.page.getByRole('textbox', { name: 'Name' });
  private readonly service = this.page.getByRole('combobox', { name: /Service/i });
  private readonly targetPort = this.page.getByRole('combobox', { name: /Target Port/i });
  private readonly hostname = this.page.getByRole('textbox', { name: 'Hostname' });
  private readonly createButton = this.page.getByRole('button', { name: 'Create', exact: true });

  async navigateToCreate(namespace: string): Promise<void> {
    await this.goTo(`/k8s/ns/${namespace}/routes/~new/form`);
  }

  async navigateToEdit(namespace: string, name: string): Promise<void> {
    await this.goTo(`/k8s/ns/${namespace}/routes/${name}/form`);
  }

  async fill(name: string, service: string, port: string, host?: string): Promise<void> {
    await this.name.fill(name);
    await this.robustClick(this.service);
    await this.robustClick(this.page.getByRole('option', { name: service, exact: true }));
    await this.robustClick(this.targetPort);
    await this.robustClick(this.page.getByRole('option', { name: port, exact: true }));
    if (host) await this.hostname.fill(host);
  }

  async create(): Promise<void> {
    await this.robustClick(this.createButton);
  }

  async save(): Promise<void> {
    await this.robustClick(this.page.getByRole('button', { name: 'Save', exact: true }));
  }

  getHostname(): Locator {
    return this.hostname;
  }
}
