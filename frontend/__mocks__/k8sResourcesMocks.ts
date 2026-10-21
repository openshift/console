import { ImagePullPolicy, K8sResourceKind, PodKind } from '../public/module/k8s';

export const testNamespace: K8sResourceKind = {
  apiVersion: 'v1',
  kind: 'Namespace',
  metadata: {
    name: 'default',
    annotations: { 'alm-manager': 'tectonic-system.alm-operator' },
  },
};

export const testPodInstance: PodKind = {
  kind: 'Pod',
  apiVersion: 'v1',
  metadata: {
    name: 'crash-pod',
    namespace: 'default',
    uid: 'ccfc511f-0692-42ff-8289-af85a4edcfbe',
    resourceVersion: '660236',
    creationTimestamp: '2022-02-09T09:16:58Z',
    annotations: {
      'k8s.v1.cni.cncf.io/network-status':
        '[{\n    "name": "openshift-sdn",\n    "interface": "eth0",\n    "ips": [\n        "10.131.0.48"\n    ],\n    "default": true,\n    "dns": {}\n}]',
      'k8s.v1.cni.cncf.io/networks-status':
        '[{\n    "name": "openshift-sdn",\n    "interface": "eth0",\n    "ips": [\n        "10.131.0.48"\n    ],\n    "default": true,\n    "dns": {}\n}]',
    },
  },
  spec: {
    restartPolicy: 'Always',
    serviceAccountName: 'default',
    imagePullSecrets: [{ name: 'default-dockercfg-fcb57' }],
    priority: 0,
    schedulerName: 'default-scheduler',
    enableServiceLinks: true,
    terminationGracePeriodSeconds: 30,
    preemptionPolicy: 'PreemptLowerPriority',
    nodeName: 'ip-10-0-132-2.ec2.internal',
    securityContext: {},
    containers: [
      {
        name: 'crash-app',
        image: 'quay.io/openshifttest/crashpod',
        resources: {},
        volumeMounts: [
          {
            name: 'kube-api-access-bhdgs',
            readOnly: true,
            mountPath: '/var/run/secrets/kubernetes.io/serviceaccount',
          },
        ],
        terminationMessagePath: '/dev/termination-log',
        terminationMessagePolicy: 'File',
        imagePullPolicy: ImagePullPolicy.Always,
      },
    ],
    serviceAccount: 'default',
    dnsPolicy: 'ClusterFirst',
  },
  status: {
    phase: 'Running',
    conditions: [
      {
        type: 'Initialized',
        status: 'True',
        lastProbeTime: null,
        lastTransitionTime: '2022-02-09T09:16:58Z',
      },
      {
        type: 'Ready',
        status: 'False',
        lastProbeTime: null,
        lastTransitionTime: '2022-02-09T09:16:58Z',
        reason: 'ContainersNotReady',
        message: 'containers with unready status: [crash-app]',
      },
      {
        type: 'ContainersReady',
        status: 'False',
        lastProbeTime: null,
        lastTransitionTime: '2022-02-09T09:16:58Z',
        reason: 'ContainersNotReady',
        message: 'containers with unready status: [crash-app]',
      },
      {
        type: 'PodScheduled',
        status: 'True',
        lastProbeTime: null,
        lastTransitionTime: '2022-02-09T09:16:58Z',
      },
    ],
    hostIP: '10.0.132.2',
    podIP: '10.131.0.48',
    podIPs: [{ ip: '10.131.0.48' }],
    startTime: '2022-02-09T09:16:58Z',
    containerStatuses: [
      {
        restartCount: 29,
        ready: false,
        name: 'crash-app',
        state: {
          waiting: {
            reason: 'CrashLoopBackOff',
            message:
              'back-off 5m0s restarting failed container=crash-app pod=crash-pod_default(ccfc511f-0692-42ff-8289-af85a4edcfbe)',
          },
        },
        imageID:
          'quay.io/openshifttest/crashpod@sha256:5b2b22e0c61ce58184b4c9b544ae662ee4781c98f6cf2f03b636b2fce2e74eb6',
        image: 'quay.io/openshifttest/crashpod:latest',
        lastState: {
          terminated: {
            exitCode: 0,
            reason: 'Completed',
            startedAt: '2022-02-09T11:20:28Z',
            finishedAt: '2022-02-09T11:20:28Z',
            containerID: 'cri-o://9bb7ba3376975d37f44f8d5a9b5a67afda81ee13c1d121669c82e9dada4f2420',
          },
        },
        containerID: 'cri-o://9bb7ba3376975d37f44f8d5a9b5a67afda81ee13c1d121669c82e9dada4f2420',
      },
    ],
    qosClass: 'BestEffort',
  },
};

export const testResourceInstance: K8sResourceKind = {
  apiVersion: 'testapp.coreos.com/v1alpha1',
  kind: 'TestResource',
  metadata: {
    name: 'my-test-resource',
    namespace: 'default',
    uid: 'c02c0a8f-88e0-12e7-851b-081027b424ef',
    creationTimestamp: '2017-06-20T18:19:49Z',
  },
  spec: {
    selector: {
      matchLabels: {
        fizz: 'buzz',
      },
    },
  },
  status: {
    'some-filled-path': 'this is filled!',
  },
};

export const testOwnedResourceInstance: K8sResourceKind = {
  apiVersion: 'testapp.coreos.com/v1alpha1',
  kind: 'TestOwnedResource',
  metadata: {
    name: 'owned-test-resource',
    uid: '62fa5eac-3df4-448d-a576-916dd5b432f2',
    creationTimestamp: '2005-02-20T18:13:42Z',
    ownerReferences: [
      {
        name: testResourceInstance.metadata.name,
        kind: 'TestResource',
        apiVersion: testResourceInstance.apiVersion,
        uid: testResourceInstance.metadata.uid,
      },
    ],
  },
  spec: {},
  status: {
    'some-filled-path': 'this is filled!',
  },
};
