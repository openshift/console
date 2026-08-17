import { test, expect } from '../../../fixtures';
import { DetailsPage } from '../../../pages/details-page';
import { ListPage } from '../../../pages/list-page';
import { YamlEditorPage } from '../../../pages/yaml-editor-page';
import { retryOnModelNotFound } from '../../../utils/retry-model-error';

const CRONJOB_NAME = 'cronjob1';

test.describe('Start a Job from a CronJob', () => {
  let ns: string;

  test.beforeAll(async ({ k8sClient }) => {
    ns = `test-cronjob-${Date.now()}`;
    await k8sClient.createNamespace(ns);
  });

  test.afterAll(async ({ k8sClient }) => {
    await k8sClient.deleteNamespace(ns);
  });

  test('start jobs from CronJob details and list pages', async ({ page }) => {
    const detailsPage = new DetailsPage(page);
    const listPage = new ListPage(page);
    const yamlEditorPage = new YamlEditorPage(page);

    const cronJobYaml = `apiVersion: batch/v1
kind: CronJob
metadata:
  name: ${CRONJOB_NAME}
  namespace: ${ns}
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

    await test.step('Create CronJob via YAML import', async () => {
      await yamlEditorPage.navigateToImportYaml(ns);
      await yamlEditorPage.waitForEditorReady();
      await yamlEditorPage.setEditorContent(cronJobYaml);
      await yamlEditorPage.clickSave();
      await expect(
        page.getByTestId('section-heading-CronJob details'),
      ).toBeVisible({ timeout: 30_000 });
    });

    await test.step('Start Job from CronJob details page', async () => {
      await detailsPage.clickActionsMenuAction('Start Job');
      await detailsPage.waitForPageLoad();
      await retryOnModelNotFound(page);
      await expect(
        page.getByTestId('section-heading-Job details'),
      ).toBeVisible({ timeout: 30_000 });
      await expect(detailsPage.title).toContainText(CRONJOB_NAME, { timeout: 30_000 });
    });

    await test.step('Start Job from CronJob list page kebab', async () => {
      await listPage.navigateToListPage(`/k8s/ns/${ns}/cronjobs`);
      await listPage.waitForRows();
      await expect(listPage.cell(CRONJOB_NAME)).toBeVisible({ timeout: 60_000 });

      // WebSocket updates can re-render the table and close the kebab menu.
      // Retry opening the kebab if the action disappears.
      const row = listPage.cell(CRONJOB_NAME).locator('xpath=ancestor::tr');
      const kebab = row.getByTestId('kebab-button');
      const action = page.getByTestId('Start Job');

      const deadline = Date.now() + 30_000;
      let found = false;
      while (Date.now() < deadline) {
        await kebab.click();
        try {
          // eslint-disable-next-line no-restricted-syntax
          await action.waitFor({ state: 'visible', timeout: 5_000 });
          found = true;
          break;
        } catch {
          // Menu closed due to table re-render; retry
        }
      }
      expect(found, 'Kebab action "Start Job" was not visible after retries').toBeTruthy();
      await action.click();

      await detailsPage.waitForPageLoad();
      await retryOnModelNotFound(page);
      await expect(
        page.getByTestId('section-heading-Job details'),
      ).toBeVisible({ timeout: 30_000 });
      await expect(detailsPage.title).toContainText(CRONJOB_NAME, { timeout: 30_000 });
    });

    await test.step('Verify number of Jobs in CronJob Jobs tab', async () => {
      await page.goto(`/k8s/ns/${ns}/cronjobs/${CRONJOB_NAME}/jobs`);
      await listPage.waitForRows();
      await expect(listPage.cells).toHaveCount(2, { timeout: 30_000 });
    });

    await test.step('Verify number of events in CronJob Events tab', async () => {
      await page.goto(`/k8s/ns/${ns}/cronjobs/${CRONJOB_NAME}/events`);
      await retryOnModelNotFound(page);
      await expect(page.getByTestId('event-totals')).toHaveText('Showing 2 events', {
        timeout: 30_000,
      });
    });
  });
});
