import { FirehoseResult } from '@console/internal/components/utils';
import {
  DeploymentKind,
  PodKind,
  K8sResourceConditionStatus,
  referenceForModel,
  K8sKind,
  K8sResourceKind,
} from '@console/internal/module/k8s';
import { TopologyDataResources } from '@console/topology/src/topology-types';
import { SERVERLESS_FUNCTION_LABEL } from '../../const';
import {
  ConfigurationModel,
  RouteModel,
  RevisionModel,
  ServiceModel,
  EventSourceCronJobModel,
  EventSourceContainerModel,
  EventSourceCamelModel,
  EventSourceKafkaModel,
  EventSourcePingModel,
  EventSourceSinkBindingModel,
  EventSourceApiServerModel,
  EventingSubscriptionModel,
  EventingIMCModel,
  EventingBrokerModel,
  EventingTriggerModel,
  CamelKameletBindingModel,
} from '../../models';
import {
  RevisionKind,
  ConditionTypes,
  RouteKind,
  ServiceKind as knativeServiceKind,
  EventSubscriptionKind,
  EventChannelKind,
  EventTriggerKind,
} from '../../types';
import { URI_KIND } from '../const';
import { KnativeServiceOverviewItem, KnativeTopologyDataObject, NodeType } from '../topology-types';

