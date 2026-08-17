import { test, expect } from '../../fixtures';
import { OperandPage } from '../../pages/operand-page';

const TEST_SUFFIX = Date.now().toString();
const CRD_GROUP = `test-${TEST_SUFFIX}.tectonic.com`;
const CRD_NAME = `apps.${CRD_GROUP}`;
const CRD_VERSION = 'v1';
const CRD_KIND = 'App';
const CRD_PLURAL = 'apps';
const CSV_NAME = `olm-descriptors-test-${TEST_SUFFIX}`;
const CR_NAME = `olm-descriptors-test-${TEST_SUFFIX}`;

const FIELD_IDS = {
  NAME: 'root_metadata_name',
  PASSWORD: 'root_spec_password',
  NUMBER: 'root_spec_number',
  SELECT: 'root_spec_select',
  LABELS: 'root_metadata_labels',
  FIELD_GROUP: 'root_spec_fieldGroup',
  ARRAY_FIELD_GROUP: 'root_spec_arrayFieldGroup',
};

const visibleSpecDescriptors = [
  'Pod Count',
  'Endpoint List',
  'Label',
  'Resource Requirements',
  'Namespace Selector',
  'Boolean Switch',
  'Password',
  'Checkbox',
  'Image Pull Policy',
  'Update Strategy',
  'Text',
  'Number',
  'Node Affinity',
  'Pod Affinity',
  'Pod Anti Affinity',
  'Advanced',
  'Field Dependency',
];
const hiddenSpecDescriptors = ['Hidden'];

const visibleStatusDescriptors = [
  'Pod Statuses',
  'Pod Count',
  'W3 Link',
  'Text',
  'Prometheus Endpoint',
  'K8s Phase',
  'K8s Phase Reason',
  'Password',
];
const hiddenStatusDescriptors = ['Hidden'];

function buildTestCRD() {
  return {
    apiVersion: 'apiextensions.k8s.io/v1',
    kind: 'CustomResourceDefinition',
    metadata: { name: CRD_NAME },
    spec: {
      group: CRD_GROUP,
      scope: 'Namespaced',
      names: { plural: CRD_PLURAL, singular: 'app', kind: CRD_KIND, listKind: 'Apps' },
      versions: [
        {
          name: CRD_VERSION,
          subresources: { status: {} },
          served: true,
          storage: true,
          schema: {
            openAPIV3Schema: {
              type: 'object',
              properties: {
                spec: {
                  type: 'object',
                  required: ['password', 'select'],
                  properties: {
                    password: {
                      type: 'string',
                      minLength: 1,
                      maxLength: 25,
                      pattern: '^[a-zA-Z0-9._\\-%]*$',
                    },
                    number: { type: 'integer', minimum: 2, maximum: 4 },
                    select: {
                      type: 'string',
                      title: 'Select',
                      enum: ['DEBUG', 'INFO', 'WARN', 'ERROR', 'FATAL'],
                    },
                    fieldGroup: {
                      type: 'object',
                      properties: {
                        itemOne: { type: 'string' },
                        itemTwo: { type: 'integer' },
                      },
                    },
                    arrayFieldGroup: {
                      type: 'array',
                      items: {
                        type: 'object',
                        properties: {
                          itemOne: { title: 'Item One', type: 'string' },
                          itemTwo: { title: 'Item Two', type: 'integer' },
                        },
                      },
                    },
                    hiddenFieldGroup: {
                      type: 'object',
                      properties: { hiddenItem: { type: 'object' } },
                    },
                  },
                },
              },
            },
          },
        },
      ],
    },
  };
}

function buildTestCR(ns: string) {
  return {
    apiVersion: `${CRD_GROUP}/${CRD_VERSION}`,
    kind: CRD_KIND,
    metadata: {
      name: CR_NAME,
      namespace: ns,
      labels: { automatedTestName: ns },
    },
    spec: {
      fieldGroup: { itemOne: 'Field group item 1', itemTwo: 2 },
      arrayFieldGroup: [{ itemOne: 'Array field group item 1', itemTwo: 2 }],
      select: 'WARN',
      podCount: 3,
      endpointList: [{ port: 8080, scheme: 'TCP' }],
      label: 'app=openshift',
      resourceRequirements: {
        limits: { cpu: '500m', memory: '50Mi', 'ephemeral-storage': '500Gi' },
        requests: { cpu: '500m', memory: '50Mi', 'ephemeral-storage': '500Gi' },
      },
      namespaceSelector: { matchNames: ['default'] },
      booleanSwitch: true,
      password: 'password123',
      checkbox: true,
      imagePullPolicy: 'Never',
      updateStrategy: { type: 'Recreate' },
      text: 'Some text',
      number: 2,
    },
    status: {
      podStatuses: { ready: ['pod-0', 'pod-1'], unhealthy: ['pod-2'], stopped: ['pod-3'] },
      podCount: 3,
      w3Link: 'https://google.com',
      conditions: [
        {
          type: 'Available',
          status: 'True',
          lastUpdateTime: '2018-08-22T23:27:55Z',
          lastTransitionTime: '2018-08-22T23:27:55Z',
          reason: 'AppReady',
          message: 'App is ready.',
        },
      ],
      text: 'Some text',
      prometheusEndpoint: 'my-svc.my-namespace.svc.cluster.local',
      k8sPhase: 'Available',
      k8sPhaseReason: 'AppReady',
    },
  };
}

