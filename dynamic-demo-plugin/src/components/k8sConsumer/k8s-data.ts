import { K8sModel } from '@openshift-console/dynamic-plugin-sdk/lib/api/common-types';

// Needs to be removed with useK8sModel once we have support for referenceFor utils 
export const DeploymentModel: K8sModel = {
  label: 'Deployment',
  labelKey: 'public~Deployment',
  apiVersion: 'v1',
  apiGroup: 'apps',
  plural: 'deployments',
  abbr: 'D',
  namespaced: true,
  propagationPolicy: 'Foreground',
  kind: 'Deployment',
  id: 'deployment',
  labelPlural: 'Deployments',
};

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