export const sampleDeploymentsCamelConnector: FirehoseResult<DeploymentKind[]> = {
  loaded: true,
  loadError: '',
  data: [
    {
      kind: 'Deployment',
      apiVersion: 'apps/v1',
      metadata: {
        annotations: { 'deployment.kubernetes.io/revision': '1' },
        resourceVersion: '466744',
        name: 'overlayimage-f56hh',
        uid: '644ee7d3-83ce-442c-b478-492bc92d8959',
        creationTimestamp: '2020-07-23T08:00:44Z',
        generation: 1,
        namespace: 'testproject1',
        ownerReferences: [
          {
            apiVersion: 'camel.apache.org/v1',
            kind: 'Integration',
            name: 'overlayimage-f56hh',
            uid: 'c1b802c8-42ff-4224-824f-5d454814ab01',
            controller: true,
            blockOwnerDeletion: true,
          },
        ],
        labels: {
          'camel.apache.org/generation': '1',
          'camel.apache.org/integration': 'overlayimage-f56hh',
        },
      },
      spec: {
        replicas: 1,
        selector: {
          matchLabels: { 'camel.apache.org/integration': 'overlayimage-f56hh' },
        },
        template: {
          metadata: {
            creationTimestamp: null,
            labels: { 'camel.apache.org/integration': 'overlayimage-f56hh' },
          },
          spec: {
            volumes: [
              {
                name: 'i-source-000',
                configMap: {
                  name: 'overlayimage-f56hh-source-000',
                  items: [{ key: 'content', path: 'flow.yaml' }],
                  defaultMode: 420,
                },
              },
              {
                name: 'application-properties',
                configMap: {
                  name: 'overlayimage-f56hh-application-properties',
                  items: [{ key: 'application.properties', path: 'application.properties' }],
                  defaultMode: 420,
                },
              },
            ],
            containers: [
              {
                resources: {},
                terminationMessagePath: '/dev/termination-log',
                name: 'integration',
                command: ['/bin/sh', '-c'],
                env: [
                  { name: 'CAMEL_K_DIGEST', value: 'vUzNeM-0LVeJNAd5q9DNRZ4mRiM5PY7PICcRXFl3EI3Y' },
                  {
                    name: 'CAMEL_K_ROUTES',
                    value:
                      'file:/etc/camel/sources/i-source-000/flow.yaml?language=yaml&interceptors=knative-source',
                  },
                  { name: 'CAMEL_K_CONF', value: '/etc/camel/conf/application.properties' },
                  { name: 'CAMEL_K_CONF_D', value: '/etc/camel/conf.d' },
                  {
                    name: 'CAMEL_KNATIVE_CONFIGURATION',
                    value:
                      '{"services":[{"type":"endpoint","name":"sink","host":"messages-kn-channel.testproject1.svc.cluster.local","port":80,"metadata":{"camel.endpoint.kind":"sink","ce.override.ce-source":"camel-source:testproject1/overlayimage","knative.apiVersion":"","knative.kind":""}}]}',
                  },
                  { name: 'CAMEL_K_VERSION', value: '1.0.1' },
                  { name: 'CAMEL_K_INTEGRATION', value: 'overlayimage-f56hh' },
                  { name: 'CAMEL_K_RUNTIME_VERSION', value: '1.3.0' },
                  { name: 'CAMEL_K_MOUNT_PATH_CONFIGMAPS', value: '/etc/camel/conf.d/_configmaps' },
                  { name: 'CAMEL_K_MOUNT_PATH_SECRETS', value: '/etc/camel/conf.d/_secrets' },
                  {
                    name: 'NAMESPACE',
                    valueFrom: { fieldRef: { apiVersion: 'v1', fieldPath: 'metadata.namespace' } },
                  },
                  {
                    name: 'POD_NAME',
                    valueFrom: { fieldRef: { apiVersion: 'v1', fieldPath: 'metadata.name' } },
                  },
                ],
                volumeMounts: [
                  { name: 'i-source-000', mountPath: '/etc/camel/sources/i-source-000' },
                  { name: 'application-properties', mountPath: '/etc/camel/conf' },
                ],
                terminationMessagePolicy: 'File',
                image:
                  'image-registry.openshift-image-registry.svc:5000/testproject1/camel-k-kit-bsck6ptket36jkvbvt9g@sha256:53eab3d851061862ce86fd64d0ca2fb05562e2a707dd5341cbb8067ba8d27831',
                workingDir: '/deployments',
                args: [
                  'echo exec java -cp ./resources:/etc/camel/conf:/etc/camel/resources:/etc/camel/sources/i-source-000:dependencies/com.fasterxml.jackson.core.jackson-annotations-2.10.4.jar:dependencies/com.fasterxml.jackson.core.jackson-core-2.10.4.jar:dependencies/com.fasterxml.jackson.core.jackson-databind-2.10.4.jar:dependencies/com.fasterxml.jackson.dataformat.jackson-dataformat-yaml-2.10.4.jar:dependencies/com.fasterxml.jackson.datatype.jackson-datatype-jdk8-2.10.4.jar:dependencies/com.fasterxml.jackson.datatype.jackson-datatype-jsr310-2.10.4.jar:dependencies/com.sun.activation.javax.activation-1.2.0.jar:dependencies/com.typesafe.netty.netty-reactive-streams-2.0.4.jar:dependencies/io.netty.netty-buffer-4.1.46.Final.jar:dependencies/io.netty.netty-codec-4.1.46.Final.jar:dependencies/io.netty.netty-codec-dns-4.1.48.Final.jar:dependencies/io.netty.netty-codec-http-4.1.46.Final.jar:dependencies/io.netty.netty-codec-http2-4.1.48.Final.jar:dependencies/io.netty.netty-codec-socks-4.1.46.Final.jar:dependencies/io.netty.netty-common-4.1.46.Final.jar:dependencies/io.netty.netty-handler-4.1.46.Final.jar:dependencies/io.netty.netty-handler-proxy-4.1.46.Final.jar:dependencies/io.netty.netty-resolver-4.1.46.Final.jar:dependencies/io.netty.netty-resolver-dns-4.1.48.Final.jar:dependencies/io.netty.netty-transport-4.1.46.Final.jar:dependencies/io.netty.netty-transport-native-epoll-4.1.46.Final-linux-x86_64.jar:dependencies/io.netty.netty-transport-native-kqueue-4.1.46.Final-osx-x86_64.jar:dependencies/io.netty.netty-transport-native-unix-common-4.1.46.Final.jar:dependencies/io.vertx.vertx-auth-common-3.9.0.jar:dependencies/io.vertx.vertx-bridge-common-3.9.0.jar:dependencies/io.vertx.vertx-core-3.9.0.jar:dependencies/io.vertx.vertx-web-3.9.0.jar:dependencies/io.vertx.vertx-web-client-3.9.0.jar:dependencies/io.vertx.vertx-web-common-3.9.0.jar:dependencies/javax.xml.bind.jaxb-api-2.3.0.jar:dependencies/org.apache.camel.camel-api-3.3.0.jar:dependencies/org.apache.camel.camel-base-3.3.0.jar:dependencies/org.apache.camel.camel-bean-3.3.0.jar:dependencies/org.apache.camel.camel-cloud-3.3.0.jar:dependencies/org.apache.camel.camel-core-engine-3.3.0.jar:dependencies/org.apache.camel.camel-core-languages-3.3.0.jar:dependencies/org.apache.camel.camel-jackson-3.3.0.jar:dependencies/org.apache.camel.camel-log-3.3.0.jar:dependencies/org.apache.camel.camel-main-3.3.0.jar:dependencies/org.apache.camel.camel-management-api-3.3.0.jar:dependencies/org.apache.camel.camel-platform-http-3.3.0.jar:dependencies/org.apache.camel.camel-platform-http-vertx-3.3.0.jar:dependencies/org.apache.camel.camel-support-3.3.0.jar:dependencies/org.apache.camel.camel-telegram-3.3.0.jar:dependencies/org.apache.camel.camel-util-3.3.0.jar:dependencies/org.apache.camel.camel-webhook-3.3.0.jar:dependencies/org.apache.camel.k.camel-k-loader-yaml-1.3.0.jar:dependencies/org.apache.camel.k.camel-k-loader-yaml-common-1.3.0.jar:dependencies/org.apache.camel.k.camel-k-runtime-core-1.3.0.jar:dependencies/org.apache.camel.k.camel-k-runtime-http-1.3.0.jar:dependencies/org.apache.camel.k.camel-k-runtime-knative-1.3.0.jar:dependencies/org.apache.camel.k.camel-k-runtime-main-1.3.0.jar:dependencies/org.apache.camel.k.camel-knative-1.3.0.jar:dependencies/org.apache.camel.k.camel-knative-api-1.3.0.jar:dependencies/org.apache.camel.k.camel-knative-http-1.3.0.jar:dependencies/org.apache.logging.log4j.log4j-api-2.13.3.jar:dependencies/org.apache.logging.log4j.log4j-core-2.13.3.jar:dependencies/org.apache.logging.log4j.log4j-slf4j-impl-2.13.3.jar:dependencies/org.asynchttpclient.async-http-client-2.11.0.jar:dependencies/org.asynchttpclient.async-http-client-netty-utils-2.11.0.jar:dependencies/org.reactivestreams.reactive-streams-1.0.3.jar:dependencies/org.slf4j.slf4j-api-1.7.30.jar:dependencies/org.yaml.snakeyaml-1.26.jar org.apache.camel.k.main.Application && exec java -cp ./resources:/etc/camel/conf:/etc/camel/resources:/etc/camel/sources/i-source-000:dependencies/com.fasterxml.jackson.core.jackson-annotations-2.10.4.jar:dependencies/com.fasterxml.jackson.core.jackson-core-2.10.4.jar:dependencies/com.fasterxml.jackson.core.jackson-databind-2.10.4.jar:dependencies/com.fasterxml.jackson.dataformat.jackson-dataformat-yaml-2.10.4.jar:dependencies/com.fasterxml.jackson.datatype.jackson-datatype-jdk8-2.10.4.jar:dependencies/com.fasterxml.jackson.datatype.jackson-datatype-jsr310-2.10.4.jar:dependencies/com.sun.activation.javax.activation-1.2.0.jar:dependencies/com.typesafe.netty.netty-reactive-streams-2.0.4.jar:dependencies/io.netty.netty-buffer-4.1.46.Final.jar:dependencies/io.netty.netty-codec-4.1.46.Final.jar:dependencies/io.netty.netty-codec-dns-4.1.48.Final.jar:dependencies/io.netty.netty-codec-http-4.1.46.Final.jar:dependencies/io.netty.netty-codec-http2-4.1.48.Final.jar:dependencies/io.netty.netty-codec-socks-4.1.46.Final.jar:dependencies/io.netty.netty-common-4.1.46.Final.jar:dependencies/io.netty.netty-handler-4.1.46.Final.jar:dependencies/io.netty.netty-handler-proxy-4.1.46.Final.jar:dependencies/io.netty.netty-resolver-4.1.46.Final.jar:dependencies/io.netty.netty-resolver-dns-4.1.48.Final.jar:dependencies/io.netty.netty-transport-4.1.46.Final.jar:dependencies/io.netty.netty-transport-native-epoll-4.1.46.Final-linux-x86_64.jar:dependencies/io.netty.netty-transport-native-kqueue-4.1.46.Final-osx-x86_64.jar:dependencies/io.netty.netty-transport-native-unix-common-4.1.46.Final.jar:dependencies/io.vertx.vertx-auth-common-3.9.0.jar:dependencies/io.vertx.vertx-bridge-common-3.9.0.jar:dependencies/io.vertx.vertx-core-3.9.0.jar:dependencies/io.vertx.vertx-web-3.9.0.jar:dependencies/io.vertx.vertx-web-client-3.9.0.jar:dependencies/io.vertx.vertx-web-common-3.9.0.jar:dependencies/javax.xml.bind.jaxb-api-2.3.0.jar:dependencies/org.apache.camel.camel-api-3.3.0.jar:dependencies/org.apache.camel.camel-base-3.3.0.jar:dependencies/org.apache.camel.camel-bean-3.3.0.jar:dependencies/org.apache.camel.camel-cloud-3.3.0.jar:dependencies/org.apache.camel.camel-core-engine-3.3.0.jar:dependencies/org.apache.camel.camel-core-languages-3.3.0.jar:dependencies/org.apache.camel.camel-jackson-3.3.0.jar:dependencies/org.apache.camel.camel-log-3.3.0.jar:dependencies/org.apache.camel.camel-main-3.3.0.jar:dependencies/org.apache.camel.camel-management-api-3.3.0.jar:dependencies/org.apache.camel.camel-platform-http-3.3.0.jar:dependencies/org.apache.camel.camel-platform-http-vertx-3.3.0.jar:dependencies/org.apache.camel.camel-support-3.3.0.jar:dependencies/org.apache.camel.camel-telegram-3.3.0.jar:dependencies/org.apache.camel.camel-util-3.3.0.jar:dependencies/org.apache.camel.camel-webhook-3.3.0.jar:dependencies/org.apache.camel.k.camel-k-loader-yaml-1.3.0.jar:dependencies/org.apache.camel.k.camel-k-loader-yaml-common-1.3.0.jar:dependencies/org.apache.camel.k.camel-k-runtime-core-1.3.0.jar:dependencies/org.apache.camel.k.camel-k-runtime-http-1.3.0.jar:dependencies/org.apache.camel.k.camel-k-runtime-knative-1.3.0.jar:dependencies/org.apache.camel.k.camel-k-runtime-main-1.3.0.jar:dependencies/org.apache.camel.k.camel-knative-1.3.0.jar:dependencies/org.apache.camel.k.camel-knative-api-1.3.0.jar:dependencies/org.apache.camel.k.camel-knative-http-1.3.0.jar:dependencies/org.apache.logging.log4j.log4j-api-2.13.3.jar:dependencies/org.apache.logging.log4j.log4j-core-2.13.3.jar:dependencies/org.apache.logging.log4j.log4j-slf4j-impl-2.13.3.jar:dependencies/org.asynchttpclient.async-http-client-2.11.0.jar:dependencies/org.asynchttpclient.async-http-client-netty-utils-2.11.0.jar:dependencies/org.reactivestreams.reactive-streams-1.0.3.jar:dependencies/org.slf4j.slf4j-api-1.7.30.jar:dependencies/org.yaml.snakeyaml-1.26.jar org.apache.camel.k.main.Application',
                ],
              },
            ],
            restartPolicy: 'Always',
            terminationGracePeriodSeconds: 30,
            dnsPolicy: 'ClusterFirst',
            securityContext: {},
            schedulerName: 'default-scheduler',
          },
        },
        strategy: {
          type: 'RollingUpdate',
          rollingUpdate: { maxUnavailable: '25%', maxSurge: '25%' },
        },
        revisionHistoryLimit: 10,
        progressDeadlineSeconds: 600,
      },
      status: {
        observedGeneration: 1,
        replicas: 1,
        updatedReplicas: 1,
        readyReplicas: 1,
        availableReplicas: 1,
        conditions: [
          {
            type: 'Available',
            status: 'True',
            lastUpdateTime: '2020-07-23T08:00:59Z',
            lastTransitionTime: '2020-07-23T08:00:59Z',
            reason: 'MinimumReplicasAvailable',
            message: 'Deployment has minimum availability.',
          },
          {
            type: 'Progressing',
            status: 'True',
            lastUpdateTime: '2020-07-23T08:00:59Z',
            lastTransitionTime: '2020-07-23T08:00:44Z',
            reason: 'NewReplicaSetAvailable',
            message: 'ReplicaSet "overlayimage-f56hh-76d96fcc86" has successfully progressed.',
          },
        ],
      },
    },
  ],
};

