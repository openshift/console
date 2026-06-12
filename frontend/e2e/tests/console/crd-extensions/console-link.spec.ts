import { test, expect } from '../../../fixtures';
import KubernetesClient from '../../../clients/kubernetes-client';
import { createCustomResourceViaYaml, navigateToCRDInstances } from './crd-test-utils';

const crd = 'ConsoleLink';

const testObjs = [
  {
    dropdownMenuName: 'help menu',
    dropdownTestId: 'help-dropdown',
    dropdownToggleTestId: 'help-dropdown-toggle',
    menuLinkLocation: 'HelpMenu',
    menuLinkText: 'help menu link',
  },
  {
    dropdownMenuName: 'user menu',
    dropdownTestId: 'user-dropdown',
    dropdownToggleTestId: 'user-dropdown-toggle',
    menuLinkLocation: 'UserMenu',
    menuLinkText: 'user menu link',
  },
];

test.describe(`${crd} CRD`, { tag: ['@admin'] }, () => {
  let k8sClient: KubernetesClient;

  test.beforeEach(async ({ k8sClient: client }) => {
    k8sClient = client;
  });

  testObjs.forEach(
    ({
      dropdownMenuName,
      dropdownTestId,
      dropdownToggleTestId,
      menuLinkLocation,
      menuLinkText,
    }) => {
      test(`creates, displays, and deletes a new ${crd} ${dropdownMenuName} instance`, async ({
        page,
      }) => {
        // Generate unique name for each test run
        const name = `console-link-test-${Date.now()}`;
        const fullMenuLinkText = `${name} ${menuLinkText}`;

        const crdObj = {
          apiVersion: 'console.openshift.io/v1',
          kind: crd,
          metadata: {
            name,
          },
          spec: {
            location: menuLinkLocation,
            text: fullMenuLinkText,
            href: 'https://www.example.com',
          },
        };

        try {
          await test.step('Navigate to CRD instances page', async () => {
            await navigateToCRDInstances(page, crd);
          });

          await test.step('Create ConsoleLink instance via YAML editor', async () => {
            await createCustomResourceViaYaml(page, crdObj);
          });

          await test.step('Verify instance appears on details page', async () => {
            // YAML save redirects to the created resource — no goto needed
            await expect(page.getByRole('heading', { name })).toBeVisible();
          });

          await test.step(`Verify link appears in ${dropdownMenuName}`, async () => {
            // Open the dropdown menu
            await page.getByTestId(dropdownToggleTestId).click();

            // Verify the link appears in the menu
            const dropdown = page.getByTestId(dropdownTestId);
            const menuLink = dropdown
              .getByTestId('application-launcher-item')
              .getByText(fullMenuLinkText, { exact: true });
            await expect(menuLink).toBeVisible();

            // Close the dropdown by clicking the toggle again
            await page.getByTestId(dropdownToggleTestId).click();
          });

          await test.step('Delete the ConsoleLink instance', async () => {
            await page.goto(`/k8s/cluster/console.openshift.io~v1~${crd}`);

            const instanceRow = page.getByRole('row', { name: new RegExp(name) });
            await expect(instanceRow).toBeVisible({ timeout: 10000 });

            // Watch updates re-render the list, which can close the kebab
            // menu or detach the delete item between actions. Retry the
            // entire open-and-click sequence until it succeeds.
            const deleteItem = page.getByRole('menuitem', { name: `Delete ${crd}` });
            await expect
              .poll(
                async () => {
                  try {
                    if (!(await deleteItem.isVisible().catch(() => false))) {
                      await instanceRow.getByTestId('kebab-button').click();
                    }
                    if (!(await deleteItem.isEnabled().catch(() => false))) return false;
                    await deleteItem.click({ timeout: 2_000 });
                    return true;
                  } catch {
                    return false;
                  }
                },
                { timeout: 30_000 },
              )
              .toBe(true);

            await expect(page.getByRole('heading', { name: `Delete ${crd}?` })).toBeVisible();
            await page.getByTestId('confirm-action').click();

            await expect(instanceRow).not.toBeVisible({ timeout: 10000 });
          });
        } finally {
          // Clean up the ConsoleLink instance
          try {
            await k8sClient.deleteCustomResource(
              'console.openshift.io',
              'v1',
              '',
              'consolelinks',
              name,
            );
          } catch (error) {
            // Ignore if already deleted
          }
        }
      });
    },
  );
});
