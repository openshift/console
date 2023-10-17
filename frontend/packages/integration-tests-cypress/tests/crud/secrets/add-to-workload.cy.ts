import * as _ from 'lodash';
import { DeploymentKind } from '@console/internal/module/k8s';
import { checkErrors, testName } from '../../../support';
import { modal } from '../../../views/modal';
import { secrets } from '../../../views/secret';

const secretName = 'test-secret';
const resourceName = 'test-deploy';
const resourceKind = 'deployment';
const envPrefix = 'env-';
const mountPath = '/tmp/testdata';
const deployment: DeploymentKind = {
  apiVersion: 'apps/v1',
  kind: 'Deployment',
  metadata: {
    name: resourceName,
    namespace: testName,
  },
  spec: {
    selector: {
      matchLabels: {
        test: 'add-secret-to-workload',
      },
    },
    template: {
      metadata: {
        labels: {
          test: 'add-secret-to-workload',
        },
      },
      spec: {
        containers: [
          {
            name: 'httpd',
            image: 'image-registry.openshift-image-registry.svc:5000/openshift/httpd:latest',
          },
        ],
      },
    },
  },
};

describe('Add Secret to Workloads', () => {
  before(() => {
    cy.login();
    cy.createProjectWithCLI(testName);
    cy.exec(`echo '${JSON.stringify(deployment)}' | kubectl create -n ${testName} -f -`);
    cy.exec(
      `kubectl create secret generic ${secretName} --from-literal=key1=supersecret -n ${testName}`,
    );
  });

  beforeEach(() => {
    cy.visit(`/k8s/ns/${testName}/secrets/${secretName}`);
  });

  afterEach(() => {
    checkErrors();
  });

  after(() => {
    cy.deleteProjectWithCLI(testName);
  });

  it(`Adds Secret to Deployment as Environment Variables`, () => {
    cy.log('Add Secret');
    secrets.addSecretToWorkload(resourceName);
    cy.byTestID('Environment variables-radio-input').click();
    cy.byTestID('add-secret-to-workload-prefix').type(envPrefix);
    modal.submitShouldBeEnabled();
    modal.submit();

    cy.log('Verify Secret');
    secrets.getResourceJSON(resourceName, testName, resourceKind).then((resourceJSON) => {
      const resource = JSON.parse(resourceJSON.stdout);
      const name = _.get(
        resource,
        'spec.template.spec.containers[0].envFrom[0].secretRef.name',
        undefined,
      );
      expect(name).to.equal(secretName);
      const prefix = _.get(
        resource,
        'spec.template.spec.containers[0].envFrom[0].prefix',
        undefined,
      );
      expect(prefix).to.equal(envPrefix);
    });
  });

  it(`Adds Secret to Deployment as Volume`, () => {
    cy.log('Add Secret');
    secrets.addSecretToWorkload(resourceName);
    cy.byTestID('Volume-radio-input').click();
    cy.byTestID('add-secret-to-workload-mountpath').type(mountPath);
    modal.submitShouldBeEnabled();
    modal.submit();

    cy.log('Verify Secret');
    secrets.getResourceJSON(resourceName, testName, resourceKind).then((resourceJSON) => {
      const resource = JSON.parse(resourceJSON.stdout);
      const name = _.get(
        resource,
        'spec.template.spec.containers[0].volumeMounts[0].name',
        undefined,
      );
      expect(name).to.equal(secretName);
      const mp = _.get(
        resource,
        'spec.template.spec.containers[0].volumeMounts[0].mountPath',
        undefined,
      );
      expect(mp).to.equal(mountPath);
    });
  });
});
