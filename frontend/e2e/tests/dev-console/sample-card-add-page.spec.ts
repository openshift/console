import { test, expect } from '../../fixtures';
import KubernetesClient from '../../clients/kubernetes-client';
import { PerspectivePage } from '../../pages/dev-console/perspective-page';
import { SamplesPage } from '../../pages/dev-console/samples-page';

test.describe('Create Sample Application', { tag: ['@regression', '@dev-console'] }, () => {
  const namespace = `aut-addflow-catalog-${Date.now()}`;
  let k8s: KubernetesClient;

  test.beforeAll(async () => {
    k8s = new KubernetesClient({
      clusterUrl: process.env.CLUSTER_URL || '',
      username: process.env.OPENSHIFT_USERNAME || 'kubeadmin',
      password: process.env.BRIDGE_KUBEADMIN_PASSWORD || '',
    });
    await k8s.createNamespace(namespace);
  });

  test.afterAll(async () => {
    await k8s.deleteNamespace(namespace);
  });

  test('sample card in add flow', async ({ page }) => {
    const perspectivePage = new PerspectivePage(page);
    const samplesPage = new SamplesPage(page);

    await test.step('Navigate to Add page', async () => {
      await page.goto('/');
      await perspectivePage.switchToDeveloper();
      await perspectivePage.selectOrCreateProject(namespace);
      await perspectivePage.navigateToAdd();
    });

    await test.step('Click View all samples link', async () => {
      await samplesPage.clickViewAllSamples();
    });

    await test.step('Verify samples page content', async () => {
      await samplesPage.expectSamplesPageHeading();
      await samplesPage.expectSampleApplicationsVisible();
      await samplesPage.expectBuilderImageBasedSamples();
    });
  });

  for (const { cardName, formHeader, workloadName } of [
    { cardName: 'Httpd', formHeader: 'Create Sample application', workloadName: 'httpd-sample' },
    { cardName: 'Basic Go', formHeader: 'Import from Git', workloadName: 'go-basic' },
  ]) {
    test(`create sample application: ${cardName}`, async ({ page }) => {
      const perspectivePage = new PerspectivePage(page);
      const samplesPage = new SamplesPage(page);

      await test.step('Navigate to Add page', async () => {
        await page.goto('/');
        await perspectivePage.switchToDeveloper();
        await perspectivePage.selectOrCreateProject(namespace);
        await perspectivePage.navigateToAdd();
      });

      await test.step('Select sample and create', async () => {
        await samplesPage.clickSamplesCard();
        await samplesPage.searchAndSelectSample(cardName);
        await samplesPage.expectFormHeader(formHeader);
        await samplesPage.clickCreate();
      });

      await test.step('Verify workload in topology', async () => {
        await page.waitForURL(/\/topology\//);
        await expect(page.locator(`[data-test-id="${workloadName}"]`).first()).toBeVisible({
          timeout: 60_000,
        });
      });
    });
  }

  test('review sample application form', async ({ page }) => {
    const perspectivePage = new PerspectivePage(page);
    const samplesPage = new SamplesPage(page);

    await test.step('Navigate to samples page', async () => {
      await page.goto('/');
      await perspectivePage.switchToDeveloper();
      await perspectivePage.selectOrCreateProject(namespace);
      await perspectivePage.navigateToAdd();
      await samplesPage.clickViewAllSamples();
      await samplesPage.expectSamplesPageHeading();
    });

    await test.step('Select Go sample', async () => {
      await samplesPage.searchAndSelectSample('Go');
      await samplesPage.expectFormHeader('Create Sample application');
    });

    await test.step('Verify form elements', async () => {
      await samplesPage.expectNameSectionVisible();
      await samplesPage.expectBuilderImageVersionDropdownVisible();
      await samplesPage.expectBuilderImageVisible();
      await samplesPage.expectGitUrlReadonly();
      await samplesPage.expectCreateAndCancelButtons();
    });
  });

  test('edit sample application form', async ({ page }) => {
    const perspectivePage = new PerspectivePage(page);
    const samplesPage = new SamplesPage(page);

    await test.step('Navigate to samples page', async () => {
      await page.goto('/');
      await perspectivePage.switchToDeveloper();
      await perspectivePage.selectOrCreateProject(namespace);
      await perspectivePage.navigateToAdd();
      await samplesPage.clickViewAllSamples();
      await samplesPage.expectSamplesPageHeading();
    });

    await test.step('Select Go sample and edit', async () => {
      await samplesPage.searchAndSelectSample('Go');
      await samplesPage.expectFormHeader('Create Sample application');
      await samplesPage.fillName('golang-sample-app1');
      await samplesPage.changeBuilderImageVersion('latest');
      await samplesPage.clickCreate();
    });

    await test.step('Verify workload in topology', async () => {
      await page.waitForURL(/\/topology\//);
      await expect(page.locator('[data-test-id="golang-sample-app1"]').first()).toBeVisible({
        timeout: 60_000,
      });
    });
  });

  test('create basic nodejs devfile sample application', async ({ page }) => {
    const perspectivePage = new PerspectivePage(page);
    const samplesPage = new SamplesPage(page);

    await test.step('Navigate to samples page', async () => {
      await page.goto('/');
      await perspectivePage.switchToDeveloper();
      await perspectivePage.selectOrCreateProject(namespace);
      await perspectivePage.navigateToAdd();
      await samplesPage.clickViewAllSamples();
      await samplesPage.expectSamplesPageHeading();
    });

    await test.step('Select Basic Node.js and create', async () => {
      await samplesPage.searchAndSelectSample('Basic Node.js');
      await samplesPage.fillDevfileName('node-js-basic-sample1');
      await samplesPage.clickCreate();
    });

    await test.step('Verify workload in topology', async () => {
      await page.waitForURL(/\/topology\//);
      await expect(page.locator('[data-test-id="node-js-basic-sample1"]').first()).toBeVisible({
        timeout: 60_000,
      });
    });
  });
});
