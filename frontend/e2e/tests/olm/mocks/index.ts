const SpecCapability = {
  podCount: 'urn:alm:descriptor:com.tectonic.ui:podCount',
  endpointList: 'urn:alm:descriptor:com.tectonic.ui:endpointList',
  label: 'urn:alm:descriptor:com.tectonic.ui:label',
  resourceRequirements: 'urn:alm:descriptor:com.tectonic.ui:resourceRequirements',
  selector: 'urn:alm:descriptor:com.tectonic.ui:selector:',
  namespaceSelector: 'urn:alm:descriptor:com.tectonic.ui:namespaceSelector',
  k8sResourcePrefix: 'urn:alm:descriptor:io.kubernetes:',
  booleanSwitch: 'urn:alm:descriptor:com.tectonic.ui:booleanSwitch',
  password: 'urn:alm:descriptor:com.tectonic.ui:password',
  checkbox: 'urn:alm:descriptor:com.tectonic.ui:checkbox',
  imagePullPolicy: 'urn:alm:descriptor:com.tectonic.ui:imagePullPolicy',
  updateStrategy: 'urn:alm:descriptor:com.tectonic.ui:updateStrategy',
  text: 'urn:alm:descriptor:com.tectonic.ui:text',
  number: 'urn:alm:descriptor:com.tectonic.ui:number',
  nodeAffinity: 'urn:alm:descriptor:com.tectonic.ui:nodeAffinity',
  podAffinity: 'urn:alm:descriptor:com.tectonic.ui:podAffinity',
  podAntiAffinity: 'urn:alm:descriptor:com.tectonic.ui:podAntiAffinity',
  fieldGroup: 'urn:alm:descriptor:com.tectonic.ui:fieldGroup:',
  arrayFieldGroup: 'urn:alm:descriptor:com.tectonic.ui:arrayFieldGroup:',
  select: 'urn:alm:descriptor:com.tectonic.ui:select:',
  advanced: 'urn:alm:descriptor:com.tectonic.ui:advanced',
  fieldDependency: 'urn:alm:descriptor:com.tectonic.ui:fieldDependency:',
  hidden: 'urn:alm:descriptor:com.tectonic.ui:hidden',
} as const;

const StatusCapability = {
  podStatuses: 'urn:alm:descriptor:com.tectonic.ui:podStatuses',
  podCount: 'urn:alm:descriptor:com.tectonic.ui:podCount',
  w3Link: 'urn:alm:descriptor:org.w3:link',
  conditions: 'urn:alm:descriptor:io.kubernetes.conditions',
  text: 'urn:alm:descriptor:text',
  prometheusEndpoint: 'urn:alm:descriptor:prometheusEndpoint',
  k8sPhase: 'urn:alm:descriptor:io.kubernetes.phase',
  k8sPhaseReason: 'urn:alm:descriptor:io.kubernetes.phase:reason',
  password: 'urn:alm:descriptor:com.tectonic.ui:password',
  k8sResourcePrefix: 'urn:alm:descriptor:io.kubernetes:',
  hidden: 'urn:alm:descriptor:com.tectonic.ui:hidden',
} as const;

const prefixedCapabilities = new Set<string>([
  SpecCapability.selector,
  SpecCapability.k8sResourcePrefix,
  SpecCapability.fieldGroup,
  SpecCapability.arrayFieldGroup,
  SpecCapability.select,
  StatusCapability.k8sResourcePrefix,
]);

function defaultValueFor(capability: string): unknown {
  switch (capability) {
    case SpecCapability.podCount:
      return 3;
    case SpecCapability.endpointList:
      return [{ port: 8080, scheme: 'TCP' }];
    case SpecCapability.label:
      return 'app=openshift';
    case SpecCapability.resourceRequirements:
      return {
        limits: { cpu: '500m', memory: '50Mi', 'ephemeral-storage': '500Gi' },
        requests: { cpu: '500m', memory: '50Mi', 'ephemeral-storage': '500Gi' },
      };
    case SpecCapability.namespaceSelector:
      return { matchNames: ['default'] };
    case SpecCapability.booleanSwitch:
      return true;
    case SpecCapability.password:
      return 'password123';
    case SpecCapability.checkbox:
      return true;
    case SpecCapability.imagePullPolicy:
      return 'Never';
    case SpecCapability.updateStrategy:
      return { type: 'Recreate' };
    case SpecCapability.text:
      return 'Some text';
    case SpecCapability.number:
      return 2;
    case SpecCapability.select:
      return '';
    case StatusCapability.podStatuses:
      return { ready: ['pod-0', 'pod-1'], unhealthy: ['pod-2'], stopped: ['pod-3'] };
    case StatusCapability.podCount:
      return 3;
    case StatusCapability.w3Link:
      return 'https://google.com';
    case StatusCapability.conditions:
      return [
        {
          type: 'Available',
          status: 'True',
          lastUpdateTime: '2018-08-22T23:27:55Z',
          lastTransitionTime: '2018-08-22T23:27:55Z',
          reason: 'AppReady',
          message: 'App is ready.',
        },
      ];
    case StatusCapability.text:
      return 'Some text';
    case StatusCapability.prometheusEndpoint:
      return 'my-svc.my-namespace.svc.cluster.local';
    case StatusCapability.k8sPhase:
      return 'Available';
    case StatusCapability.k8sPhaseReason:
      return 'AppReady';
    default:
      return null;
  }
}

