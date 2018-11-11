/* eslint-disable no-undef, no-unused-vars */

import { execSync } from 'child_process';
import { browser, $$ } from 'protractor';
import { safeDump } from 'js-yaml';

import { appHost, testName, checkLogs, checkErrors } from '../../protractor.conf';
import { SpecCapability, StatusCapability } from '../../../public/components/operator-lifecycle-manager/descriptors/types';
import * as crudView from '../../views/crud.view';

const defaultValueFor = <C extends SpecCapability | StatusCapability>(capability: C) => {
  switch (capability) {
    case SpecCapability.podCount: return 3;
    case SpecCapability.endpointList: return [{port: 8080, scheme: 'TCP'}];
    case SpecCapability.label: return 'app=openshift';
    case SpecCapability.resourceRequirements: return {limits: {cpu: '500m', memory: '50Mi'}, requests: {cpu: '500m', memory: '50Mi'}};
    case SpecCapability.namespaceSelector: return {matchNames: ['default']};
    case SpecCapability.booleanSwitch: return true;

    case StatusCapability.podStatuses: return {ready: ['pod-0', 'pod-1'], unhealthy: ['pod-2'], stopped: ['pod-3']};
    case StatusCapability.podCount: return 3;
    case StatusCapability.w3Link: return 'https://google.com';
    case StatusCapability.conditions: return [
      {type: 'Available', status: 'True', lastUpdateTime: '2018-08-22T23:27:55Z', lastTransitionTime: '2018-08-22T23:27:55Z', reason: 'AppReady', message: 'App is ready.'},
    ];
    case StatusCapability.text: return 'Some text';
    case StatusCapability.prometheusEndpoint: return 'my-svc.my-namespace.svc.cluster.local';
    case StatusCapability.k8sPhase: return 'Available';
    case StatusCapability.k8sPhaseReason: return 'AppReady';

    default: return null;
  }
};

describe('Using OLM descriptor components', () => {
  const testLabel = 'automatedTestName';
  const prefixedCapabilities = new Set([SpecCapability.selector, SpecCapability.k8sResourcePrefix, StatusCapability.k8sResourcePrefix]);
  const testCRD = {
    apiVersion: 'apiextensions.k8s.io/v1beta1',
    kind: 'CustomResourceDefinition',
    metadata: {
      name: 'apps.test.tectonic.com',
      labels: {[testLabel]: testName},
    },
    spec: {
      group: 'test.tectonic.com',
      version: 'v1',
      scope: 'Namespaced',
      names: {
        plural: 'apps',
        singular: 'app',
        kind: 'App',
        listKind: 'Apps',
      },
    },
  };
  const testCR = {
    apiVersion: `${testCRD.spec.group}/${testCRD.spec.version}`,
    kind: testCRD.spec.names.kind,
    metadata: {
      name: 'olm-descriptors-test',
      namespace: testName,
      labels: {[testLabel]: testName},
    },
    spec: {
      ...Object.keys(SpecCapability).filter(c => !prefixedCapabilities.has(SpecCapability[c])).reduce((acc, cur) => ({
        ...acc, [cur]: defaultValueFor(SpecCapability[cur]),
      }), {}),
    },
    status: {
      ...Object.keys(StatusCapability).filter(c => !prefixedCapabilities.has(StatusCapability[c])).reduce((acc, cur) => ({
        ...acc, [cur]: defaultValueFor(StatusCapability[cur]),
      }), {}),
    },
  };
  const testCSV = {
    apiVersion: 'operators.coreos.com/v1alpha1',
    kind: 'ClusterServiceVersion',
    metadata: {
      name: 'olm-descriptors-test',
      namespace: testName,
      labels: {[testLabel]: testName},
    },
    spec: {
      displayName: 'Test Operator',
      install: {
        strategy: 'deployment',
        spec: {
          permissions: [],
          deployments: [{
            name: 'test-operator',
            spec: {
              replicas: 1,
              selector: {
                matchLabels: {
                  name: 'test-operator-alm-owned',
                },
              },
              template: {
                metadata: {
                  name: 'test-operator-alm-owned',
                  labels: {
                    name: 'test-operator-alm-owned',
                  },
                },
                spec: {
                  serviceAccountName: 'test-operator',
                  containers: [{
                    name: 'test-operator',
                    image: 'nginx',
                  }],
                },
              },
            },
          }],
        },
      },
      customresourcedefinitions: {
        owned: [
          {
            name: testCRD.metadata.name,
            version: testCRD.spec.version,
            kind: testCRD.spec.names.kind,
            displayName: testCRD.spec.names.kind,
            description: 'Application instance for testing descriptors',
            resources: [],
            specDescriptors: Object.keys(SpecCapability).filter(c => !prefixedCapabilities.has(SpecCapability[c])).map(capability => ({
              description: `Spec descriptor for ${capability}`,
              displayName: capability,
              path: capability,
              'x-descriptors': [SpecCapability[capability]],
            })),
            statusDescriptors: Object.keys(StatusCapability).filter(c => !prefixedCapabilities.has(StatusCapability[c])).map(capability => ({
              description: `Status descriptor for ${capability}`,
              displayName: capability,
              path: capability,
              'x-descriptors': [StatusCapability[capability]],
            })),
          },
        ],
      },
    },
  };

  beforeAll(async() => {
    console.log('\nUsing ClusterServiceVersion:');
    console.log(safeDump(testCSV));
    console.log('\nUsing custom resource:');
    console.log(safeDump(testCR));

    execSync(`echo '${JSON.stringify(testCRD)}' | kubectl create -f -`);
    execSync(`echo '${JSON.stringify(testCSV)}' | kubectl create -f -`);
    execSync(`echo '${JSON.stringify(testCR)}' | kubectl create -f -`);

    await browser.get(`${appHost}/ns/${testName}/clusterserviceversions/${testCSV.metadata.name}/${testCRD.spec.group}~${testCRD.spec.version}~${testCRD.spec.names.kind}`);
    await crudView.isLoaded();
  });

  afterEach(() => {
    checkLogs();
    checkErrors();
  });

  afterAll(() => {
    execSync(`kubectl delete crd ${testCRD.metadata.name}`);
    execSync(`kubectl delete -n ${testName} clusterserviceversion ${testCSV.metadata.name}`);
  });

  it('displays list containing custom resource', async() => {
    expect(crudView.rowForName(testCR.metadata.name).isDisplayed()).toBe(true);
  });

  it('displays detail view for custom resource', async() => {
    const {group, version, names: {kind}} = testCRD.spec;
    await browser.get(`${appHost}/ns/${testName}/clusterserviceversions/${testCSV.metadata.name}/${group}~${version}~${kind}/${testCR.metadata.name}`);
    await crudView.isLoaded();

    expect(crudView.resourceTitle.getText()).toEqual(testCR.metadata.name);
  });

  testCSV.spec.customresourcedefinitions.owned[0].specDescriptors.forEach(descriptor => {
    const label = $$('dt').filter(dt => dt.getText().then(text => text.toLowerCase() === descriptor.displayName.toLowerCase())).first();

    it(`displays spec descriptor for ${descriptor.displayName}`, () => {
      expect(label.isDisplayed()).toBe(true);
    });
  });

  testCSV.spec.customresourcedefinitions.owned[0].statusDescriptors.forEach(descriptor => {
    const label = $$('dt').filter(dt => dt.getText().then(text => text.toLowerCase() === descriptor.displayName.toLowerCase())).first();

    it(`displays status descriptor for ${descriptor.displayName}`, () => {
      expect(label.isDisplayed()).toBe(true);
    });
  });
});