export const sampleKnativeDeployments: FirehoseResult<DeploymentKind[]> = {
  loaded: true,
  loadError: '',
  data: [
    {
      apiVersion: 'apps/v1',
      kind: 'Deployment',
      metadata: {
        annotations: {
          'deployment.kubernetes.io/revision': '1',
        },
        resourceVersion: '726179',
        name: 'default-ingress',
        uid: 'bccad3e4-8ce0-11e9-bb7b-0ebb55b110b8',
        creationTimestamp: '2019-04-22T11:35:43Z',
        generation: 2,
        namespace: 'testproject1',
        labels: {
          app: 'overlayimage-9jsl8',
          'serving.knative.dev/configuration': 'overlayimage',
          'serving.knative.dev/configurationGeneration': '1',
          'serving.knative.dev/revision': 'overlayimage-9jsl8',
          'serving.knative.dev/revisionUID': 'bca0fb96-8ce0-11e9-bb7b-0ebb55b110b8',
          'serving.knative.dev/service': 'overlayimage',
        },
        ownerReferences: [
          {
            apiVersion: `${RevisionModel.apiGroup}/${RevisionModel.apiVersion}`,
            kind: RevisionModel.kind,
            name: 'overlayimage-fdqsf',
            uid: '02c34a0e-9638-11e9-b134-06a61d886b62',
            controller: true,
            blockOwnerDeletion: true,
          },
        ],
      },
      spec: {
        replicas: 0,
        selector: {
          matchLabels: {
            'serving.knative.dev/revisionUID': 'bca0fb96-8ce0-11e9-bb7b-0ebb55b110b8',
          },
        },
        template: {
          metadata: {
            creationTimestamp: null,
            labels: {
              app: 'overlayimage-9jsl8',
              'serving.knative.dev/configuration': 'overlayimage',
              'serving.knative.dev/configurationGeneration': '1',
              'serving.knative.dev/revision': 'overlayimage-9jsl8',
              'serving.knative.dev/revisionUID': 'bca0fb96-8ce0-11e9-bb7b-0ebb55b110b8',
              'serving.knative.dev/service': 'overlayimage',
            },
            annotations: {
              'sidecar.istio.io/inject': 'true',
              'traffic.sidecar.istio.io/includeOutboundIPRanges': '172.30.0.0/16',
            },
          },
          spec: {
            containers: [],
          },
        },
        strategy: {
          type: 'RollingUpdate',
          rollingUpdate: {
            maxUnavailable: '25%',
            maxSurge: '25%',
          },
        },
        revisionHistoryLimit: 10,
        progressDeadlineSeconds: 600,
      },
      status: {},
    },
    {
      apiVersion: 'apps/v1',
      kind: 'Deployment',
      metadata: {
        annotations: {
          'deployment.kubernetes.io/revision': '1',
        },
        resourceVersion: '726179',
        name: 'default-ingress',
        uid: 'bccad3e4-8ce0-11e9-bb7b-0ebb55b110b8',
        namespace: 'testproject1',
        labels: {
          'eventing.knative.dev/broker': 'default',
        },
        ownerReferences: [
          {
            apiVersion: `${EventingBrokerModel.apiGroup}/${EventingBrokerModel.apiVersion}`,
            kind: EventingBrokerModel.kind,
            name: 'default',
            uid: '02c34a0e-9638-1110-b134-06a61d886b62',
            controller: true,
            blockOwnerDeletion: true,
          },
        ],
      },
      spec: {
        replicas: 0,
        selector: {
          matchLabels: {
            'serving.knative.dev/revisionUID': 'bca0fb96-8ce0-11e9-bb7b-0ebb55b110b8',
          },
        },
        template: {
          metadata: {
            creationTimestamp: null,
            labels: {
              app: 'overlayimage-9jsl8',
              'serving.knative.dev/configuration': 'overlayimage',
              'serving.knative.dev/configurationGeneration': '1',
              'serving.knative.dev/revision': 'overlayimage-9jsl8',
              'serving.knative.dev/revisionUID': 'bca0fb96-8ce0-11e9-bb7b-0ebb55b110b8',
              'serving.knative.dev/service': 'overlayimage',
            },
            annotations: {
              'sidecar.istio.io/inject': 'true',
              'traffic.sidecar.istio.io/includeOutboundIPRanges': '172.30.0.0/16',
            },
          },
          spec: {
            containers: [],
          },
        },
        strategy: {
          type: 'RollingUpdate',
          rollingUpdate: {
            maxUnavailable: '25%',
            maxSurge: '25%',
          },
        },
        revisionHistoryLimit: 10,
        progressDeadlineSeconds: 600,
      },
      status: {},
    },
  ],
};