const testLabel = 'automatedTestName';

function buildSpecEntries(capabilityMap: Record<string, string>) {
  return Object.keys(capabilityMap)
    .filter((c) => !prefixedCapabilities.has(capabilityMap[c]))
    .reduce(
      (acc, cur) => ({ ...acc, [cur]: defaultValueFor(capabilityMap[cur]) }),
      {} as Record<string, unknown>,
    );
}

function buildDescriptors(capabilityMap: Record<string, string>) {
  return Object.keys(capabilityMap)
    .filter((c) => !prefixedCapabilities.has(capabilityMap[c]))
    .map((capability) => ({
      description: `Spec descriptor for ${capability}`,
      displayName: capability.replace(/([A-Z])/g, ' $1').replace(/^./, (str) => str.toUpperCase()),
      path: capability,
      'x-descriptors': [capabilityMap[capability]],
    }));
}

export function createTestCRD(testName: string) {
  return {
    apiVersion: 'apiextensions.k8s.io/v1',
    kind: 'CustomResourceDefinition',
    metadata: {
      name: 'apps.test.tectonic.com',
      labels: { [testLabel]: testName },
    },
    spec: {
      group: 'test.tectonic.com',
      scope: 'Namespaced',
      names: { plural: 'apps', singular: 'app', kind: 'App', listKind: 'Apps' },
      versions: [
        {
          name: 'v1',
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

export function createTestCR(testName: string) {
  const crd = createTestCRD(testName);
  return {
    apiVersion: `${crd.spec.group}/${crd.spec.versions[0].name}`,
    kind: crd.spec.names.kind,
    metadata: {
      name: 'olm-descriptors-test',
      namespace: testName,
      labels: { [testLabel]: testName },
    },
    spec: {
      fieldGroup: { itemOne: 'Field group item 1', itemTwo: 2 },
      arrayFieldGroup: [{ itemOne: 'Array field group item 1', itemTwo: 2 }],
      select: 'WARN',
      ...buildSpecEntries((SpecCapability as unknown) as Record<string, string>),
    },
    status: {
      ...buildSpecEntries((StatusCapability as unknown) as Record<string, string>),
    },
  };
}

export function createTestCSV(testName: string) {
  const crd = createTestCRD(testName);
  const cr = createTestCR(testName);
  return {
    apiVersion: 'operators.coreos.com/v1alpha1',
    kind: 'ClusterServiceVersion',
    metadata: {
      name: 'olm-descriptors-test',
      namespace: testName,
      labels: { [testLabel]: testName },
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
            name: crd.metadata.name,
            version: crd.spec.versions[0].name,
            kind: crd.spec.names.kind,
            displayName: crd.spec.names.kind,
            description: 'Application instance for testing descriptors',
            resources: [],
            specDescriptors: buildDescriptors(
              (SpecCapability as unknown) as Record<string, string>,
            ),
            statusDescriptors: buildDescriptors(
              (StatusCapability as unknown) as Record<string, string>,
            ),
          },
        ],
      },
    },
  };
}

export function createTestCatalogSource(testName: string) {
  return {
    apiVersion: 'operators.coreos.com/v1alpha1',
    kind: 'CatalogSource',
    metadata: {
      name: testName,
      namespace: testName,
      labels: { [testLabel]: testName },
    },
    spec: {
      displayName: 'Test catalog',
      image: '',
      sourceType: 'grpc',
      updateStrategy: { registryPoll: { interval: '10m' } },
    },
  };
}

export const testDeprecatedCatalogSource = {
  kind: 'CatalogSource',
  apiVersion: 'operators.coreos.com/v1alpha1',
  metadata: {
    name: 'test-community-operator-deprecation',
    namespace: 'openshift-marketplace',
  },
  spec: {
    displayName: 'Community Operators for testing deprecation',
    image: 'quay.io/cajieh0/deprecation-catalog',
    publisher: 'OLM community',
    sourceType: 'grpc',
    updateStrategy: { registryPoll: { interval: '10m' } },
  },
};

export const testDeprecatedSubscription = {
  apiVersion: 'operators.coreos.com/v1alpha1',
  kind: 'Subscription',
  metadata: {
    name: 'kiali',
    namespace: 'openshift-operators',
  },
  spec: {
    source: 'test-community-operator-deprecation',
    sourceNamespace: 'openshift-marketplace',
    name: 'kiali',
    startingCSV: 'kiali-operator.v1.68.0',
    channel: 'alpha',
    installPlanApproval: 'Manual',
  },
};
