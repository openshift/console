export const deployment = {
  apiVersion: 'apps/v1',
  kind: 'Deployment',
  metadata: {
    name: 'test-deployment',
  },
  spec: {
    selector: {
      matchLabels: {
        app: 'hello-openshift',
      },
    },
    replicas: 1,
    template: {
      metadata: {
        labels: {
          app: 'hello-openshift',
        },
      },
      spec: {
        containers: [
          {
            name: 'hello-openshift',
            image: 'openshift/hello-openshift',
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
