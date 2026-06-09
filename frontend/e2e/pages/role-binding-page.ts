import BasePage from './base-page';

export class RoleBindingPage extends BasePage {
  private readonly nameInput = this.page.getByTestId('role-binding-name');
  private readonly namespaceDropdown = this.page.getByTestId('namespace-dropdown');
  private readonly roleDropdown = this.page.getByTestId('role-dropdown');
  private readonly subjectNameInput = this.page.getByTestId('subject-name');
  private readonly saveChangesButton = this.page.getByTestId('save-changes');

  async fillName(name: string): Promise<void> {
    await this.nameInput.fill(name);
  }

  private async fillSearchInput(text: string): Promise<void> {
    const input = this.page.getByTestId('console-select-search-input').locator('input');
    await input.fill(text);
  }

  async selectNamespace(namespace: string): Promise<void> {
    await this.robustClick(this.namespaceDropdown);
    await this.fillSearchInput(namespace);
    const menuList = this.page.getByTestId('console-select-menu-list');
    await this.robustClick(menuList.getByText(namespace, { exact: true }).first());
  }

  async selectRole(role: string): Promise<void> {
    await this.robustClick(this.roleDropdown);
    await this.fillSearchInput(role);
    const menuList = this.page.getByTestId('console-select-menu-list');
    await this.robustClick(menuList.getByText(role, { exact: true }).first());
  }

  async fillSubjectName(subject: string): Promise<void> {
    await this.subjectNameInput.fill(subject);
  }

  async selectClusterRoleBinding(): Promise<void> {
    const radio = this.page.getByTestId(
      'Cluster-wide role binding (ClusterRoleBinding)-radio-input',
    );
    await this.robustClick(radio);
  }

  async save(): Promise<void> {
    await this.robustClick(this.saveChangesButton);
    await this.page
      .getByTestId('loading-indicator')
      .waitFor({ state: 'detached', timeout: 5_000 })
      .catch(() => {});
  }
}
