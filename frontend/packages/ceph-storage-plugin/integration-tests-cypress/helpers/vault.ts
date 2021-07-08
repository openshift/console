export const roleBindingJSON = {
  apiVersion: 'rbac.authorization.k8s.io/v1',
  kind: 'ClusterRoleBinding',
  metadata: {
    labels: {
      'app.kubernetes.io/name': 'vault',
      'app.kubernetes.io/instance': 'vault',
    },
    name: 'vault-server-binding',
  },
  roleRef: {
    apiGroup: 'rbac.authorization.k8s.io',
    kind: 'ClusterRole',
    name: 'system:auth-delegator',
  },
  subjects: [
    {
      kind: 'ServiceAccount',
      name: 'vault',
      namespace: 'hashicorp',
    },
  ],
};

export const serviceAccountJSON = {
  apiVersion: 'v1',
  kind: 'ServiceAccount',
  metadata: {
    labels: {
      'app.kubernetes.io/instance': 'vault',
      'app.kubernetes.io/name': 'vault',
    },
    name: 'vault',
  },
};

export const getPVCJSON = {
  kind: 'PersistentVolumeClaim',
  apiVersion: 'v1',
  metadata: {
    name: 'vault-storage',
    labels: {
      'app.kubernetes.io/instance': 'vault',
      'app.kubernetes.io/name': 'vault',
    },
  },
  spec: {
    accessModes: ['ReadWriteOnce'],
    resources: {
      requests: {
        storage: '10Gi',
      },
    },
  },
};

export const configMapJSON = {
  kind: 'ConfigMap',
  apiVersion: 'v1',
  metadata: {
    name: 'vault-config',
    labels: {
      'app.kubernetes.io/instance': 'vault',
      'app.kubernetes.io/name': 'vault',
    },
  },
  data: {
    'vault-config':
      '{"backend": {"file": {"path": "/vault/data"}},' +
      '"default_lease_ttl": "168h","max_lease_ttl": "720h","disable_mlock": true,' +
      '"ui": true,"listener": {"tcp": {"address": "0.0.0.0:8200","tls_disable" : true}}}',
  },
};

export const serviceJSON = {
  apiVersion: 'v1',
  kind: 'Service',
  metadata: {
    name: 'vault',
    annotations: {
      'service.alpha.openshift.io/serving-cert-secret-name': 'vault-cert',
    },
    labels: {
      'app.kubernetes.io/instance': 'vault',
      'app.kubernetes.io/name': 'vault',
    },
  },
  spec: {
    ports: [
      {
        name: 'vault',
        port: 8200,
      },
    ],
    selector: {
      'app.kubernetes.io/instance': 'vault',
      'app.kubernetes.io/name': 'vault',
    },
    publishNotReadyAddresses: true,
  },
};

export const routeJSON = {
  kind: 'Route',
  apiVersion: 'route.openshift.io/v1',
  metadata: {
    name: 'vault',
    labels: {
      'app.kubernetes.io/instance': 'vault',
      'app.kubernetes.io/name': 'vault',
    },
  },
  spec: {
    to: {
      kind: 'Service',
      name: 'vault',
      weight: 100,
    },
    port: {
      targetPort: 8200,
    },
  },
};

export const networkPolicyJSON = {
  apiVersion: 'networking.k8s.io/v1',
  kind: 'NetworkPolicy',
  metadata: {
    name: 'vault',
    labels: {
      'app.kubernetes.io/name': 'vault',
      'app.kubernetes.io/instance': 'vault',
    },
  },
  spec: {
    podSelector: {
      matchLabels: {
        'app.kubernetes.io/instance': 'vault',
        'app.kubernetes.io/name': 'vault',
      },
    },
    ingress: [
      {
        from: [
          {
            namespaceSelector: {},
          },
        ],
        ports: [
          {
            port: 8200,
            protocol: 'TCP',
          },
        ],
      },
    ],
  },
};

export const deploymentJson = {
  apiVersion: 'apps/v1',
  kind: 'Deployment',
  metadata: {
    labels: {
      'app.kubernetes.io/instance': 'vault',
      'app.kubernetes.io/name': 'vault',
    },
    name: 'vault',
  },
  spec: {
    selector: {
      matchLabels: {
        'app.kubernetes.io/instance': 'vault',
        'app.kubernetes.io/name': 'vault',
      },
    },
    template: {
      metadata: {
        labels: {
          'app.kubernetes.io/instance': 'vault',
          'app.kubernetes.io/name': 'vault',
        },
      },
      spec: {
        containers: [
          {
            image: 'vault:1.3.5',
            name: 'vault',
            ports: [
              {
                containerPort: 8200,
                name: 'vaultport',
                protocol: 'TCP',
              },
            ],
            args: ['server', '-log-level=debug'],
            env: [
              {
                name: 'SKIP_SETCAP',
                value: 'true',
              },
              {
                name: 'SKIP_CHOWN',
                value: 'true',
              },
              {
                name: 'VAULT_LOCAL_CONFIG',
                valueFrom: {
                  configMapKeyRef: {
                    name: 'vault-config',
                    key: 'vault-config',
                  },
                },
              },
              {
                name: 'VAULT_ADDR',
                value: 'http://127.0.0.1:8200',
              },
            ],
            volumeMounts: [
              {
                name: 'data',
                mountPath: '/vault/data',
                readOnly: false,
              },
              {
                name: 'config',
                mountPath: '/vault/config',
              },
              {
                name: 'cert',
                mountPath: '/var/run/secrets/kubernetes.io/certs',
              },
            ],
            livenessProbe: {
              httpGet: {
                path: 'v1/sys/health?standbyok=true&standbycode=200&sealedcode=200&uninitcode=200',
                port: 8200,
                scheme: 'HTTP',
              },
            },
            readinessProbe: {
              exec: {
                command: ['/bin/sh', '-ec', 'vault status'],
              },
              failureThreshold: 2,
              initialDelaySeconds: 5,
              periodSeconds: 3,
              successThreshold: 1,
              timeoutSeconds: 5,
            },
            resources: {
              requests: {
                memory: '256Mi',
                cpu: '250m',
              },
              limits: {
                memory: '256Mi',
                cpu: '250m',
              },
            },
            lifecycle: {
              preStop: {
                exec: {
                  command: ['/bin/sh', '-c', 'sleep 5 && kill -SIGTERM $(pidof vault)'],
                },
              },
            },
          },
        ],
        serviceAccount: 'vault',
        serviceAccountName: 'vault',
        volumes: [
          {
            name: 'data',
            persistentVolumeClaim: {
              claimName: 'vault-storage',
            },
          },
          {
            name: 'config',
            emptyDir: {},
          },
          {
            name: 'cert',
            secret: {
              secretName: 'vault-cert',
            },
          },
        ],
      },
    },
  },
};

export const testDeploymentJSON = {
  apiVersion: 'apps/v1',
  kind: 'Deployment',
  metadata: {
    name: 'test-vault-deployment',
    namespace: 'default',
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
                containerPort: 5555,
              },
            ],
            volumeMounts: [
              {
                name: 'task-pv-storage',
                mountPath: '/usr/share/nginx/html',
              },
            ],
          },
        ],
        volumes: [
          {
            name: 'task-pv-storage',
            persistentVolumeClaim: {
              claimName: 'encrypted-pvc',
            },
          },
        ],
      },
    },
  },
};