export const sampleKnativeReplicaSets: FirehoseResult = {
  loaded: true,
  loadError: '',
  data: [
    {
      apiVersion: 'apps/v1',
      kind: 'ReplicaSet',
      metadata: {
        annotations: {
          'deployment.kubernetes.io/desired-replicas': '0',
          'deployment.kubernetes.io/max-replicas': '0',
          'deployment.kubernetes.io/revision': '1',
        },
        resourceVersion: '1389053',
        name: 'default-ingress-5d9685cc74',
        uid: 'bccd5351-8ce0-11e9-9020-0ab4b49bd478',
        creationTimestamp: '2019-06-12T07:07:27Z',
        generation: 1,
        namespace: 'testproject3',
        ownerReferences: [
          {
            apiVersion: 'apps/v1',
            kind: 'Deployment',
            name: '"default-ingress"',
            uid: 'bccad3e4-8ce0-11e9-bb7b-0ebb55b110b8',
            controller: true,
            blockOwnerDeletion: true,
          },
        ],
        labels: {
          app: 'overlayimage-9jsl8',
          'pod-template-hash': '5d9685cc74',
          'serving.knative.dev/configuration': 'overlayimage',
          'serving.knative.dev/configurationGeneration': '1',
          'serving.knative.dev/revision': 'overlayimage-9jsl8',
          'serving.knative.dev/revisionUID': 'bca0fb96-8ce0-11e9-bb7b-0ebb55b110b8',
          'serving.knative.dev/service': 'overlayimage',
        },
      },
      spec: {
        template: {
          spec: {
            containers: [],
          },
        },
      },
      status: {
        replicas: 0,
        observedGeneration: 1,
      },
    },
  ],
};

export const sampleKnativePods: FirehoseResult<PodKind[]> = {
  loaded: true,
  loadError: '',
  data: [],
};

export const sampleKnativeReplicationControllers: FirehoseResult = {
  loaded: true,
  loadError: '',
  data: [],
};

export const sampleKnativeDeploymentConfigs: FirehoseResult = {
  loaded: true,
  loadError: '',
  data: [],
};

export const sampleRoutes: FirehoseResult = {
  loaded: true,
  loadError: '',
  data: [],
};

const sampleKnativeBuildConfigs: FirehoseResult = {
  loaded: true,
  loadError: '',
  data: [],
};

const sampleKnativeBuilds: FirehoseResult = {
  loaded: true,
  loadError: '',
  data: [],
};

export const sampleKnativeConfigurations: FirehoseResult = {
  loaded: true,
  loadError: '',
  data: [
    {
      apiVersion: `${ConfigurationModel.apiGroup}/${ConfigurationModel.apiVersion}`,
      kind: ConfigurationModel.kind,
      metadata: {
        name: 'overlayimage',
        namespace: 'testproject3',
        uid: '1317f615-9636-11e9-b134-06a61d886b62',
        resourceVersion: '1157349',
        labels: {
          'serving.knative.dev/route': 'overlayimage',
          'serving.knative.dev/service': 'overlayimage',
        },
        ownerReferences: [
          {
            apiVersion: `${RouteModel.apiGroup}/${RouteModel.apiVersion}`,
            kind: RouteModel.kind,
            name: 'overlayimage',
            uid: 'cea9496b-8ce0-11e9-bb7b-0ebb55b110b8',
            controller: true,
            blockOwnerDeletion: true,
          },
        ],
      },
      spec: {},
      status: {
        observedGeneration: 1,
        latestCreatedRevisionName: 'overlayimage-fdqsf',
        latestReadyRevisionName: 'overlayimage-fdqsf',
      },
    },
  ],
};

export const revisionObj: RevisionKind = {
  apiVersion: `${RevisionModel.apiGroup}/${RevisionModel.apiVersion}`,
  kind: RevisionModel.kind,
  metadata: {
    name: 'overlayimage-fdqsf',
    namespace: 'testproject3',
    uid: '02c34a0e-9638-11e9-b134-06a61d886b62',
    resourceVersion: '1157349',
    creationTimestamp: '2019-06-12T07:07:57Z',
    labels: {
      'serving.knative.dev/configuration': 'overlayimage',
      'serving.knative.dev/configurationGeneration': '2',
      'serving.knative.dev/service': 'overlayimage',
    },
    ownerReferences: [
      {
        apiVersion: `${ConfigurationModel.apiGroup}/${ConfigurationModel.apiVersion}`,
        kind: RouteModel.kind,
        name: 'overlayimage',
        uid: '1317f615-9636-11e9-b134-06a61d886b62',
        controller: true,
        blockOwnerDeletion: true,
      },
    ],
  },
  spec: {},
  status: {
    observedGeneration: 1,
    serviceName: 'overlayimage-fdqsf',
    conditions: [
      {
        lastTransitionTime: '2019-12-27T05:07:47Z',
        message: 'The target is not receiving traffic.',
        reason: 'NoTraffic',
        status: K8sResourceConditionStatus.False,
        type: ConditionTypes.Active,
      },
      {
        lastTransitionTime: '2019-12-27T05:06:47Z',
        status: K8sResourceConditionStatus.True,
        type: ConditionTypes.ContainerHealthy,
        message: '',
        reason: '',
      },
      {
        lastTransitionTime: '2019-12-27T05:06:47Z',
        status: K8sResourceConditionStatus.True,
        type: ConditionTypes.Ready,
        message: '',
        reason: '',
      },
      {
        lastTransitionTime: '2019-12-27T05:06:16Z',
        status: K8sResourceConditionStatus.True,
        type: ConditionTypes.ResourcesAvailable,
        message: '',
        reason: '',
      },
    ],
  },
};
export const sampleKnativeRevisions: FirehoseResult = {
  loaded: true,
  loadError: '',
  data: [revisionObj],
};