const allSpecDescriptorPaths = [
  { path: 'podCount', displayName: 'Pod Count' },
  { path: 'endpointList', displayName: 'Endpoint List' },
  { path: 'label', displayName: 'Label' },
  { path: 'resourceRequirements', displayName: 'Resource Requirements' },
  { path: 'namespaceSelector', displayName: 'Namespace Selector' },
  { path: 'booleanSwitch', displayName: 'Boolean Switch' },
  { path: 'password', displayName: 'Password' },
  { path: 'checkbox', displayName: 'Checkbox' },
  { path: 'imagePullPolicy', displayName: 'Image Pull Policy' },
  { path: 'updateStrategy', displayName: 'Update Strategy' },
  { path: 'text', displayName: 'Text' },
  { path: 'number', displayName: 'Number' },
  { path: 'nodeAffinity', displayName: 'Node Affinity' },
  { path: 'podAffinity', displayName: 'Pod Affinity' },
  { path: 'podAntiAffinity', displayName: 'Pod Anti Affinity' },
  { path: 'advanced', displayName: 'Advanced' },
  { path: 'fieldDependency', displayName: 'Field Dependency' },
  { path: 'hidden', displayName: 'Hidden' },
];

function buildSpecDescriptors() {
  return allSpecDescriptorPaths.map((d) => ({
    description: `Spec descriptor for ${d.path}`,
    displayName: d.displayName,
    path: d.path,
    'x-descriptors': [`urn:alm:descriptor:com.tectonic.ui:${d.path}`],
  }));
}

const allStatusDescriptorPaths = [
  { path: 'podStatuses', displayName: 'Pod Statuses' },
  { path: 'podCount', displayName: 'Pod Count' },
  { path: 'w3Link', displayName: 'W3 Link' },
  { path: 'conditions', displayName: 'Conditions' },
  { path: 'text', displayName: 'Text' },
  { path: 'prometheusEndpoint', displayName: 'Prometheus Endpoint' },
  { path: 'k8sPhase', displayName: 'K8s Phase' },
  { path: 'k8sPhaseReason', displayName: 'K8s Phase Reason' },
  { path: 'password', displayName: 'Password' },
  { path: 'hidden', displayName: 'Hidden' },
];

const statusCapabilityUrns: Record<string, string> = {
  podStatuses: 'urn:alm:descriptor:com.tectonic.ui:podStatuses',
  podCount: 'urn:alm:descriptor:com.tectonic.ui:podCount',
  w3Link: 'urn:alm:descriptor:org.w3:link',
  conditions: 'urn:alm:descriptor:io.kubernetes.conditions',
  text: 'urn:alm:descriptor:text',
  prometheusEndpoint: 'urn:alm:descriptor:prometheusEndpoint',
  k8sPhase: 'urn:alm:descriptor:io.kubernetes.phase',
  k8sPhaseReason: 'urn:alm:descriptor:io.kubernetes.phase:reason',
  password: 'urn:alm:descriptor:com.tectonic.ui:password',
  hidden: 'urn:alm:descriptor:com.tectonic.ui:hidden',
};

function buildStatusDescriptors() {
  return allStatusDescriptorPaths.map((d) => ({
    description: `Status descriptor for ${d.path}`,
    displayName: d.displayName,
    path: d.path,
    'x-descriptors': [statusCapabilityUrns[d.path]],
  }));
}

function buildTestCSV(ns: string, cr: ReturnType<typeof buildTestCR>) {
  return {
    apiVersion: 'operators.coreos.com/v1alpha1',
    kind: 'ClusterServiceVersion',
    metadata: {
      name: CSV_NAME,
      namespace: ns,
      annotations: { 'alm-examples': JSON.stringify([cr]) },
    },
    spec: {
      displayName: 'Test Operator',
      install: {
        strategy: 'deployment',
        spec: {
          permissions: [],
          deployments: [
            {
              name: 'test-operator',
              spec: {
                replicas: 1,
                selector: { matchLabels: { name: 'test-operator-alm-owned' } },
                template: {
                  metadata: {
                    name: 'test-operator-alm-owned',
                    labels: { name: 'test-operator-alm-owned' },
                  },
                  spec: {
                    serviceAccountName: 'test-operator',
                    containers: [{ name: 'test-operator', image: 'nginx' }],
                  },
                },
              },
            },
          ],
        },
      },
      customresourcedefinitions: {
        owned: [
          {
            name: CRD_NAME,
            version: CRD_VERSION,
            kind: CRD_KIND,
            displayName: CRD_KIND,
            description: 'Application instance for testing descriptors',
            resources: [],
            specDescriptors: buildSpecDescriptors(),
            statusDescriptors: buildStatusDescriptors(),
          },
        ],
      },
    },
  };
}

