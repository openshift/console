import * as _ from 'lodash';
import { DeploymentModel } from '@console/internal/models';
import { K8sResourceKind } from '@console/internal/module/k8s';
import { checkExistingServiceBinding } from '../service-binding-modal-launcher-utils';

const serviceBindings: K8sResourceKind[] = [
  {
    apiVersion: 'binding.operators.coreos.com/v1alpha1',
    kind: 'ServiceBinding',
    metadata: {
      annotations: { 'servicebinding.io/requester': 'xyz' },
      name: 'dasd',
      namespace: 'my-postgresql',
      resourceVersion: '106606',
      uid: '64c9e1f8-6fd9-44e6-9085-7795e9908f42',
    },
    spec: {
      application: {
        group: 'apps',
        name: 'spring-petclinic-rest',
        resource: 'deployments',
        version: 'v1',
      },
      bindAsFiles: true,
      detectBindingResources: true,
      services: [
        {
          group: 'rhoas.redhat.com',
          kind: 'KafkaConnection',
          name: 'example',
          version: 'v1alpha1',
        },
      ],
    },
    status: {
      conditions: [],
      secret: '',
    },
  },
  {
    apiVersion: 'binding.operators.coreos.com/v1alpha1',
    kind: 'ServiceBinding',
    metadata: {
      annotations: { 'servicebinding.io/requester': 'abc' },
      name: 'spring-petclinic-rest',
      namespace: 'my-postgresql',
      resourceVersion: '97727',
      uid: 'bc93c81c-4717-4170-a9d5-e15f3dc3ec6e',
    },
    spec: {
      application: {
        group: 'apps',
        name: 'spring-petclinic-rest',
        resource: 'deployments',
        version: 'v1',
      },
      bindAsFiles: true,
      detectBindingResources: true,
      services: [
        {
          group: 'postgres-operator.crunchydata.com',
          kind: 'PostgresCluster',
          name: 'hippo',
          version: 'v1beta1',
        },
        {
          group: '',
          kind: 'Secret',
          name: 'hippo-pguser-hippo',
          version: 'v1',
        },
      ],
    },
    status: {
      conditions: [],
      secret: '',
    },
  },
];
const sourceResource: K8sResourceKind = {
  apiVersion: 'apps/v1',
  kind: 'Deployment',
  metadata: {
    annotations: {
      'deployment.kubernetes.io/revision': '2',
    },
    labels: {
      app: 'spring-petclinic-rest',
    },
    name: 'spring-petclinic-rest',
    namespace: 'my-postgresql',
    resourceVersion: '97782',
    uid: '84640d51-b301-40a0-a315-3df93fd1c1dd',
  },
  spec: {},
  status: {},
};

const sourceResource2: K8sResourceKind = {
  apiVersion: 'apps/v1',
  kind: 'DeploymentConfig',
  metadata: {
    annotations: {
      'app.openshift.io/vcs-ref': '',
      'app.openshift.io/vcs-uri': 'https://github.com/sclorg/nodejs-ex.git',
      'openshift.io/generated-by': 'OpenShiftWebConsole',
    },
    labels: {
      app: 'nodejs-ex-git',
      'app.kubernetes.io/component': 'nodejs-ex-git',
      'app.kubernetes.io/instance': 'nodejs-ex-git',
      'app.kubernetes.io/name': 'nodejs-ex-git',
      'app.openshift.io/runtime': 'nodejs',
      'app.openshift.io/runtime-version': '14-ubi8',
    },
    name: 'nodejs-ex-git',
    namespace: 'my-postgresql',
    resourceVersion: '119804',
    uid: '95803b2d-f59e-4ee6-b9a7-108d88a66c38',
  },
  spec: {},
  status: {},
};

const targetService: K8sResourceKind = {
  apiVersion: 'rhoas.redhat.com/v1alpha1',
  kind: 'KafkaConnection',
  metadata: {
    labels: {
      'app.kubernetes.io/component': 'external-service',
      'app.kubernetes.io/managed-by': 'rhoas',
    },
    name: 'example',
    namespace: 'my-postgresql',
    resourceVersion: '97614',
    uid: '0628ee53-3ac8-4252-ac5e-ada5133bd183',
  },
};

describe('service-binding-modal-launcher-utils', () => {
  it('should return true if service binding between source and target already exist', async () => {
    const isServiceBindingAvailable = !_.isEmpty(
      checkExistingServiceBinding(serviceBindings, sourceResource, targetService, DeploymentModel),
    );
    expect(isServiceBindingAvailable).toEqual(true);
  });

  it('should return false if service binding between source and target does not already exist', async () => {
    const isServiceBindingAvailable = !_.isEmpty(
      checkExistingServiceBinding(serviceBindings, sourceResource2, targetService, DeploymentModel),
    );
    expect(isServiceBindingAvailable).toEqual(false);
  });
});