export const knativeRouteObj: RouteKind = {
  apiVersion: `${RouteModel.apiGroup}/${RouteModel.apiVersion}`,
  kind: RouteModel.kind,
  metadata: {
    name: 'overlayimage',
    namespace: 'testproject3',
    uid: '1317f615-9636-11e9-b134-06a61d886b62',
    resourceVersion: '1157349',
    creationTimestamp: '2019-06-12T07:07:57Z',
    labels: {
      'serving.knative.dev/route': 'overlayimage',
      'serving.knative.dev/service': 'overlayimage',
    },
    ownerReferences: [
      {
        apiVersion: `${ServiceModel.apiGroup}/${ServiceModel.apiVersion}`,
        kind: RouteModel.kind,
        name: 'overlayimage',
        uid: 'cea9496b-8ce0-11e9-bb7b-0ebb55b110b8',
        controller: true,
        blockOwnerDeletion: true,
      },
    ],
  },
  spec: {},
  status: {
    observedGeneration: 1,
    traffic: [{ latestRevision: true, percent: 100, revisionName: 'overlayimage-fdqsf' }],
    url: 'http://overlayimage.knativeapps.apps.bpetersen-june-23.devcluster.openshift.com',
    conditions: [
      { lastTransitionTime: '2019-12-27T05:06:47Z', status: 'True', type: 'AllTrafficAssigned' },
      { lastTransitionTime: '2019-12-27T05:07:29Z', status: 'True', type: 'IngressReady' },
      { lastTransitionTime: '2019-12-27T05:07:29Z', status: 'True', type: 'Ready' },
    ],
  },
};

export const sampleKnativeRoutes: FirehoseResult = {
  loaded: true,
  loadError: '',
  data: [knativeRouteObj],
};

export const knativeServiceObj: knativeServiceKind = {
  apiVersion: `${ServiceModel.apiGroup}/${ServiceModel.apiVersion}`,
  kind: ServiceModel.kind,
  metadata: {
    labels: {
      'app.kubernetes.io/part-of': 'myapp',
    },
    name: 'overlayimage',
    namespace: 'testproject3',
    uid: 'cea9496b-8ce0-11e9-bb7b-0ebb55b110b8',
    resourceVersion: '1157349',
    generation: 1,
  },
  spec: {
    template: {
      metadata: {
        labels: {
          'app.kubernetes.io/part-of': 'myapp',
        },
      },
    },
  },
  status: {
    observedGeneration: 1,
    url: 'http://overlayimage.knativeapps.apps.bpetersen-june-23.devcluster.openshift.com',
    latestCreatedRevisionName: 'overlayimage-fdqsf',
    latestReadyRevisionName: 'overlayimage-fdqsf',
    traffic: [
      {
        latestRevision: true,
        percent: 100,
        revisionName: 'overlayimage-fdqsf',
      },
    ],
    conditions: [
      { lastTransitionTime: '2019-12-27T05:06:47Z', status: 'True', type: 'ConfigurationsReady' },
      { lastTransitionTime: '2019-12-27T05:07:29Z', status: 'True', type: 'Ready' },
      { lastTransitionTime: '2019-12-27T05:07:29Z', status: 'True', type: 'RoutesReady' },
    ],
  },
};

export const serverlessFunctionObj = {
  ...knativeServiceObj,
  metadata: { ...knativeServiceObj.metadata, labels: { [SERVERLESS_FUNCTION_LABEL]: 'true' } },
};

export const sampleKnativeServices: FirehoseResult = {
  loaded: true,
  loadError: '',
  data: [knativeServiceObj],
};

export const getEventSourceResponse = (eventSourceModel: K8sKind): FirehoseResult => {
  return {
    loaded: true,
    loadError: '',
    data: [
      {
        apiVersion: `${eventSourceModel.apiGroup}/${eventSourceModel.apiVersion}`,
        kind: eventSourceModel.kind,
        metadata: {
          name: 'overlayimage',
          namespace: 'testproject3',
          uid: '1317f615-9636-11e9-b134-06a61d886b689_1',
          creationTimestamp: '2019-06-12T07:07:57Z',
        },
        spec: {
          sink: {
            apiVersion: 'serving.knative.dev/v1',
            kind: 'Service',
            name: 'overlayimage',
          },
        },
        status: {
          sinkUri: 'http://overlayimage.testproject3.svc.cluster.local',
        },
      },
    ],
  };
};

export const kafkaConnectionData = {
  loaded: true,
  loadError: '',
  data: [
    {
      apiVersion: 'rhoas.redhat.com/v1alpha1',
      kind: 'KafkaConnection',
      metadata: {
        creationTimestamp: '2021-04-08T10:40:48Z',
        finalizers: ['kafkaconnections.rhoas.redhat.com/finalizer'],
        name: 'my-first-kafka-instance',
        namespace: 'testproject3',
        resourceVersion: '91925',
        uid: '85ffdf52-59f5-4120-b2cd-e90c991845e0',
      },
      spec: {
        accessTokenSecretName: 'rh-cloud-services-api-accesstoken',
        credentials: {
          serviceAccountSecretName: 'rh-cloud-services-service-account',
        },
        kafkaId: '1qnH9JJ9icyjeLHe104WYj058xI',
      },
      status: {
        bootstrapServerHost: 'my-first-x--xxx-xx-icyjelhe---wyj---xi.kafka.devshift.org:443',
        serviceAccountSecretName: 'rh-cloud-services-service-account',
        updated: '2021-04-08T10:40:51.473911Z',
      },
    },
  ],
};