test.describe('Using OLM descriptor components', { tag: ['@admin'] }, () => {
  let ns: string;
  let csvUrl: string;

  test.beforeAll(async ({ k8sClient }) => {
    test.setTimeout(180_000);
    ns = `test-desc-${Date.now()}`;
    await k8sClient.createNamespace(ns);
    const namespaceReady = await k8sClient.waitForNamespaceReady(ns);
    if (!namespaceReady) {
      throw new Error(`Namespace ${ns} did not become ready in time`);
    }

    const testCRD = buildTestCRD();
    await k8sClient.createClusterCustomResource(
      'apiextensions.k8s.io',
      'v1',
      'customresourcedefinitions',
      testCRD,
    );

    await expect(async () => {
      const crd = (await k8sClient.getClusterCustomResource(
        'apiextensions.k8s.io',
        'v1',
        'customresourcedefinitions',
        CRD_NAME,
      )) as { status?: { conditions?: Array<{ type?: string; status?: string }> } };
      const established = crd.status?.conditions?.some(
        (condition) => condition.type === 'Established' && condition.status === 'True',
      );
      expect(established).toBe(true);
    }).toPass({ timeout: 60_000, intervals: [2_000] });

    const testCR = buildTestCR(ns);
    const testCSV = buildTestCSV(ns, testCR);
    await k8sClient.createCustomResource(
      'operators.coreos.com',
      'v1alpha1',
      ns,
      'clusterserviceversions',
      testCSV,
    );

    await expect(async () => {
      const csv = await k8sClient.getCustomResource(
        'operators.coreos.com',
        'v1alpha1',
        ns,
        'clusterserviceversions',
        CSV_NAME,
      );
      expect(csv).toBeTruthy();
    }).toPass({ timeout: 60_000, intervals: [2_000] });

    csvUrl = `/k8s/ns/${ns}/operators.coreos.com~v1alpha1~ClusterServiceVersion/${CSV_NAME}/${CRD_GROUP}~${CRD_VERSION}~${CRD_KIND}`;
  });

  test.afterAll(async ({ k8sClient }) => {
    await k8sClient.deleteClusterCustomResource(
      'apiextensions.k8s.io',
      'v1',
      'customresourcedefinitions',
      CRD_NAME,
    );
    await k8sClient.deleteCustomResource(
      'operators.coreos.com',
      'v1alpha1',
      ns,
      'clusterserviceversions',
      CSV_NAME,
    );
    await k8sClient.deleteNamespace(ns);
  });

  test('displays list and detail views of an operand', async ({ page, k8sClient, cleanup }) => {
    const operandPage = new OperandPage(page);
    const testCR = buildTestCR(ns);

    await test.step('Create test CR', async () => {
      await k8sClient.createCustomResource(CRD_GROUP, CRD_VERSION, ns, CRD_PLURAL, testCR);
      cleanup.trackCustomResource(CR_NAME, ns, CRD_GROUP, CRD_VERSION, CRD_PLURAL);
    });

    await test.step('Verify operand link on list page', async () => {
      await operandPage.navigateTo(csvUrl);
      await expect(operandPage.getOperandLink(CR_NAME)).toBeVisible({ timeout: 60_000 });
    });

    await test.step('Verify resource title on detail page', async () => {
      await operandPage.navigateTo(`${csvUrl}/${CR_NAME}`);
      await expect(operandPage.getResourceTitle()).toHaveText(CR_NAME);
    });

    await test.step('Verify visible spec descriptors', async () => {
      for (const displayName of visibleSpecDescriptors) {
        await expect(operandPage.getDetailsItemLabel(displayName)).toBeAttached();
      }
    });

    await test.step('Verify hidden spec descriptors are not rendered', async () => {
      for (const displayName of hiddenSpecDescriptors) {
        await expect(operandPage.getDetailsItemLabel(displayName)).not.toBeAttached();
      }
    });

    await test.step('Verify visible status descriptors', async () => {
      for (const displayName of visibleStatusDescriptors) {
        await expect(operandPage.getDetailsItemLabel(displayName)).toBeAttached();
      }
    });

    await test.step('Verify hidden status descriptors are not rendered', async () => {
      for (const displayName of hiddenStatusDescriptors) {
        await expect(operandPage.getDetailsItemLabel(displayName)).not.toBeAttached();
      }
    });
  });

  test('creates an operand using the form', async ({ page, cleanup }) => {
    const operandPage = new OperandPage(page);
    const testCR = buildTestCR(ns);

    await test.step('Navigate to create form', async () => {
      await operandPage.navigateTo(csvUrl);
      await operandPage.clickCreate();
      await expect(operandPage.getFormHeading()).toHaveText('Create App');
    });

    await test.step('Verify atomic form fields', async () => {
      const atomicFields = [
        { label: 'Name', id: FIELD_IDS.NAME, value: testCR.metadata.name },
        { label: 'Password', id: FIELD_IDS.PASSWORD, value: testCR.spec.password },
        { label: 'Number', id: FIELD_IDS.NUMBER, value: String(testCR.spec.number) },
      ];

      for (const field of atomicFields) {
        await expect(operandPage.getFormFieldElement(field.id)).toBeAttached();
        await expect(operandPage.getFormFieldLabel(field.id)).toHaveText(field.label);
        await expect(operandPage.getFormFieldInput(field.id)).toHaveValue(field.value);
      }
    });

    await test.step('Verify select field', async () => {
      await expect(operandPage.getFormFieldElement(FIELD_IDS.SELECT)).toBeAttached();
      await expect(operandPage.getFormFieldLabel(FIELD_IDS.SELECT)).toHaveText('Select');
      await expect(operandPage.getFormFieldInput(FIELD_IDS.SELECT)).toHaveText(
        testCR.spec.select,
      );
    });

    await test.step('Verify labels field', async () => {
      await expect(operandPage.getFormFieldElement(FIELD_IDS.LABELS)).toBeAttached();
      await expect(operandPage.getFormFieldLabel(FIELD_IDS.LABELS)).toHaveText('Labels');
      await expect(operandPage.getTagItemContent(FIELD_IDS.LABELS)).toHaveText(
        `automatedTestName=${ns}`,
      );
    });

    await test.step('Verify field group', async () => {
      await expect(operandPage.getFormFieldGroup(FIELD_IDS.FIELD_GROUP)).toBeAttached();
      await operandPage.toggleFieldGroup(FIELD_IDS.FIELD_GROUP);
      await expect(
        operandPage.getFormFieldLabel(`${FIELD_IDS.FIELD_GROUP}_itemOne`),
      ).toHaveText('itemOne');
      await expect(
        operandPage.getFormFieldInput(`${FIELD_IDS.FIELD_GROUP}_itemOne`),
      ).toHaveValue(testCR.spec.fieldGroup.itemOne);
      await expect(
        operandPage.getFormFieldLabel(`${FIELD_IDS.FIELD_GROUP}_itemTwo`),
      ).toHaveText('itemTwo');
      await expect(
        operandPage.getFormFieldInput(`${FIELD_IDS.FIELD_GROUP}_itemTwo`),
      ).toHaveValue(String(testCR.spec.fieldGroup.itemTwo));
    });

    await test.step('Verify array field group', async () => {
      await expect(operandPage.getFormFieldGroup(FIELD_IDS.ARRAY_FIELD_GROUP)).toBeAttached();
      await operandPage.toggleFieldGroup(FIELD_IDS.ARRAY_FIELD_GROUP);
      await expect(
        operandPage.getFormFieldLabel(`${FIELD_IDS.ARRAY_FIELD_GROUP}_0_itemOne`),
      ).toHaveText('Item One');
      await expect(
        operandPage.getFormFieldInput(`${FIELD_IDS.ARRAY_FIELD_GROUP}_0_itemOne`),
      ).toHaveValue(testCR.spec.arrayFieldGroup[0].itemOne);
      await expect(
        operandPage.getFormFieldLabel(`${FIELD_IDS.ARRAY_FIELD_GROUP}_0_itemTwo`),
      ).toHaveText('Item Two');
      await expect(
        operandPage.getFormFieldInput(`${FIELD_IDS.ARRAY_FIELD_GROUP}_0_itemTwo`),
      ).toHaveValue(String(testCR.spec.arrayFieldGroup[0].itemTwo));
    });

    await test.step('Verify hidden field group is not rendered', async () => {
      await expect(
        page.locator('#root_spec_hiddenFieldGroup_field-group'),
      ).not.toBeAttached();
    });

    await test.step('Submit form and verify operand created', async () => {
      await operandPage.fillNameField(FIELD_IDS.NAME, CR_NAME);
      await operandPage.submitCreateForm();
      cleanup.trackCustomResource(CR_NAME, ns, CRD_GROUP, CRD_VERSION, CRD_PLURAL);
      await operandPage.clickOperandLink(CR_NAME);
      await expect(operandPage.getOperandDetailsSection()).toBeAttached();
    });
  });
});
