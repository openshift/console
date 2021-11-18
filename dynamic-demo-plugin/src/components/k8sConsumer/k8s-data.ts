export const mockDeploymetData = {
  apiVersion: 'apps/v1',
  kind: 'Deployment',
  metadata: {
    name: 'sampleapp',
    namespace: 'default',
    labels: {
      app: 'httpd',
    },
  },
  spec: {
    selector: {
      matchLabels: {
        app: 'httpd',
      },
    },
    replicas: 3,
    template: {
      metadata: {
        labels: {
          app: 'httpd',
        },
      },
      spec: {
        containers: [
          {
            name: 'httpd',
            image: 'image-registry.openshift-image-registry.svc:5000/openshift/httpd:latest',
            ports: [
              {
                containerPort: 8080,
              },
            ],
          },
        ],
      },
    },
  },
};
