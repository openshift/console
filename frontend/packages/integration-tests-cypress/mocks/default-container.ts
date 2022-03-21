export const podWithDefaultContainer = {
  apiVersion: 'v1',
  kind: 'Pod',
  metadata: {
    name: 'default-container-test',
    annotations: {
      'kubectl.kubernetes.io/default-container': 'httpd',
    },
  },
  spec: {
    containers: [
      {
        name: 'busybox',
        image: 'busybox',
        command: ['sleep', '"3600"'],
      },
      {
        name: 'httpd',
        image: 'image-registry.openshift-image-registry.svc:5000/openshift/httpd:latest',
      },
    ],
  },
};
