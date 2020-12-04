export const dev = {
  cluster: 'http://dev-stage-cluster.com',
  environment: 'Dev',
  namespace: 'dev-ns',
  services: [
    {
      name: 'taxi-frontend',
      source: {
        url: 'https://github.com/taxi-frontend',
        type: 'git',
      },
      images: ['nodejs:latest', 'service:9326bb256681145ce73408e331513e87'],
      resources: [
        {
          group: 'apps',
          version: 'v1',
          kind: 'Deployment',
          name: 'taxi-frontend-demo-svc',
          namespace: 'dev-ns',
        },
        {
          group: '',
          version: 'v1',
          kind: 'Service',
          name: 'taxi-frontend-demo-svc',
          namespace: 'dev-ns',
        },
        {
          group: 'route.openshift.io',
          version: 'v1',
          kind: 'Route',
          name: 'taxi-frontend-demo-svc-route',
          namespace: 'dev-ns',
        },
        {
          group: 'rbac.authorization.k8s.io',
          version: 'v1',
          kind: 'RoleBinding',
          name: 'dev-rolebinding',
          namespace: 'dev-ns',
        },
      ],
    },
    {
      name: 'taxi-backend',
      source: {
        url: 'https://github.com/taxi-backend',
        type: 'git',
      },
      images: ['http-api:v1', 'redis:latest', 'service:9326bb256681145ce73408e331513e87'],
      resources: [
        {
          group: 'apps',
          version: 'v1',
          kind: 'Deployment',
          name: 'taxi-backend-demo-svc',
          namespace: 'dev-ns',
        },
        {
          group: '',
          version: 'v1',
          kind: 'Service',
          name: 'tax-backend-demo-svc',
          namespace: 'dev-ns',
        },
        {
          group: 'route.openshift.io',
          version: 'v1',
          kind: 'Route',
          name: 'taxi-backend-demo-svc-route',
          namespace: 'dev-ns',
        },
        {
          group: 'rbac.authorization.k8s.io',
          version: 'v1',
          kind: 'RoleBinding',
          name: 'dev-rolebinding',
          namespace: 'dev-ns',
        },
      ],
    },
  ],
};

export const stage = {
  cluster: 'http://stage-cluster.com',
  environment: 'Stage',
  namespace: 'stage-ns',
  services: [
    {
      name: 'taxi-frontend',
      source: {
        url: 'https://github.com/taxi-frontend',
        type: 'git',
      },
      images: ['nodejs:latest', 'service:9326bb256681145ce73408e331513e87'],
      resources: [
        {
          group: 'apps',
          version: 'v1',
          kind: 'Deployment',
          name: 'taxi-frontend-demo-svc',
          namespace: 'dev-ns',
        },
        {
          group: '',
          version: 'v1',
          kind: 'Service',
          name: 'taxi-frontend-demo-svc',
          namespace: 'dev-ns',
        },
        {
          group: 'route.openshift.io',
          version: 'v1',
          kind: 'Route',
          name: 'taxi-frontend-demo-svc-route',
          namespace: 'dev-ns',
        },
        {
          group: 'rbac.authorization.k8s.io',
          version: 'v1',
          kind: 'RoleBinding',
          name: 'dev-rolebinding',
          namespace: 'dev-ns',
        },
      ],
    },
    {
      name: 'taxi-backend',
      source: {
        url: 'https://github.com/taxi-backend',
        type: 'git',
      },
      images: ['http-api:v1', 'redis:latest', 'service:9326bb256681145ce73408e331513e87'],
      resources: [
        {
          group: 'apps',
          version: 'v1',
          kind: 'Deployment',
          name: 'taxi-backend-demo-svc',
          namespace: 'dev-ns',
        },
        {
          group: '',
          version: 'v1',
          kind: 'Service',
          name: 'tax-backend-demo-svc',
          namespace: 'dev-ns',
        },
        {
          group: 'route.openshift.io',
          version: 'v1',
          kind: 'Route',
          name: 'taxi-backend-demo-svc-route',
          namespace: 'dev-ns',
        },
        {
          group: 'rbac.authorization.k8s.io',
          version: 'v1',
          kind: 'RoleBinding',
          name: 'dev-rolebinding',
          namespace: 'dev-ns',
        },
      ],
    },
  ],
};

export const prod = {
  cluster: 'http://production-cluster.com',
  environment: 'Prod',
  namespace: 'prod-ns',
  services: [
    {
      name: 'taxi-frontend',
      source: {
        url: 'https://github.com/taxi-frontend',
        type: 'git',
      },
      images: ['nodejs:latest', 'service:9326bb256681145ce73408e331513e87'],
      resources: [
        {
          group: 'apps',
          version: 'v1',
          kind: 'Deployment',
          name: 'taxi-frontend-demo-svc',
          namespace: 'dev-ns',
        },
        {
          group: '',
          version: 'v1',
          kind: 'Service',
          name: 'taxi-frontend-demo-svc',
          namespace: 'dev-ns',
        },
        {
          group: 'route.openshift.io',
          version: 'v1',
          kind: 'Route',
          name: 'taxi-frontend-demo-svc-route',
          namespace: 'dev-ns',
        },
        {
          group: 'rbac.authorization.k8s.io',
          version: 'v1',
          kind: 'RoleBinding',
          name: 'dev-rolebinding',
          namespace: 'dev-ns',
        },
      ],
    },
    {
      name: 'taxi-backend',
      source: {
        url: 'https://github.com/taxi-backend',
        type: 'git',
      },
      images: ['http-api:v1', 'redis:latest', 'service:9326bb256681145ce73408e331513e87'],
      resources: [
        {
          group: 'apps',
          version: 'v1',
          kind: 'Deployment',
          name: 'taxi-backend-demo-svc',
          namespace: 'dev-ns',
        },
        {
          group: '',
          version: 'v1',
          kind: 'Service',
          name: 'tax-backend-demo-svc',
          namespace: 'dev-ns',
        },
        {
          group: 'route.openshift.io',
          version: 'v1',
          kind: 'Route',
          name: 'taxi-backend-demo-svc-route',
          namespace: 'dev-ns',
        },
        {
          group: 'rbac.authorization.k8s.io',
          version: 'v1',
          kind: 'RoleBinding',
          name: 'dev-rolebinding',
          namespace: 'dev-ns',
        },
      ],
    },
  ],
};

