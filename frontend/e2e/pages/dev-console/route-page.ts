import { expect } from '../../fixtures';
import BasePage from '../base-page';

export class RoutePage extends BasePage {
  private readonly name = this.page.getByRole('textbox', { name: 'Name', exact: true });
  private readonly service = this.page.getByRole('combobox', { name: /Service/i });
  private readonly targetPort = this.page.getByRole('combobox', { name: /Target Port/i });
  private readonly hostname = this.page.getByRole('textbox', { name: 'Hostname' });
  private readonly createButton = this.page.getByRole('button', { name: 'Create', exact: true });

  async navigateToCreate(namespace: string): Promise<void> {
    await this.goTo(`/k8s/ns/${namespace}/routes/~new/form`);
  }

  async navigateToEdit(namespace: string, name: string): Promise<void> {
    await this.goTo(`/k8s/ns/${namespace}/routes/${name}`);
    await this.waitForDetailsHeading(name);
    await this.robustClick(this.page.getByRole('button', { name: 'Actions' }));
    await this.robustClick(this.page.getByRole('menuitem', { name: 'Edit Route' }));
  }

  // The details page can stay on its loading spinner forever when the resource
  // watch never settles; reloading once re-registers the watch and recovers.
  async waitForDetailsHeading(name: string): Promise<void> {
    const heading = this.page.getByRole('heading', { name, level: 1 });
    // eslint-disable-next-line eslint-js/no-restricted-syntax -- waits for state only; the heading is never acted on
    const loaded = await heading.waitFor({ state: 'visible', timeout: 30_000 }).then(
      () => true,
      () => false,
    );
    if (!loaded) {
      await this.page.reload();
      // eslint-disable-next-line eslint-js/no-restricted-syntax -- waits for state only; the heading is never acted on
      await heading.waitFor({ state: 'visible', timeout: 30_000 });
    }
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
    if (!/^spec:\n/m.test(content)) {
      throw new Error('Route YAML does not contain a top-level spec field');
    }
    // The cluster assigns spec.host automatically when unset; replace an
    // existing host instead of inserting a duplicate key.
    const updated = /^ {2}host: .+$/m.test(content)
      ? content.replace(/^ {2}host: .+$/m, `  host: ${host}`)
      : content.replace(/^(spec:\n)/m, `$1  host: ${host}\n`);
    await this.setEditorContent(updated);
  }
}
