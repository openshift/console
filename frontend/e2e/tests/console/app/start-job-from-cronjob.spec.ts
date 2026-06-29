import { test, expect } from '../../../fixtures';
import { DetailsPage } from '../../../pages/details-page';
import { ListPage } from '../../../pages/list-page';
import { YamlEditorPage } from '../../../pages/yaml-editor-page';

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
    await yamlEditor.isImportLoaded();
    await yamlEditor.setEditorContent(cronJobPayload);
    await yamlEditor.clickSaveCreateButton();
    await detailsPage.sectionHeaderShouldExist('CronJob details');

    await detailsPage.clickPageActionFromDropdown('Start Job');
    await detailsPage.isLoaded();
    await detailsPage.sectionHeaderShouldExist('Job details');
    await detailsPage.titleShouldContain(CRONJOB_NAME);
  });

  test('verify "Start Job" on the CronJob list page', async ({ page }) => {
    const listPage = new ListPage(page);
    const detailsPage = new DetailsPage(page);

    await page.goto(`/k8s/ns/${testNs}/cronjobs`);
    await listPage.dvRowsShouldExist(CRONJOB_NAME);

    // LazyActionMenu loads actions lazily and WebSocket updates can re-render the
    // table (resetting menu state), so retry opening the kebab if the action disappears.
    const row = page.locator('table tbody tr').filter({
      has: page.getByRole('link', { name: CRONJOB_NAME, exact: true }),
    });
    const kebab = row.locator('[data-test-id="kebab-button"]');
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

    await detailsPage.isLoaded();
    await detailsPage.sectionHeaderShouldExist('Job details');
    await detailsPage.titleShouldContain(CRONJOB_NAME);
  });

  // eslint-disable-next-line playwright/expect-expect
  test('verify the number of Jobs in CronJob > Jobs tab list page', async ({ page }) => {
    const listPage = new ListPage(page);

    await page.goto(`/k8s/ns/${testNs}/cronjobs`);
    await listPage.dvRowsShouldExist(CRONJOB_NAME);
    await page.goto(`/k8s/ns/${testNs}/cronjobs/${CRONJOB_NAME}/jobs`);
    await listPage.dvRowsShouldBeLoaded();
    await listPage.dvRowsCountShouldBe(2);
  });

  test('verify the number of events in CronJob > Events tab list page', async ({ page }) => {
    const detailsPage = new DetailsPage(page);

    await page.goto(`/k8s/ns/${testNs}/cronjobs/${CRONJOB_NAME}/events`);
    await detailsPage.isLoaded();
    await expect(detailsPage.eventTotals).toHaveText('Showing 2 events', { timeout: 10_000 });
  });
});
