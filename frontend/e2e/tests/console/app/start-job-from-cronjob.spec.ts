import { test, expect } from '../../../fixtures';
import { DetailsPage } from '../../../pages/details-page';
import { ListPage } from '../../../pages/list-page';
import { YamlEditorPage } from '../../../pages/yaml-editor-page';
import { retryOnModelNotFound } from '../../../utils/retry-model-error';

const CRONJOB_NAME = 'cronjob1';

test.describe.serial('Start a Job from a CronJob', { tag: ['@admin'] }, () => {
  const testNs = `e2e-cronjob-${Date.now()}`;

  const cronJobPayload = `apiVersion: batch/v1
kind: CronJob
metadata:
  name: ${CRONJOB_NAME}
  namespace: ${testNs}
spec:
  schedule: '@daily'
  jobTemplate:
    spec:
      template:
        spec:
          containers:
            - name: hello
              image: busybox
              args:
                - /bin/sh
                - '-c'
                - date; echo Hello from the Openshift cluster
          restartPolicy: OnFailure`;

  test.beforeAll(async ({ k8sClient }) => {
    await k8sClient.createNamespace(testNs);
    await k8sClient.waitForNamespaceReady(testNs);
  });

  test.afterAll(async ({ k8sClient }) => {
    await k8sClient.deleteNamespace(testNs);
  });

  // eslint-disable-next-line playwright/expect-expect
  test('verify "Start Job" on the CronJob details page', async ({ page }) => {
    const yamlEditor = new YamlEditorPage(page);
    const detailsPage = new DetailsPage(page);

    await page.goto(`/k8s/ns/${testNs}/import`);
    await yamlEditor.waitForEditorReady();
    await yamlEditor.setEditorContent(cronJobPayload);
    await yamlEditor.clickSave();
    await expect(page.locator('[data-test-section-heading="CronJob details"]')).toBeVisible();

    await detailsPage.clickPageAction('Start Job');
    await detailsPage.waitForPageLoad();
    await retryOnModelNotFound(page);
    await expect(page.locator('[data-test-section-heading="Job details"]')).toBeVisible();
    await expect(detailsPage.getPageHeading()).toContainText(CRONJOB_NAME);
  });

  test('verify "Start Job" on the CronJob list page', async ({ page }) => {
    const listPage = new ListPage(page);
    const detailsPage = new DetailsPage(page);

    await page.goto(`/k8s/ns/${testNs}/cronjobs`);
    await listPage.waitForRows();
    await expect(listPage.cell(CRONJOB_NAME)).toBeVisible({ timeout: 60_000 });

    // LazyActionMenu loads actions lazily and WebSocket updates can re-render the
    // table (resetting menu state), so retry opening the kebab if the action disappears.
    const row = listPage.cell(CRONJOB_NAME).locator('xpath=ancestor::tr');
    const kebab = row.getByTestId('kebab-button');
    const action = page.locator('[data-test-action="Start Job"]:not([disabled])');

    const deadline = Date.now() + 30_000;
    let found = false;
    while (Date.now() < deadline) {
      await kebab.hover();
      await kebab.click();
      try {
        // eslint-disable-next-line no-restricted-syntax
        await action.waitFor({ state: 'visible', timeout: 5_000 });
        found = true;
        break;
      } catch {
        // Menu may have closed due to table re-render; retry
      }
    }
    expect(found, 'Kebab action "Start Job" was not visible after retries').toBeTruthy();
    await action.click();

    await detailsPage.waitForPageLoad();
    await retryOnModelNotFound(page);
    await expect(page.locator('[data-test-section-heading="Job details"]')).toBeVisible();
    await expect(detailsPage.getPageHeading()).toContainText(CRONJOB_NAME);
  });

  // eslint-disable-next-line playwright/expect-expect
  test('verify the number of Jobs in CronJob > Jobs tab list page', async ({ page }) => {
    const listPage = new ListPage(page);

    await page.goto(`/k8s/ns/${testNs}/cronjobs`);
    await listPage.waitForRows();
    await expect(listPage.cell(CRONJOB_NAME)).toBeVisible({ timeout: 60_000 });
    await page.goto(`/k8s/ns/${testNs}/cronjobs/${CRONJOB_NAME}/jobs`);
    await listPage.waitForRows();
    await expect(listPage.cells).toHaveCount(2);
  });

  test('verify the number of events in CronJob > Events tab list page', async ({ page }) => {
    const detailsPage = new DetailsPage(page);

    await page.goto(`/k8s/ns/${testNs}/cronjobs/${CRONJOB_NAME}/events`);
    await detailsPage.waitForPageLoad();
    await retryOnModelNotFound(page);
    await expect(page.getByTestId('event-totals')).toHaveText('Showing 2 events', {
      timeout: 10_000,
    });
  });
});
