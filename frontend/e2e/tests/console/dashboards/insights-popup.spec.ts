import { test, expect } from '../../../fixtures';
import { ClusterDashboardPage } from '../../../pages/cluster-dashboard-page';

test.describe('Insights Popup on Cluster Dashboard', { tag: ['@admin'] }, () => {
  let dashboard: ClusterDashboardPage;

  test.beforeEach(async ({ page }) => {
    dashboard = new ClusterDashboardPage(page);
    await dashboard.navigateToDashboard();
    await dashboard.waitForStatusCardLoaded();
  });

  test('displays the Insights health item in the status card', async () => {
    await expect(dashboard.getInsightsHealthItem()).toBeVisible();
    await expect(dashboard.getInsightsButton()).toBeVisible();
  });

  test('opens the Insights popup when clicking the health item', async () => {
    await dashboard.openInsightsPopup();

    await expect(dashboard.getPopover()).toBeVisible();
    await expect(dashboard.getPopover()).toContainText('Red Hat Lightspeed Advisor status');
  });

  test('shows last refresh timestamp in the popup', async () => {
    await dashboard.openInsightsPopup();

    await expect(dashboard.getPopover().getByText('Last refresh')).toBeVisible();
  });

  test('shows the advisor description text', async () => {
    await dashboard.openInsightsPopup();

    await expect(
      dashboard
        .getPopover()
        .getByText('Red Hat Lightspeed Advisor identifies and prioritizes'),
    ).toBeVisible();
  });

  test('renders severity links pointing to the correct Red Hat Insights advisor URL', async () => {
    await dashboard.openInsightsPopup();

    const advisorLinks = dashboard
      .getPopover()
      .locator('a[href*="console.redhat.com/openshift/insights/advisor"]');
    await expect(advisorLinks.first()).toBeVisible();
    await expect(advisorLinks.first()).toHaveAttribute('target', '_blank');
  });

  test('severity links include total_risk query parameter', async () => {
    await dashboard.openInsightsPopup();

    const riskLinks = dashboard.getPopover().locator('a[href*="total_risk="]');
    const count = await riskLinks.count();
    expect(count).toBeGreaterThan(0);
    for (let i = 0; i < count; i++) {
      const href = await riskLinks.nth(i).getAttribute('href');
      const totalRisk = new URL(href, 'https://placeholder').searchParams.get('total_risk');
      expect(['1', '2', '3', '4']).toContain(totalRisk);
    }
  });

  test('shows advisor recommendations link', async () => {
    await dashboard.openInsightsPopup();

    const popover = dashboard.getPopover();
    const advisorLink = popover.getByText(/View (all recommendations|more) in Red Hat Lightspeed Advisor/);
    await expect(advisorLink).toBeVisible();
  });
});