export const sampleEventSourceSinkbinding: FirehoseResult = {
  loaded: true,
  loadError: '',
  data: [
    {
      apiVersion: `${EventSourceSinkBindingModel.apiGroup}/${EventSourceSinkBindingModel.apiVersion}`,
      kind: EventSourceSinkBindingModel.kind,
      metadata: {
        name: 'bind-wss',
        namespace: 'testproject3',
        uid: '1317f615-9636-11e9-b134-06a61d886b689_1',
        creationTimestamp: '2019-06-12T07:07:57Z',
      },
      spec: {
        sink: {
          ref: {
            apiVersion: `${ServiceModel.apiGroup}/${ServiceModel.apiVersion}`,
            kind: ServiceModel.kind,
            name: 'wss-event-display',
          },
        },
        subject: {
          apiVersion: 'apps/v1',
          kind: 'Deployment',
          namespace: 'testproject3',
          selector: {
            matchLabels: {
              app: 'wss',
            },
          },
        },
      },
    },
  ],
};

export const sampleSourceKameletBinding: FirehoseResult = {
  loaded: true,
  loadError: '',
  data: [
    {
      kind: CamelKameletBindingModel.kind,
      apiVersion: `${CamelKameletBindingModel.apiGroup}/${CamelKameletBindingModel.apiVersion}`,
      metadata: {
        annotations: {
          'camel.apache.org/kamelet.icon':
            'data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCAyNDAgMjQwIj48ZGVmcz48bGluZWFyR3JhZGllbnQgaWQ9ImEiIHgxPSIuNjY3IiB4Mj0iLjQxNyIgeTE9Ii4xNjciIHkyPSIuNzUiPjxzdG9wIG9mZnNldD0iMCIgc3RvcC1jb2xvcj0iIzM3YWVlMiIvPjxzdG9wIG9mZnNldD0iMSIgc3RvcC1jb2xvcj0iIzFlOTZjOCIvPjwvbGluZWFyR3JhZGllbnQ+PGxpbmVhckdyYWRpZW50IGlkPSJiIiB4MT0iLjY2IiB4Mj0iLjg1MSIgeTE9Ii40MzciIHkyPSIuODAyIj48c3RvcCBvZmZzZXQ9IjAiIHN0b3AtY29sb3I9IiNlZmY3ZmMiLz48c3RvcCBvZmZzZXQ9IjEiIHN0b3AtY29sb3I9IiNmZmYiLz48L2xpbmVhckdyYWRpZW50PjwvZGVmcz48Y2lyY2xlIGN4PSIxMjAiIGN5PSIxMjAiIHI9IjEyMCIgZmlsbD0idXJsKCNhKSIvPjxwYXRoIGZpbGw9IiNjOGRhZWEiIGQ9Ik05OCAxNzVjLTMuODg4IDAtMy4yMjctMS40NjgtNC41NjgtNS4xN0w4MiAxMzIuMjA3IDE3MCA4MCIvPjxwYXRoIGZpbGw9IiNhOWM5ZGQiIGQ9Ik05OCAxNzVjMyAwIDQuMzI1LTEuMzcyIDYtM2wxNi0xNS41NTgtMTkuOTU4LTEyLjAzNSIvPjxwYXRoIGZpbGw9InVybCgjYikiIGQ9Ik0xMDAuMDQgMTQ0LjQxbDQ4LjM2IDM1LjcyOWM1LjUxOSAzLjA0NSA5LjUwMSAxLjQ2OCAxMC44NzYtNS4xMjNsMTkuNjg1LTkyLjc2M2MyLjAxNS04LjA4LTMuMDgtMTEuNzQ2LTguMzYtOS4zNDlsLTExNS41OSA0NC41NzFjLTcuODkgMy4xNjUtNy44NDMgNy41NjctMS40MzggOS41MjhsMjkuNjYzIDkuMjU5IDY4LjY3My00My4zMjVjMy4yNDItMS45NjYgNi4yMTgtLjkxIDMuNzc2IDEuMjU4Ii8+PC9zdmc+',
        },
        resourceVersion: '267611',
        name: 'overlayimage',
        uid: '3343caf6-f23f-420a-888e-e2c06aaaa843',
        creationTimestamp: '2020-11-17T07:06:51Z',
        generation: 3,
        namespace: 'testproject3',
      },
      spec: {
        sink: {
          ref: { apiVersion: 'serving.knative.dev/v1', kind: 'Service', name: 'event-display' },
        },
        source: {
          properties: { authorizationToken: 'token' },
          ref: {
            apiVersion: 'camel.apache.org/v1alpha1',
            kind: 'Kamelet',
            name: 'telegram-source',
          },
        },
      },
      status: {
        conditions: [
          {
            lastTransitionTime: '2020-11-17T08:19:41Z',
            lastUpdateTime: '2020-11-17T08:19:41Z',
            status: 'True',
            type: 'Ready',
          },
        ],
        phase: 'Ready',
      },
    },
  ],
};

export const sampleServices: FirehoseResult = {
  loaded: true,
  loadError: '',
  data: [
    {
      kind: 'Service',
      metadata: {
        name: 'overlayimage',
        namespace: 'testproject3',
        uid: 'cea9496b-8ce0-11e9-bb7b-0ebb55b110b8',
        resourceVersion: '1157349',
        creationTimestamp: '2019-06-12T07:07:57Z',
        labels: {
          'serving.knative.dev/route': 'overlayimage',
        },
        ownerReferences: [
          {
            apiVersion: `${RouteModel.apiGroup}/${RouteModel.apiVersion}`,
            kind: RouteModel.kind,
            name: 'overlayimage',
            uid: 'bca0d598-8ce0-11e9-bb7b-0ebb55b110b8',
            controller: true,
            blockOwnerDeletion: true,
          },
        ],
      },
      spec: {
        externalName: 'istio-ingressgateway.istio-system.svc.cluster.local',
        sessionAffinity: 'None',
        type: 'ExternalName',
      },
      status: {
        loadBalancer: {},
      },
    },
    {
      kind: 'Service',
      metadata: {
        name: 'overlayimage-9jsl8',
        namespace: 'testproject3',
        uid: 'bd1b788b-8ce0-11e9-bb7b-0ebb55b110b8',
        resourceVersion: '1160881',
        creationTimestamp: '2019-04-26T10:35:29Z',
        labels: {
          app: 'overlayimage-9jsl8',
          'networking.internal.knative.dev/serverlessservice': 'overlayimage-9jsl8',
          'networking.internal.knative.dev/serviceType': 'Public',
          'serving.knative.dev/configuration': 'overlayimage',
          'serving.knative.dev/configurationGeneration': '1',
          'serving.knative.dev/revision': 'overlayimage-9jsl8',
          'serving.knative.dev/revisionUID': 'bca0fb96-8ce0-11e9-bb7b-0ebb55b110b8',
          'serving.knative.dev/service': 'overlayimage',
        },
        ownerReferences: [
          {
            apiVersion: `networking.internal.knative.dev/${ServiceModel.apiVersion}`,
            kind: 'ServerlessService',
            name: 'overlayimage-9jsl8',
            uid: 'bcf5bfcf-8ce0-11e9-9020-0ab4b49bd478',
            controller: true,
            blockOwnerDeletion: true,
          },
        ],
        annotations: {
          'autoscaling.knative.dev/class': 'kpa.autoscaling.knative.dev',
        },
      },
      spec: {
        sessionAffinity: 'None',
        type: 'ClusterIP',
        clusterIP: '172.30.252.203',
      },
      status: {
        loadBalancer: {},
      },
    },
  ],
};

