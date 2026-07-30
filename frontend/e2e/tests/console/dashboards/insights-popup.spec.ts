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
    const dataAvailable = await dashboard.isInsightsDataAvailable();
    test.skip(!dataAvailable, 'Insights data is not available on this cluster');

    const advisorLinks = dashboard
      .getPopover()
      .locator('a[href*="console.redhat.com/openshift/insights/advisor"]');
    await expect(advisorLinks.first()).toBeVisible({ timeout: 40_000 });
    await expect(advisorLinks.first()).toHaveAttribute('target', '_blank');
  });

  test('severity links include total_risk query parameter', async () => {
    await dashboard.openInsightsPopup();
    const dataAvailable = await dashboard.isInsightsDataAvailable();
    test.skip(!dataAvailable, 'Insights data is not available on this cluster');

    const riskLinks = dashboard.getPopover().locator('a[href*="total_risk="]');
    await expect(riskLinks.first()).toBeVisible();
    const count = await riskLinks.count();
    for (let i = 0; i < count; i++) {
      const href = await riskLinks.nth(i).getAttribute('href');
      const totalRisk = new URL(href, 'https://placeholder').searchParams.get('total_risk');
      expect(['1', '2', '3', '4']).toContain(totalRisk);
    }
  });

  test('shows advisor recommendations link', async () => {
    await dashboard.openInsightsPopup();
    const dataAvailable = await dashboard.isInsightsDataAvailable();
    test.skip(!dataAvailable, 'Insights data is not available on this cluster');

    const popover = dashboard.getPopover();
    const advisorLink = popover.getByText(/View (all recommendations|more) in Red Hat Lightspeed Advisor/);
    await expect(advisorLink).toBeVisible();
  });
});
