import { test, expect } from '../../fixtures';
import { createTestCR, createTestCRD, createTestCSV } from './mocks';

test.describe('OLM descriptor components', { tag: ['@admin'] }, () => {
  const testNs = `olm-desc-${Date.now()}`;
  const crd = createTestCRD(testNs);
  const csv = createTestCSV(testNs);
  const cr = createTestCR(testNs);
  const { group } = crd.spec;
  const version = crd.spec.versions[0].name;
  const kind = crd.spec.names.kind;
  const baseUrl = `/k8s/ns/${testNs}/operators.coreos.com~v1alpha1~ClusterServiceVersion/${csv.metadata.name}/${group}~${version}~${kind}`;

  test.beforeAll(async ({ k8sClient }) => {
    await k8sClient.createNamespace(testNs);
    await k8sClient.createClusterCustomResource(
      'apiextensions.k8s.io',
      'v1',
      'customresourcedefinitions',
      crd,
    );
    await k8sClient.createCustomResource(
      'operators.coreos.com',
      'v1alpha1',
      testNs,
      'clusterserviceversions',
      csv,
    );
  });

  test.afterAll(async ({ k8sClient }) => {
    await k8sClient
      .deleteCustomResource(
        crd.spec.group,
        version,
        testNs,
        crd.spec.names.plural,
        cr.metadata.name,
      )
      .catch(() => {});
    await k8sClient.deleteClusterCustomResource(
      'apiextensions.k8s.io',
      'v1',
      'customresourcedefinitions',
      crd.metadata.name,
    );
    await k8sClient.deleteCustomResource(
      'operators.coreos.com',
      'v1alpha1',
      testNs,
      'clusterserviceversions',
      csv.metadata.name,
    );
    await k8sClient.deleteNamespace(testNs);
  });

  test('displays list and detail views of an operand', async ({ page, k8sClient }) => {
    await test.step('Create test CR via API', async () => {
      await k8sClient.createCustomResource(
        crd.spec.group,
        version,
        testNs,
        crd.spec.names.plural,
        cr,
      );
    });

    await test.step('Verify operand appears in list view', async () => {
      await page.goto(baseUrl);
      await expect(page.locator(`[data-test-operand-link="${cr.metadata.name}"]`)).toBeAttached();
    });

    await test.step('Verify operand details page', async () => {
      await page.goto(`${baseUrl}/${cr.metadata.name}`);
      await expect(page.locator('[data-test-id="resource-title"]')).toHaveText(cr.metadata.name);
    });

    await test.step('Verify spec descriptors are displayed', async () => {
      const specDescriptors = csv.spec.customresourcedefinitions.owned[0].specDescriptors;
      for (const descriptor of specDescriptors) {
        const label = page
          .locator(`[data-test-selector="details-item-label__${descriptor.displayName}"]`)
          .first();
        if (descriptor.path === 'hidden') {
          await expect(label).not.toBeAttached();
        } else {
          await expect(label).toBeAttached();
        }
      }
    });

    await test.step('Verify status descriptors are displayed', async () => {
      const statusDescriptors = csv.spec.customresourcedefinitions.owned[0].statusDescriptors.filter(
        (d) => d.path !== 'conditions',
      );
      for (const descriptor of statusDescriptors) {
        const label = page
          .locator(`[data-test-selector="details-item-label__${descriptor.displayName}"]`)
          .first();
        if (descriptor.path === 'hidden') {
          await expect(label).not.toBeAttached();
        } else {
          await expect(label).toBeAttached();
        }
      }
    });

    await test.step('Clean up test CR', async () => {
      await k8sClient
        .deleteCustomResource(
          crd.spec.group,
          version,
          testNs,
          crd.spec.names.plural,
          cr.metadata.name,
        )
        .catch(() => {});
    });
  });

  test('creates an operand using the form', async ({ page }) => {
    const ARRAY_FIELD_GROUP_ID = 'root_spec_arrayFieldGroup';
    const FIELD_GROUP_ID = 'root_spec_fieldGroup';
    const LABELS_FIELD_ID = 'root_metadata_labels';
    const NAME_FIELD_ID = 'root_metadata_name';
    const NUMBER_FIELD_ID = 'root_spec_number';
    const PASSWORD_FIELD_ID = 'root_spec_password';
    const SELECT_FIELD_ID = 'root_spec_select';

    const atomicFields = [
      { label: 'Name', path: 'metadata.name', id: NAME_FIELD_ID },
      { label: 'Password', path: 'spec.password', id: PASSWORD_FIELD_ID },
      { label: 'Number', path: 'spec.number', id: NUMBER_FIELD_ID },
    ];

    function getNestedValue(obj: any, path: string): any {
      return path.split('.').reduce((acc, key) => acc?.[key], obj);
    }

    await test.step('Navigate to create operand form', async () => {
      await page.goto(baseUrl);
      await page.getByTestId('item-create').click({ force: true });
      await expect(page.locator('[data-test="page-heading"] h1')).toHaveText('Create App');
      const formRadio = page.getByRole('radio', { name: 'Form view' });
      await formRadio.waitFor();
      await formRadio.click();
    });

    await test.step('Verify atomic form fields', async () => {
      for (const { label, id, path } of atomicFields) {
        await expect(page.locator(`#${id}_field`)).toBeAttached();
        await expect(page.locator(`[for=${id}]`)).toHaveText(label);
        await expect(page.locator(`#${id}`)).toHaveValue(String(getNestedValue(cr, path)));
      }
    });

    await test.step('Verify select field', async () => {
      await expect(page.locator(`#${SELECT_FIELD_ID}_field`)).toBeAttached();
      await expect(page.locator(`[for=${SELECT_FIELD_ID}]`)).toHaveText('Select');
      await expect(page.locator(`#${SELECT_FIELD_ID}`)).toHaveText(String(cr.spec.select));
    });

    await test.step('Verify labels field', async () => {
      await expect(page.locator(`#${LABELS_FIELD_ID}_field`)).toBeAttached();
      await expect(page.locator(`[for=${LABELS_FIELD_ID}]`)).toHaveText('Labels');
      await expect(page.locator(`#${LABELS_FIELD_ID}_field .tag-item-content`)).toHaveText(
        `automatedTestName=${testNs}`,
      );
    });

    await test.step('Verify field group', async () => {
      await expect(page.locator(`#${FIELD_GROUP_ID}_field-group`)).toBeAttached();
      await page.locator(`#${FIELD_GROUP_ID}_accordion-toggle`).click();
      await expect(page.locator(`[for="${FIELD_GROUP_ID}_itemOne"]`)).toHaveText('itemOne');
      await expect(page.locator(`#${FIELD_GROUP_ID}_itemOne`)).toHaveValue(
        cr.spec.fieldGroup.itemOne,
      );
      await expect(page.locator(`[for="${FIELD_GROUP_ID}_itemTwo"]`)).toHaveText('itemTwo');
      await expect(page.locator(`#${FIELD_GROUP_ID}_itemTwo`)).toHaveValue(
        String(cr.spec.fieldGroup.itemTwo),
      );
    });

    await test.step('Verify array field group', async () => {
      await expect(page.locator(`#${ARRAY_FIELD_GROUP_ID}_field-group`)).toBeAttached();
      await page.locator(`#${ARRAY_FIELD_GROUP_ID}_accordion-toggle`).click();
      await expect(page.locator(`[for="${ARRAY_FIELD_GROUP_ID}_0_itemOne"]`)).toHaveText(
        'Item One',
      );
      await expect(page.locator(`#${ARRAY_FIELD_GROUP_ID}_0_itemOne`)).toHaveValue(
        cr.spec.arrayFieldGroup[0].itemOne,
      );
      await expect(page.locator(`[for="${ARRAY_FIELD_GROUP_ID}_0_itemTwo"]`)).toHaveText(
        'Item Two',
      );
      await expect(page.locator(`#${ARRAY_FIELD_GROUP_ID}_0_itemTwo`)).toHaveValue(
        String(cr.spec.arrayFieldGroup[0].itemTwo),
      );
    });

    await test.step('Verify hidden field group is not rendered', async () => {
      await expect(page.locator('#root_spec_hiddenFieldGroup_field-group')).not.toBeAttached();
    });

    await test.step('Submit form and verify operand created', async () => {
      await page.locator('#root_metadata_name').clear();
      await page.locator('#root_metadata_name').fill(cr.metadata.name);
      await page.getByTestId('create-dynamic-form').click();
      await page.locator(`[data-test-operand-link="${cr.metadata.name}"]`).click({ force: true });
      await expect(page.getByTestId('operand-details__section--info').first()).toBeAttached();
    });
  });
});