export const sampleClusterServiceVersions: FirehoseResult = {
  loaded: true,
  loadError: '',
  data: [],
};
export const knativeTopologyDataModel = {
  graph: {
    nodes: [
      { id: 'e187afa2-53b1-406d-a619-cf9ff1468031', type: 'knative-service', name: 'react-app' },
    ],
    edges: [],
    groups: [],
  },
  topology: {
    'e187afa2-53b1-406d-a619-cf9ff1468031': {
      id: 'e84d885a-a63f-41c7-8833-ffbc802f296a',
      name: 'react-app',
      type: 'knative-service',
      resources: {
        obj: knativeServiceObj,
        buildConfigs: [],
        routes: [],
        services: [],
        configurations: [],
        revisions: [],
        ksroutes: [],
        pods: [],
      },
      operatorBackedService: false,
      data: {
        url: 'http://react-app.karthik.apps-crc.testing',
        kind: referenceForModel(ServiceModel),
        vcsURI: 'https://github.com/sclorg/nodejs-ex',
        isKnativeResource: true,
      },
    },
  },
};

export const sampleEventSourceDeployments: FirehoseResult<DeploymentKind[]> = {
  loaded: true,
  loadError: '',
  data: [
    {
      apiVersion: 'apps/v1',
      kind: 'Deployment',
      metadata: {
        annotations: {
          'deployment.kubernetes.io/revision': '1',
        },
        resourceVersion: '726179',
        name: 'apiserversource-testevents-88eb61d1-b52e-4836-829c-6821e346ecf6',
        uid: 'bccad3e4-8ce0-11e9-bb7b-0ebb55b110b8',
        creationTimestamp: '2019-04-22T11:35:43Z',
        generation: 2,
        namespace: 'testproject1',
        labels: {
          'eventing.knative.dev/source': 'apiserver-source-controller',
          'eventing.knative.dev/sourceName': 'testevents',
        },
        ownerReferences: [
          {
            apiVersion: `${EventSourceApiServerModel.apiGroup}/${EventSourceApiServerModel.apiVersion}`,
            kind: EventSourceApiServerModel.kind,
            name: 'testevents',
            uid: '1317f615-9636-11e9-b134-06a61d886b689_1',
            controller: true,
            blockOwnerDeletion: true,
          },
        ],
      },
      spec: {
        replicas: 0,
        selector: {
          matchLabels: {
            'eventing.knative.dev/source': 'apiserver-source-controller',
            'eventing.knative.dev/sourceName': 'testevents',
          },
        },
        template: {
          metadata: {
            creationTimestamp: null,
            labels: {
              'eventing.knative.dev/source': 'apiserver-source-controller',
              'eventing.knative.dev/sourceName': 'testevents',
            },
            annotations: {
              'sidecar.istio.io/inject': 'false',
            },
          },
          spec: {
            containers: [],
          },
        },
        strategy: {
          type: 'RollingUpdate',
          rollingUpdate: {
            maxUnavailable: '25%',
            maxSurge: '25%',
          },
        },
        revisionHistoryLimit: 10,
        progressDeadlineSeconds: 600,
      },
      status: {},
    },
  ],
};

export const EventSubscriptionObj: EventSubscriptionKind = {
  apiVersion: `${EventingSubscriptionModel.apiGroup}/${EventingSubscriptionModel.apiVersion}`,
  kind: EventingSubscriptionModel.kind,
  metadata: {
    name: 'sub1',
    namespace: 'testproject3',
    uid: '4de9aba5-432c-46d8-8492-a5bedb10c89a',
    resourceVersion: '235775100',
    generation: 1,
  },
  spec: {
    channel: {
      apiVersion: `${EventingIMCModel.apiGroup}/${EventingIMCModel.apiVersion}`,
      kind: EventingIMCModel.kind,
      name: 'testchannel',
    },
    subscriber: {
      ref: { apiVersion: 'serving.knative.dev/v1', kind: 'Service', name: 'overlayimage' },
    },
  },
  status: {
    observedGeneration: 1,
    physicalSubscription: {
      subscriberURI: 'http://channel-display1.testproject3.svc.cluster.local',
    },
  },
};

export const EventIMCObj: EventChannelKind = {
  apiVersion: `${EventingIMCModel.apiGroup}/${EventingIMCModel.apiVersion}`,
  kind: EventingIMCModel.kind,
  metadata: {
    name: 'testchannel',
    namespace: 'testproject3',
    uid: 'a35e6244-3233-473d-9120-ed274c7ae811',
    resourceVersion: '235628221',
    generation: 1,
  },
  spec: {
    subscriber: [
      {
        subscriberUri: 'http://channel-display0.testproject3.svc.cluster.local',
        uid: 'ae670cb1-cb66-4444-aead-c366552e7cef',
      },
    ],
  },
  status: {
    observedGeneration: 1,
    address: {
      url: 'http://channel-display1.testproject3.svc.cluster.local',
    },
  },
};

export const EventBrokerObj: EventChannelKind = {
  apiVersion: `${EventingBrokerModel.apiGroup}/${EventingBrokerModel.apiVersion}`,
  kind: EventingBrokerModel.kind,
  metadata: {
    name: 'default',
    namespace: 'testproject3',
    uid: 'a35e6244-3233-473d-9120-ed274c7ae811',
  },
  spec: {
    subscriber: [
      {
        subscriberUri: 'http://channel-display0.testproject3.svc.cluster.local',
        uid: 'ae670cb1-cb66-4444-aead-c366552e7cef',
      },
    ],
  },
  status: {
    address: {
      url: 'http://channel-display1.testproject3.svc.cluster.local',
    },
  },
};

export const EventTriggerObj: EventTriggerKind = {
  apiVersion: `${EventingTriggerModel.apiGroup}/${EventingTriggerModel.apiVersion}`,
  kind: EventingTriggerModel.kind,
  metadata: {
    name: 'my-service-trigger',
    namespace: 'default',
  },
  spec: {
    broker: 'default',
    filter: {
      attributes: {
        type: 'dev.knative.sources.ping',
      },
    },
    subscriber: {
      ref: {
        apiVersion: 'serving.knative.dev/v1',
        kind: 'Service',
        name: knativeServiceObj.metadata.name,
      },
    },
  },
};

