import { execSync } from 'child_process';
import { browser, element, by, $, $$, ExpectedConditions as until, ElementFinder } from 'protractor';
import { safeDump } from 'js-yaml';
import { startCase, get, find, isUndefined } from 'lodash';

import { appHost, testName, checkLogs, checkErrors, create } from '../../protractor.conf';
import { SpecCapability, StatusCapability } from '../../../public/components/operator-lifecycle-manager/descriptors/types';
import * as crudView from '../../views/crud.view';
import * as yamlView from '../../views/yaml.view';

const defaultValueFor = <C extends SpecCapability | StatusCapability>(capability: C) => {
  switch (capability) {
    case SpecCapability.podCount: return 3;
    case SpecCapability.endpointList: return [{port: 8080, scheme: 'TCP'}];
    case SpecCapability.label: return 'app=openshift';
    case SpecCapability.resourceRequirements: return {limits: {cpu: '500m', memory: '50Mi'}, requests: {cpu: '500m', memory: '50Mi'}};
    case SpecCapability.namespaceSelector: return {matchNames: ['default']};
    case SpecCapability.booleanSwitch: return true;
    case SpecCapability.password: return 'password123';
    case SpecCapability.checkbox: return true;
    case SpecCapability.imagePullPolicy: return 'Never';
    case SpecCapability.updateStrategy: return {type: 'Recreate'};
    case SpecCapability.text: return 'Some text';
    case SpecCapability.number: return 2;
    case SpecCapability.select: return '';

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

const inputValueFor = (capability: SpecCapability) => async(el: ElementFinder) => {
  switch (capability) {
    case SpecCapability.podCount: return parseInt(await el.$('input').getAttribute('value'), 10);
    case SpecCapability.label: return el.$('input').getAttribute('value');
    case SpecCapability.resourceRequirements: return {
      limits: {cpu: await el.$$('input').get(0).getAttribute('value'), memory: await el.$$('input').get(1).getAttribute('value')},
      requests: {cpu: await el.$$('input').get(2).getAttribute('value'), memory: await el.$$('input').get(3).getAttribute('value')},
    };
    case SpecCapability.booleanSwitch: return (await el.$('.pf-c-switch__input').getAttribute('checked')) !== 'false';
    case SpecCapability.password: return el.$('input').getAttribute('value');
    case SpecCapability.checkbox: return (await el.$('input').getAttribute('checked')) !== 'false';
    case SpecCapability.imagePullPolicy: return el.$('input[type=\'radio\']:checked').getAttribute('value');
    case SpecCapability.updateStrategy: return {type: await el.$('input[type=\'radio\']:checked').getAttribute('value')};
    case SpecCapability.text: return el.$('input').getAttribute('value');
    case SpecCapability.number: return parseInt(await el.$('input').getAttribute('value'), 10);
    case SpecCapability.endpointList:
    case SpecCapability.namespaceSelector:
    case SpecCapability.nodeAffinity:
    case SpecCapability.podAffinity:
    case SpecCapability.podAntiAffinity:
    default:
      return null;
  }
};

describe('Using OLM descriptor components', () => {
  const testLabel = 'automatedTestName';
  const prefixedCapabilities = new Set([SpecCapability.selector, SpecCapability.k8sResourcePrefix, SpecCapability.fieldGroup, SpecCapability.arrayFieldGroup, SpecCapability.select, StatusCapability.k8sResourcePrefix]);
  const specDescriptorFieldGroup = [{
    description: 'Field #1 for specDescriptorFieldGroup',
    displayName: 'Field1',
    path: 'specDescriptorFieldGroup.fieldOne',
    'x-descriptors': [SpecCapability.fieldGroup.concat('specDescriptorFieldGroup'), SpecCapability.number],
  }, {
    description: 'Field #2 for specDescriptorFieldGroup',
    displayName: 'Field2',
    path: 'specDescriptorFieldGroup.fieldTwo',
    'x-descriptors': [SpecCapability.fieldGroup.concat('specDescriptorFieldGroup'), SpecCapability.number],
  }];
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
      validation: {
        openAPIV3Schema: {
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
                number: {
                  type: 'integer',
                  minimum: 2,
                  maximum: 4,
                },
                select: {
                  type: 'string',
                  enum: ['DEBUG', 'INFO', 'WARN', 'ERROR', 'FATAL'],
                },
                fieldGroup: {
                  type: 'object',
                  properties: {
                    itemOne: {
                      type: 'string',
                    },
                    itemTwo: {
                      type: 'integer',
                    },
                  },
                },
                hiddenFieldGroup: {
                  type: 'object',
                  properties: {
                    hiddenItem: {
                      type: 'object',
                    },
                  },
                },
              },
            },
          },
        },
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
      }), {select: 'WARN'}),
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
      annotations: {'alm-examples': JSON.stringify([testCR])},
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
              displayName: capability.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase()),
              path: capability,
              'x-descriptors': [SpecCapability[capability]],
            })).concat(specDescriptorFieldGroup),
            statusDescriptors: Object.keys(StatusCapability).filter(c => !prefixedCapabilities.has(StatusCapability[c])).map(capability => ({
              description: `Status descriptor for ${capability}`,
              displayName: capability.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase()),
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

    create(testCRD);
    create(testCSV);
    create(testCR);

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

  it('displays list containing operands', async() => {
    await crudView.resourceRowsPresent();
    expect(crudView.rowForName(testCR.metadata.name).isDisplayed()).toBe(true);
  });

  it('displays detail view for operand', async() => {
    const {group, version, names: {kind}} = testCRD.spec;
    await browser.get(`${appHost}/ns/${testName}/clusterserviceversions/${testCSV.metadata.name}/${group}~${version}~${kind}/${testCR.metadata.name}`);
    await crudView.isLoaded();

    expect(crudView.resourceTitle.getText()).toEqual(testCR.metadata.name);
  });

  testCSV.spec.customresourcedefinitions.owned[0].specDescriptors.forEach(descriptor => {
    const label = element(by.cssContainingText('.olm-descriptor__title', descriptor.displayName));

    it(`displays spec descriptor for ${descriptor.displayName}`, async() => {
      expect(label.isDisplayed()).toBe(true);
    });
  });

  testCSV.spec.customresourcedefinitions.owned[0].statusDescriptors.forEach(descriptor => {
    const label = element(by.cssContainingText('.olm-descriptor__title', descriptor.displayName));

    it(`displays status descriptor for ${descriptor.displayName}`, async() => {
      expect(label.isDisplayed()).toBe(true);
    });
  });

  it('displays form for creating operand', async() => {
    await $$('[data-test-id=breadcrumb-link-1]').click();
    await browser.wait(until.visibilityOf(element(by.buttonText('Create App'))));
    await element(by.buttonText('Create App')).click();
    await yamlView.isLoaded();
    await element(by.buttonText('Edit Form')).click();
    await browser.wait(until.presenceOf($('#metadata\\.name')));

    expect($$('.co-create-operand__form-group').count()).not.toEqual(0);
  });

  it('pre-populates form values using sample operand from ClusterServiceVersion', async() => {
    $$('.co-create-operand__form-group').each(async(input) => {
      await browser.actions().mouseMove(input).perform();

      const label = await input.$('.form-label').getText();
      const descriptor = testCSV.spec.customresourcedefinitions.owned[0].specDescriptors.find(d => d.displayName === label);
      if (isUndefined(descriptor)) {
        const hasProperty = (properties) => find(properties, (_, nestedKey) => startCase(nestedKey) === label);
        expect(find(testCRD.spec.validation.openAPIV3Schema.properties.spec.properties as any,
          (p, k) => startCase(k) === label || hasProperty(p.properties)))
          .toBeDefined();
      } else {
        const helpText = await input.element(by.id(`${descriptor.path}__description`)).getText();

        expect(descriptor).toBeDefined();
        expect(label).toEqual(descriptor.displayName);
        expect(helpText).toEqual(descriptor.description);

        if (await inputValueFor(descriptor['x-descriptors'][0])(input) !== null) {
          const value = await inputValueFor(descriptor['x-descriptors'][0])(input);

          expect(value).toEqual(get(testCR, ['spec', descriptor.path]));
        }
      }
    });
  });

  it('renders groups of fields together from specDescriptors', async() => {
    expect(element(by.id(SpecCapability.fieldGroup.concat('specDescriptorFieldGroup'))).isDisplayed()).toBe(true);
  });

  it('renders groups of fields together from nested properties in OpenAPI schema', async() => {
    expect(element(by.id(SpecCapability.fieldGroup.concat('fieldGroup'))).isDisplayed()).toBe(true);
    expect(element(by.id(SpecCapability.fieldGroup.concat('hiddenFieldGroup'))).isPresent()).toBe(false);
  });

  it('prevents creation and displays validation errors for required or non-empty fields', async() => {
    await $('#number').sendKeys('4000');
    await element(by.buttonText('Create')).click();

    expect($('.co-error').getText()).toContain('Must be less than 4');
    expect($('.pf-c-alert').isPresent()).toBe(true);

    await $('#password').sendKeys('!@#$%^&*()');
    await element(by.buttonText('Create')).click();

    expect($('.co-error').getText()).toContain('Does not match required pattern');
    expect($('.pf-c-alert').isPresent()).toBe(true);
  });

  it('successfully creates operand using form', async() => {
    await browser.refresh();
    await yamlView.isLoaded();
    await element(by.buttonText('Edit Form')).click();
    await browser.wait(until.presenceOf($('#metadata\\.name')));
    await element(by.buttonText('Create')).click();
    await crudView.isLoaded();

    expect(crudView.resourceTitle.isPresent()).toBe(true);
  });
});
