import BasePage from './base-page';

export class NavPage extends BasePage {
  private readonly sidebar = this.page.locator('#page-sidebar');

  async clickNavLink(path: string[]): Promise<void> {
    const [section, ...rest] = path;
    const sectionEl = this.sidebar.locator('.pf-v6-c-nav__link', {
      hasText: new RegExp(`^${section}$`),
    });
    await sectionEl.first().waitFor({ state: 'visible', timeout: 10_000 });

    const expanded = await sectionEl.first().getAttribute('aria-expanded');
    if (expanded !== 'true') {
      await this.robustClick(sectionEl.first());
    }

    for (const item of rest) {
      const link = this.sidebar.getByRole('link', { name: item, exact: true });
      await link.first().waitFor({ state: 'visible', timeout: 10_000 });
      await this.robustClick(link.first());
    }

    await this.waitForLoadingComplete();
  }
}