const sampleBrokers: FirehoseResult = {
  loaded: true,
  loadError: '',
  data: [EventBrokerObj],
};

const sampleTriggers: FirehoseResult = {
  loaded: true,
  loadError: '',
  data: [EventTriggerObj],
};

export const MockKnativeResources: TopologyDataResources = {
  deployments: sampleKnativeDeployments,
  deploymentConfigs: sampleKnativeDeploymentConfigs,
  replicationControllers: sampleKnativeReplicationControllers,
  replicaSets: sampleKnativeReplicaSets,
  pods: sampleKnativePods,
  services: sampleServices,
  routes: sampleRoutes,
  buildConfigs: sampleKnativeBuildConfigs,
  builds: sampleKnativeBuilds,
  ksservices: sampleKnativeServices,
  ksroutes: sampleKnativeRoutes,
  configurations: sampleKnativeConfigurations,
  revisions: sampleKnativeRevisions,
  [referenceForModel(EventSourceCronJobModel)]: getEventSourceResponse(EventSourceCronJobModel),
  [referenceForModel(EventSourceContainerModel)]: getEventSourceResponse(EventSourceContainerModel),
  [referenceForModel(EventSourceCamelModel)]: getEventSourceResponse(EventSourceCamelModel),
  [referenceForModel(EventSourceKafkaModel)]: getEventSourceResponse(EventSourceKafkaModel),
  [referenceForModel(EventSourceSinkBindingModel)]: sampleEventSourceSinkbinding,
  [referenceForModel(EventSourcePingModel)]: getEventSourceResponse(EventSourcePingModel),
  [referenceForModel(EventSourceApiServerModel)]: getEventSourceResponse(EventSourceApiServerModel),
  clusterServiceVersions: sampleClusterServiceVersions,
  triggers: sampleTriggers,
  brokers: sampleBrokers,
  [CamelKameletBindingModel.plural]: sampleSourceKameletBinding,
};

export const MockKnativeBuildConfig = {
  metadata: {
    annotations: {
      'openshift.io/build-config.name': 'react-web-app',
      'openshift.io/build.number': '1',
      'openshift.io/build.pod-name': 'react-web-app-1-build',
    },
    resourceVersion: '696608',
    name: 'react-web-app-1',
    uid: 'fd52472d-f752-11e9-81ae-0a580a810022',
    creationTimestamp: '2019-10-25T18:12:22Z',
    namespace: 'andrew-test',
    ownerReferences: [
      {
        apiVersion: 'build.openshift.io/v1',
        kind: 'BuildConfig',
        name: 'react-web-app',
        uid: 'fd28333b-f752-11e9-81ae-0a580a810022',
        controller: true,
      },
    ],
    labels: {
      app: 'react-web-app',
      'app.kubernetes.io/part-of': 'react-web-app-app',
      'app.kubernetes.io/instance': 'react-web-app',
      'openshift.io/build-config.name': 'react-web-app',
      'app.kubernetes.io/component': 'react-web-app',
      'openshift.io/build.start-policy': 'Serial',
      buildconfig: 'react-web-app',
      'app.openshift.io/runtime': 'modern-webapp',
      'app.kubernetes.io/name': 'modern-webapp',
      'app.openshift.io/runtime-version': '10.x',
    },
  },
  spec: {
    nodeSelector: null,
    output: {
      to: { kind: 'ImageStreamTag', name: 'react-web-app:latest' },
      pushSecret: { name: 'builder-dockercfg-9jcf2' },
    },
    resources: {},
    triggeredBy: [
      {
        message: 'Image change',
        imageChangeBuild: {
          imageID:
            'image-registry.openshift-image-registry.svc:5000/openshift/modern-webapp@sha256:eb672caddbf6f1d2283ecc2e7f69142bd605f5a0067c951dd9b829f29343edc4',
          fromRef: { kind: 'ImageStreamTag', namespace: 'openshift', name: 'modern-webapp:10.x' },
        },
      },
    ],
    strategy: {
      type: 'Source',
      sourceStrategy: {
        from: {
          kind: 'DockerImage',
          name:
            'image-registry.openshift-image-registry.svc:5000/openshift/modern-webapp@sha256:eb672caddbf6f1d2283ecc2e7f69142bd605f5a0067c951dd9b829f29343edc4',
        },
        pullSecret: { name: 'builder-dockercfg-9jcf2' },
      },
    },
    postCommit: {},
    serviceAccount: 'builder',
    source: {
      type: 'Git',
      git: { uri: 'https://github.com/nodeshift-starters/react-web-app' },
      contextDir: '/',
    },
    revision: {
      type: 'Git',
      git: {
        commit: '32b53d1a23d8148077f2095226bd4e8afcd1ce4a',
        author: { name: 'Lucas Holmquist', email: 'lholmqui@redhat.com' },
        committer: { name: 'Lucas Holmquist', email: 'lholmqui@redhat.com' },
        message: 'chore: text updates',
      },
    },
  },
  status: {
    phase: 'Running',
    startTimestamp: '2019-10-25T18:12:22Z',
    outputDockerImageReference:
      'image-registry.openshift-image-registry.svc:5000/andrew-test/react-web-app:latest',
    config: { kind: 'BuildConfig', namespace: 'andrew-test', name: 'react-web-app' },
    output: {},
    stages: [
      {
        name: 'FetchInputs',
        startTime: '2019-10-25T18:12:30Z',
        durationMilliseconds: 479,
        steps: [
          { name: 'FetchGitSource', startTime: '2019-10-25T18:12:30Z', durationMilliseconds: 479 },
        ],
      },
    ],
  },
};

export const sinkUriUid = '1317f615-9636-11e9-b134-06a61d886b689_1_nodesinkuri';
const sinkUri = 'http://overlayimage.testproject3.svc.cluster.local';

export const eventSourceWithSinkUri: K8sResourceKind = {
  ...getEventSourceResponse(EventSourceCronJobModel).data[0],
  spec: { sink: { uri: sinkUri } },
};

export const sinkUriObj: K8sResourceKind = {
  kind: URI_KIND,
  metadata: {
    uid: sinkUriUid,
  },
  spec: { sinkUri },
};

export const sinkUriData: KnativeTopologyDataObject<KnativeServiceOverviewItem> = {
  id: sinkUriUid,
  name: 'URI',
  type: NodeType.SinkUri,
  resources: {
    obj: sinkUriObj,
    eventSources: [eventSourceWithSinkUri],
  },
  resource: sinkUriObj,
  data: { sinkUri },
};