export const qa = {
  cluster: 'http://QA-stage-cluster.com',
  environment: 'QA',
  namespace: 'prod-ns',
  services: [
    {
      name: 'taxi-frontend',
      source: {
        url: 'https://github.com/taxi-frontend',
        type: 'git',
      },
      images: ['nodejs:latest', 'service:9326bb256681145ce73408e331513e87'],
      resources: [
        {
          group: 'apps',
          version: 'v1',
          kind: 'Deployment',
          name: 'taxi-frontend-demo-svc',
          namespace: 'dev-ns',
        },
        {
          group: '',
          version: 'v1',
          kind: 'Service',
          name: 'taxi-frontend-demo-svc',
          namespace: 'dev-ns',
        },
        {
          group: 'route.openshift.io',
          version: 'v1',
          kind: 'Route',
          name: 'taxi-frontend-demo-svc-route',
          namespace: 'dev-ns',
        },
        {
          group: 'rbac.authorization.k8s.io',
          version: 'v1',
          kind: 'RoleBinding',
          name: 'dev-rolebinding',
          namespace: 'dev-ns',
        },
      ],
    },
    {
      name: 'taxi-backend',
      source: {
        url: 'https://github.com/taxi-backend',
        type: 'git',
      },
      images: ['http-api:v1', 'redis:latest', 'service:9326bb256681145ce73408e331513e87'],
      resources: [
        {
          group: 'apps',
          version: 'v1',
          kind: 'Deployment',
          name: 'taxi-backend-demo-svc',
          namespace: 'dev-ns',
        },
        {
          group: '',
          version: 'v1',
          kind: 'Service',
          name: 'tax-backend-demo-svc',
          namespace: 'dev-ns',
        },
        {
          group: 'route.openshift.io',
          version: 'v1',
          kind: 'Route',
          name: 'taxi-backend-demo-svc-route',
          namespace: 'dev-ns',
        },
        {
          group: 'rbac.authorization.k8s.io',
          version: 'v1',
          kind: 'RoleBinding',
          name: 'dev-rolebinding',
          namespace: 'dev-ns',
        },
      ],
    },
  ],
};

export const test = {
  cluster: 'http://production-cluster.com',
  environment: 'Test',
  namespace: 'prod-ns',
  services: [
    {
      name: 'taxi-frontend',
      source: {
        url: 'https://github.com/taxi-frontend',
        type: 'git',
      },
      images: ['nodejs:latest', 'service:9326bb256681145ce73408e331513e87'],
      resources: [
        {
          group: 'apps',
          version: 'v1',
          kind: 'Deployment',
          name: 'taxi-frontend-demo-svc',
          namespace: 'dev-ns',
        },
        {
          group: '',
          version: 'v1',
          kind: 'Service',
          name: 'taxi-frontend-demo-svc',
          namespace: 'dev-ns',
        },
        {
          group: 'route.openshift.io',
          version: 'v1',
          kind: 'Route',
          name: 'taxi-frontend-demo-svc-route',
          namespace: 'dev-ns',
        },
        {
          group: 'rbac.authorization.k8s.io',
          version: 'v1',
          kind: 'RoleBinding',
          name: 'dev-rolebinding',
          namespace: 'dev-ns',
        },
      ],
    },
    {
      name: 'taxi-backend',
      source: {
        url: 'https://github.com/taxi-backend',
        type: 'git',
      },
      images: ['http-api:v1', 'redis:latest', 'service:9326bb256681145ce73408e331513e87'],
      resources: [
        {
          group: 'apps',
          version: 'v1',
          kind: 'Deployment',
          name: 'taxi-backend-demo-svc',
          namespace: 'dev-ns',
        },
        {
          group: '',
          version: 'v1',
          kind: 'Service',
          name: 'tax-backend-demo-svc',
          namespace: 'dev-ns',
        },
        {
          group: 'route.openshift.io',
          version: 'v1',
          kind: 'Route',
          name: 'taxi-backend-demo-svc-route',
          namespace: 'dev-ns',
        },
        {
          group: 'rbac.authorization.k8s.io',
          version: 'v1',
          kind: 'RoleBinding',
          name: 'dev-rolebinding',
          namespace: 'dev-ns',
        },
      ],
    },
  ],
};

export const mockEnvsData = { dev, test, qa, stage, prod };
