export const testDeployment = 'test-deployment';

export const deployment = {
  apiVersion: 'apps/v1',
  kind: 'Deployment',
  metadata: {
    name: testDeployment,
  },
  spec: {
    selector: {
      matchLabels: {
        app: 'hello-openshift',
      },
    },
    replicas: 3,
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
