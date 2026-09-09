import { expect } from '../../fixtures';
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
    await this.goTo(`/k8s/ns/${namespace}/routes/${name}`);
    await this.robustClick(this.page.getByRole('button', { name: 'Actions' }));
    await this.robustClick(this.page.getByRole('menuitem', { name: 'Edit Route' }));
  }

  isFormView(): Promise<boolean> {
    const yamlEditor = this.page.getByRole('textbox', { name: /Editor content/ });
    return expect(this.name.or(yamlEditor).first())
      .toBeVisible({ timeout: 30_000 })
      .then(async () => this.name.isVisible());
  }

  async fillForm(name: string, service: string, port: string, host?: string): Promise<void> {
    await this.name.fill(name);
    await this.robustClick(this.service);
    await this.robustClick(this.page.getByRole('option', { name: service, exact: true }));
    await this.robustClick(this.targetPort);
    await this.robustClick(this.page.getByRole('option', { name: port, exact: true }));
    if (host) await this.hostname.fill(host);
  }

  async fillYaml(name: string, service: string, port: string, host?: string): Promise<void> {
    await this.setEditorContent(
      [
        'apiVersion: route.openshift.io/v1',
        'kind: Route',
        'metadata:',
        `  name: ${name}`,
        'spec:',
        `  ${host ? `host: ${host}\n  ` : ''}to:`,
        '    kind: Service',
        `    name: ${service}`,
        '  port:',
        `    targetPort: ${port}`,
      ].join('\n'),
    );
  }

  async create(): Promise<void> {
    await this.robustClick(this.createButton);
  }

  async save(): Promise<void> {
    await this.robustClick(this.page.getByRole('button', { name: 'Save', exact: true }));
  }

  async setFormHostname(host: string): Promise<void> {
    await expect(this.hostname).toBeVisible({ timeout: 30_000 });
    await this.hostname.fill(host);
  }

  async setYamlHostname(host: string): Promise<void> {
    await expect(this.page.getByRole('textbox', { name: /Editor content/ })).toBeVisible({
      timeout: 30_000,
    });
    const content = await this.getEditorContent();
    const updated = /^spec:\n/m.test(content)
      ? content.replace(/^(spec:\n)/m, `$1  host: ${host}\n`)
      : content;
    await this.setEditorContent(updated);
  }
}
