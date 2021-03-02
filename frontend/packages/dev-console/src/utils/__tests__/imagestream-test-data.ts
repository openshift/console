import { K8sResourceKind } from '@console/internal/module/k8s';
import { ImageTag } from '../imagestream-utils';

export const ImageStreamTagData: ImageTag = {
  kind: 'ImageStreamTag',
  apiVersion: 'image.openshift.io/v1',
  metadata: {
    name: 'os-test-image:latest',
    namespace: 'rhd-devproject',
    uid: '0a7cfc61-03ed-11ea-a8ff-0a580a80013c',
    resourceVersion: '808616',
    creationTimestamp: '2019-11-10T19:05:22Z',
    labels: {
      app: 'os-test-image',
      'app.kubernetes.io/component': 'os-test-image',
      'app.kubernetes.io/instance': 'os-test-image',
      'app.kubernetes.io/part-of': 'php-app',
    },
    annotations: {
      'openshift.io/generated-by': 'OpenShiftWebConsole',
      'openshift.io/imported-from': 'openshift/hello-openshift',
    },
  },
  tag: {
    name: 'latest',
    annotations: {
      'openshift.io/generated-by': 'OpenShiftWebConsole',
      'openshift.io/imported-from': 'openshift/hello-openshift',
    },
    from: {
      kind: 'DockerImage',
      name: 'openshift/hello-openshift',
    },
    generation: 2,
    importPolicy: {},
    referencePolicy: {
      type: 'Local',
    },
  },
  generation: 2,
  lookupPolicy: {
    local: false,
  },
  annotations: {
    'openshift.io/generated-by': 'OpenShiftWebConsole',
    'openshift.io/imported-from': 'openshift/hello-openshift',
  },
  name: 'test',
  image: {
    metadata: {
      name: 'sha256:aaea76ff622d2f8bcb32e538e7b3cd0ef6d291953f3e7c9f556c1ba5baf47e2e',
      uid: '6953ea51-02d3-11ea-a8ff-0a580a80013c',
      resourceVersion: '680753',
      creationTimestamp: '2019-11-09T09:29:21Z',
      annotations: {
        'image.openshift.io/dockerLayersOrder': 'ascending',
        'openshift.io/generated-by': 'OpenShiftWebConsole',
        'openshift.io/imported-from': 'openshift/hello-openshift',
      },
    },
    dockerImageReference:
      'openshift/hello-openshift@sha256:aaea76ff622d2f8bcb32e538e7b3cd0ef6d291953f3e7c9f556c1ba5baf47e2e',
    dockerImageMetadata: {
      kind: 'DockerImage',
      apiVersion: '1.0',
      Id: 'sha256:7af3297a3fb4487b740ed6798163f618e6eddea1ee5fa0ba340329fcae31c8f6',
      Created: '2018-04-18T10:38:59Z',
      Container: '64ede50d59ead12e9e867f6c48681b3cde9e0c920db433666fc20cd7c322de02',
      ContainerConfig: {
        Hostname: '64ede50d59ea',
        Image: 'scratchljl6nbgci72oxgam2jh83pe3',
        Entrypoint: ['/bin/sh', '-c', '# NOP'],
      },
      DockerVersion: '1.13.1',
      Author: 'Jessica Forrester <jforrest@redhat.com>',
      Config: {
        User: '1001',
        ExposedPorts: {
          '8080/tcp': {},
          '8888/tcp': {},
        },
        Env: ['PATH=/usr/local/sbin:/usr/local/bin:/usr/sbin:/usr/bin:/sbin:/bin'],
        Entrypoint: ['/hello-openshift'],
      },
      Architecture: 'amd64',
      Size: 2168976,
    },
    dockerImageMetadataVersion: '1.0',
    dockerImageLayers: [
      {
        name: 'sha256:4f4fb700ef54461cfa02571ae0db9a0dc1e0cdb5577484a6d75e68dc38e8acc1',
        size: 32,
        mediaType: 'application/vnd.docker.image.rootfs.diff.tar.gzip',
      },
      {
        name: 'sha256:8b32988996c5d776076ea3cd672855f6d0faac87510064a15cce4bd02cdc9d13',
        size: 2167576,
        mediaType: 'application/vnd.docker.image.rootfs.diff.tar.gzip',
      },
    ],
    dockerImageManifestMediaType: 'application/vnd.docker.distribution.manifest.v2+json',
  },
};

export const sampleImageStreams: K8sResourceKind[] = [
  {
    metadata: {
      annotations: { 'openshift.io/image.dockerRepositoryCheck': '2019-11-10T19:24:36Z' },
      resourceVersion: '811634',
      name: 'os-test-image',
      uid: 'b8c35c06-03ef-11ea-a8ff-0a580a80013c',
      creationTimestamp: '2019-11-10T19:24:32Z',
      generation: 2,
      namespace: 'project-1',
      labels: {
        app: 'os-test-image',
        'app.kubernetes.io/component': 'os-test-image',
        'app.kubernetes.io/instance': 'os-test-image',
        'app.kubernetes.io/part-of': 'os-test-image-app',
      },
    },
    spec: {
      lookupPolicy: { local: false },
      tags: [
        {
          name: 'latest',
          annotations: {
            'openshift.io/generated-by': 'OpenShiftWebConsole',
            'openshift.io/imported-from': 'os-test-image',
          },
          from: { kind: 'DockerImage', name: 'os-test-image' },
          generation: 2,
          importPolicy: {},
          referencePolicy: { type: 'Local' },
        },
      ],
    },
    status: {
      dockerImageRepository:
        'image-registry.openshift-image-registry.svc:5000/project-1/os-test-image',
      publicDockerImageRepository:
        'default-route-openshift-image-registry.apps-crc.testing/project-1/os-test-image',
      tags: [
        {
          tag: 'latest',
          items: null,
          conditions: [
            {
              type: 'ImportSuccess',
              status: 'False',
              lastTransitionTime: '2019-11-10T19:24:36Z',
              reason: 'Unauthorized',
              message: 'you may not have access to the container image "os-test-image:latest"',
              generation: 2,
            },
          ],
        },
      ],
    },
  },
  {
    metadata: {
      annotations: { 'openshift.io/image.dockerRepositoryCheck': '2019-11-10T19:24:36Z' },
      resourceVersion: '811634',
      name: 'os-test-image',
      uid: 'b8c35c06-03ef-11ea-a8ff-0a580a80013c',
      creationTimestamp: '2019-11-10T19:24:32Z',
      generation: 2,
      namespace: 'project-2',
      labels: {
        app: 'os-test-image',
        'app.kubernetes.io/component': 'os-test-image',
        'app.kubernetes.io/instance': 'os-test-image',
        'app.kubernetes.io/part-of': 'os-test-image-app',
      },
    },
    spec: {
      lookupPolicy: { local: false },
      tags: [
        {
          name: 'latest',
          annotations: {
            'openshift.io/generated-by': 'OpenShiftWebConsole',
            'openshift.io/imported-from': 'os-test-image',
          },
          from: { kind: 'DockerImage', name: 'os-test-image' },
          generation: 2,
          importPolicy: {},
          referencePolicy: { type: 'Local' },
        },
      ],
    },
    status: {
      dockerImageRepository:
        'image-registry.openshift-image-registry.svc:5000/project-2/os-test-image',
      publicDockerImageRepository:
        'default-route-openshift-image-registry.apps-crc.testing/project-2/os-test-image',
      tags: [
        {
          tag: 'latest',
          items: null,
          conditions: [
            {
              type: 'ImportSuccess',
              status: 'False',
              lastTransitionTime: '2019-11-10T19:24:36Z',
              reason: 'Unauthorized',
              message: 'you may not have access to the container image "os-test-image:latest"',
              generation: 2,
            },
          ],
        },
      ],
    },
  },
];
