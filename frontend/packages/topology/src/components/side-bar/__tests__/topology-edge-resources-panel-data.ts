export const source = {
  kind: 'Deployment',
  apiVersion: 'apps/v1',
  metadata: {
    annotations: {
      'deployment.kubernetes.io/revision': '2',
      'kubectl.kubernetes.io/last-applied-configuration':
        '{"apiVersion":"apps/v1","kind":"Deployment","metadata":{"annotations":{},"labels":{"app":"spring-petclinic-rest"},"name":"spring-petclinic-rest","namespace":"my-postgresql"},"spec":{"replicas":1,"selector":{"matchLabels":{"app":"spring-petclinic-rest"}},"template":{"metadata":{"labels":{"app":"spring-petclinic-rest"}},"spec":{"containers":[{"env":[{"name":"SPRING_PROFILES_ACTIVE","value":"postgresql,spring-data-jpa"}],"image":"quay.io/baijum/spring-petclinic-rest:latest","name":"application","ports":[{"containerPort":9966,"name":"http"}]}]}}}}\n',
    },
    resourceVersion: '171548',
    name: 'spring-petclinic-rest',
    uid: '766693ad-dbfb-4ace-b9da-f1c119f8b6fa',
    creationTimestamp: '2021-12-23T13:03:20Z',
    generation: 2,
    managedFields: [
      {
        manager: 'kubectl-client-side-apply',
        operation: 'Update',
        apiVersion: 'apps/v1',
        time: '2021-12-23T13:03:20Z',
        fieldsType: 'FieldsV1',
        fieldsV1: {
          'f:metadata': {
            'f:annotations': {
              '.': {},
              'f:kubectl.kubernetes.io/last-applied-configuration': {},
            },
            'f:labels': {
              '.': {},
              'f:app': {},
            },
          },
          'f:spec': {
            'f:progressDeadlineSeconds': {},
            'f:replicas': {},
            'f:revisionHistoryLimit': {},
            'f:selector': {},
            'f:strategy': {
              'f:rollingUpdate': {
                '.': {},
                'f:maxSurge': {},
                'f:maxUnavailable': {},
              },
              'f:type': {},
            },
            'f:template': {
              'f:metadata': {
                'f:labels': {
                  '.': {},
                  'f:app': {},
                },
              },
              'f:spec': {
                'f:containers': {
                  'k:{"name":"application"}': {
                    'f:image': {},
                    'f:terminationMessagePolicy': {},
                    '.': {},
                    'f:resources': {},
                    'f:env': {
                      '.': {},
                      'k:{"name":"SPRING_PROFILES_ACTIVE"}': {
                        '.': {},
                        'f:name': {},
                        'f:value': {},
                      },
                    },
                    'f:terminationMessagePath': {},
                    'f:imagePullPolicy': {},
                    'f:ports': {
                      '.': {},
                      'k:{"containerPort":9966,"protocol":"TCP"}': {
                        '.': {},
                        'f:containerPort': {},
                        'f:name': {},
                        'f:protocol': {},
                      },
                    },
                    'f:name': {},
                  },
                },
                'f:dnsPolicy': {},
                'f:restartPolicy': {},
                'f:schedulerName': {},
                'f:securityContext': {},
                'f:terminationGracePeriodSeconds': {},
              },
            },
          },
        },
      },
      {
        manager: 'manager',
        operation: 'Update',
        apiVersion: 'apps/v1',
        time: '2021-12-23T13:03:56Z',
        fieldsType: 'FieldsV1',
        fieldsV1: {
          'f:spec': {
            'f:template': {
              'f:spec': {
                'f:containers': {
                  'k:{"name":"application"}': {
                    'f:env': {
                      'k:{"name":"SERVICE_BINDING_ROOT"}': {
                        '.': {},
                        'f:name': {},
                        'f:value': {},
                      },
                    },
                    'f:volumeMounts': {
                      '.': {},
                      'k:{"mountPath":"/bindings/spring-petclinic-rest-d-hippo-pc"}': {
                        '.': {},
                        'f:mountPath': {},
                        'f:name': {},
                      },
                    },
                  },
                },
                'f:volumes': {
                  '.': {},
                  'k:{"name":"spring-petclinic-rest-d-hippo-pc"}': {
                    '.': {},
                    'f:name': {},
                    'f:secret': {
                      '.': {},
                      'f:defaultMode': {},
                      'f:secretName': {},
                    },
                  },
                },
              },
            },
          },
        },
      },
      {
        manager: 'kube-controller-manager',
        operation: 'Update',
        apiVersion: 'apps/v1',
        time: '2021-12-23T13:03:59Z',
        fieldsType: 'FieldsV1',
        fieldsV1: {
          'f:metadata': {
            'f:annotations': {
              'f:deployment.kubernetes.io/revision': {},
            },
          },
          'f:status': {
            'f:availableReplicas': {},
            'f:conditions': {
              '.': {},
              'k:{"type":"Available"}': {
                '.': {},
                'f:lastTransitionTime': {},
                'f:lastUpdateTime': {},
                'f:message': {},
                'f:reason': {},
                'f:status': {},
                'f:type': {},
              },
              'k:{"type":"Progressing"}': {
                '.': {},
                'f:lastTransitionTime': {},
                'f:lastUpdateTime': {},
                'f:message': {},
                'f:reason': {},
                'f:status': {},
                'f:type': {},
              },
            },
            'f:observedGeneration': {},
            'f:readyReplicas': {},
            'f:replicas': {},
            'f:updatedReplicas': {},
          },
        },
        subresource: 'status',
      },
    ],
    namespace: 'my-postgresql',
    labels: {
      app: 'spring-petclinic-rest',
    },
  },
  spec: {
    replicas: 1,
    selector: {
      matchLabels: {
        app: 'spring-petclinic-rest',
      },
    },
    template: {
      metadata: {
        creationTimestamp: null,
        labels: {
          app: 'spring-petclinic-rest',
        },
      },
      spec: {
        volumes: [
          {
            name: 'spring-petclinic-rest-d-hippo-pc',
            secret: {
              secretName: 'spring-petclinic-rest-d-hippo-pc-2d428a0c',
              defaultMode: 420,
            },
          },
        ],
        containers: [
          {
            resources: {},
            terminationMessagePath: '/dev/termination-log',
            name: 'application',
            env: [
              {
                name: 'SPRING_PROFILES_ACTIVE',
                value: 'postgresql,spring-data-jpa',
              },
              {
                name: 'SERVICE_BINDING_ROOT',
                value: '/bindings',
              },
            ],
            ports: [
              {
                name: 'http',
                containerPort: 9966,
                protocol: 'TCP',
              },
            ],
            imagePullPolicy: 'Always',
            volumeMounts: [
              {
                name: 'spring-petclinic-rest-d-hippo-pc',
                mountPath: '/bindings/spring-petclinic-rest-d-hippo-pc',
              },
            ],
            terminationMessagePolicy: 'File',
            image: 'quay.io/baijum/spring-petclinic-rest:latest',
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
      rollingUpdate: {
        maxUnavailable: '25%',
        maxSurge: '25%',
      },
    },
    revisionHistoryLimit: 10,
    progressDeadlineSeconds: 600,
  },
  status: {
    observedGeneration: 2,
    replicas: 1,
    updatedReplicas: 1,
    readyReplicas: 1,
    availableReplicas: 1,
    conditions: [
      {
        type: 'Available',
        status: 'True',
        lastUpdateTime: '2021-12-23T13:03:31Z',
        lastTransitionTime: '2021-12-23T13:03:31Z',
        reason: 'MinimumReplicasAvailable',
        message: 'Deployment has minimum availability.',
      },
      {
        type: 'Progressing',
        status: 'True',
        lastUpdateTime: '2021-12-23T13:03:59Z',
        lastTransitionTime: '2021-12-23T13:03:20Z',
        reason: 'NewReplicaSetAvailable',
        message: 'ReplicaSet "spring-petclinic-rest-5c758d685d" has successfully progressed.',
      },
    ],
  },
};

export const target = {
  kind: 'PostgresCluster',
  apiVersion: 'postgres-operator.crunchydata.com/v1beta1',
  metadata: {
    annotations: {
      certified: 'true',
      'operatorframework.io/properties':
        '{"properties":[{"type":"olm.package","value":{"packageName":"crunchy-postgres-operator","version":"5.0.4"}},{"type":"olm.gvk","value":{"group":"postgres-operator.crunchydata.com","kind":"PostgresCluster","version":"v1beta1"}}]}',
      repository: 'https://github.com/CrunchyData/postgres-operator',
      support: 'crunchydata.com',
      'olm.properties': '[]',
      'alm-examples':
        '[\n  {\n    "apiVersion": "postgres-operator.crunchydata.com/v1beta1",\n    "kind": "PostgresCluster",\n    "metadata": {\n      "name": "example"\n    },\n    "spec": {\n      "instances": [\n        {\n          "dataVolumeClaimSpec": {\n            "accessModes": [\n              "ReadWriteOnce"\n            ],\n            "resources": {\n              "requests": {\n                "storage": "1Gi"\n              }\n            }\n          },\n          "replicas": 1\n        }\n      ],\n      "postgresVersion": 13\n    }\n  }\n]',
      capabilities: 'Auto Pilot',
      'olm.operatorNamespace': 'openshift-operators',
      containerImage:
        'registry.connect.redhat.com/crunchydata/postgres-operator@sha256:35bd6e284d71881524766662657e60c654a9bc77cd79c43a667cd76b1984dc34',
      createdAt: '2019-12-31 19:40Z',
      categories: 'Database',
      description: 'Production Postgres Made Easy',
      'olm.operatorGroup': 'global-operators',
    },
    resourceVersion: '164376',
    name: 'hippo',
    uid: '12c9dbe0-9d9c-4a4d-9c2a-538b0b59322a',
    creationTimestamp: '2021-12-23T12:57:58Z',
    generation: 1,
    managedFields: [
      {
        apiVersion: 'operators.coreos.com/v1alpha1',
        fieldsType: 'FieldsV1',
        fieldsV1: {
          'f:metadata': {
            'f:annotations': {
              'f:olm.operatorNamespace': {},
              'f:olm.properties': {},
              'f:createdAt': {},
              'f:alm-examples': {},
              'f:description': {},
              'f:olm.operatorGroup': {},
              'f:capabilities': {},
              '.': {},
              'f:containerImage': {},
              'f:categories': {},
              'f:certified': {},
              'f:operatorframework.io/properties': {},
              'f:support': {},
              'f:repository': {},
            },
            'f:labels': {
              '.': {},
              'f:olm.copiedFrom': {},
            },
          },
          'f:spec': {
            'f:version': {},
            'f:maturity': {},
            'f:provider': {
              '.': {},
              'f:name': {},
              'f:url': {},
            },
            'f:links': {},
            'f:install': {
              '.': {},
              'f:spec': {
                '.': {},
                'f:deployments': {},
                'f:permissions': {},
              },
              'f:strategy': {},
            },
            'f:maintainers': {},
            'f:description': {},
            'f:installModes': {},
            'f:minKubeVersion': {},
            'f:icon': {},
            'f:customresourcedefinitions': {
              '.': {},
              'f:owned': {},
            },
            '.': {},
            'f:relatedImages': {},
            'f:cleanup': {
              '.': {},
              'f:enabled': {},
            },
            'f:apiservicedefinitions': {},
            'f:replaces': {},
            'f:displayName': {},
            'f:keywords': {},
          },
        },
        manager: 'olm',
        operation: 'Update',
        time: '2021-12-23T12:57:58Z',
      },
      {
        apiVersion: 'operators.coreos.com/v1alpha1',
        fieldsType: 'FieldsV1',
        fieldsV1: {
          'f:status': {
            'f:lastUpdateTime': {},
            'f:requirementStatus': {},
            'f:phase': {},
            'f:lastTransitionTime': {},
            'f:conditions': {},
            '.': {},
            'f:cleanup': {},
            'f:message': {},
            'f:reason': {},
          },
        },
        manager: 'olm',
        operation: 'Update',
        subresource: 'status',
        time: '2021-12-23T12:58:10Z',
      },
    ],
    namespace: 'my-postgresql',
    labels: {
      'olm.copiedFrom': 'openshift-operators',
    },
  },
  spec: {
    customresourcedefinitions: {
      owned: [
        {
          description: 'PostgresCluster is the Schema for the postgresclusters API',
          displayName: 'Postgres Cluster',
          kind: 'PostgresCluster',
          name: 'postgresclusters.postgres-operator.crunchydata.com',
          resources: [
            {
              kind: 'ConfigMap',
              name: '',
              version: 'v1',
            },
            {
              kind: 'CronJob',
              name: '',
              version: 'v1beta1',
            },
            {
              kind: 'Deployment',
              name: '',
              version: 'v1',
            },
            {
              kind: 'Job',
              name: '',
              version: 'v1',
            },
            {
              kind: 'PersistentVolumeClaim',
              name: '',
              version: 'v1',
            },
            {
              kind: 'Secret',
              name: '',
              version: 'v1',
            },
            {
              kind: 'Service',
              name: '',
              version: 'v1',
            },
            {
              kind: 'StatefulSet',
              name: '',
              version: 'v1',
            },
          ],
          specDescriptors: [
            {
              description:
                'The image name to use for PostgreSQL containers. When omitted, the value comes from an operator environment variable. For standard PostgreSQL images, the format is RELATED_IMAGE_POSTGRES_{postgresVersion}, e.g. RELATED_IMAGE_POSTGRES_13. For PostGIS enabled PostgreSQL images, the format is RELATED_IMAGE_POSTGRES_{postgresVersion}_GIS_{postGISVersion}, e.g. RELATED_IMAGE_POSTGRES_13_GIS_3.1.',
              displayName: 'Image',
              path: 'image',
            },
            {
              description: 'The major version of PostgreSQL installed in the PostgreSQL image',
              displayName: 'Postgres Version',
              path: 'postgresVersion',
            },
            {
              description:
                'Specifies one or more sets of PostgreSQL pods that replicate data for this cluster.',
              displayName: 'Instance Sets',
              path: 'instances',
            },
          ],
          statusDescriptors: [
            {
              description:
                'conditions represent the observations of postgrescluster\'s current state. Known .status.conditions.type are: "PersistentVolumeResizing", "ProxyAvailable"',
              displayName: 'Conditions',
              path: 'conditions',
              'x-descriptors': ['urn:alm:descriptor:io.kubernetes.conditions'],
            },
          ],
          version: 'v1beta1',
        },
      ],
    },
    relatedImages: [
      {
        image:
          'registry.connect.redhat.com/crunchydata/postgres-operator@sha256:35bd6e284d71881524766662657e60c654a9bc77cd79c43a667cd76b1984dc34',
        name:
          'postgres-operator-35bd6e284d71881524766662657e60c654a9bc77cd79c43a667cd76b1984dc34-annotation',
      },
      {
        image:
          'registry.connect.redhat.com/crunchydata/postgres-operator@sha256:35bd6e284d71881524766662657e60c654a9bc77cd79c43a667cd76b1984dc34',
        name: 'operator',
      },
      {
        image:
          'registry.connect.redhat.com/crunchydata/crunchy-pgbackrest@sha256:4256829ed455475e45ef210bea800c42d6eb53497a734428cb753c2af3d46ced',
        name: 'pgbackrest',
      },
      {
        image:
          'registry.connect.redhat.com/crunchydata/crunchy-pgbouncer@sha256:dd8c2aff733a4c064ce5a89bcd2b1e984099c72807e790def526d90dbc7f46dd',
        name: 'pgbouncer',
      },
      {
        image:
          'registry.connect.redhat.com/crunchydata/crunchy-postgres-exporter@sha256:a6f88150ddd3e01d32d1c573ee3022072f98031341d1bed2ae440d772482ce65',
        name: 'pgexporter',
      },
      {
        image:
          'registry.connect.redhat.com/crunchydata/crunchy-postgres@sha256:74e35614839ae674ee210e3850dee01e50c5d3d218eeee2d4d33e778db76ffbc',
        name: 'postgres_12',
      },
      {
        image:
          'registry.connect.redhat.com/crunchydata/crunchy-postgres@sha256:b9a152771c489673a51dfe815c290af5666e68e614ac0dfd1d3ba54a371f47be',
        name: 'postgres_13',
      },
      {
        image:
          'registry.connect.redhat.com/crunchydata/crunchy-postgres@sha256:a2b34428eb1e23cd2a39e85d3da95a35a19715543b13d3d7ab0183ba8083ec33',
        name: 'postgres_14',
      },
      {
        image:
          'registry.connect.redhat.com/crunchydata/crunchy-postgres-gis@sha256:ec92544d41f771e69ce84009ef145e1e59cd31521e4a948c5ecb8f0ddfb8fe9b',
        name: 'postgres_12_gis_2.5',
      },
      {
        image:
          'registry.connect.redhat.com/crunchydata/crunchy-postgres-gis@sha256:a1ec04b12610e2cb1094b85ed8fdd97106c07c048a3480d2baa25d7171284921',
        name: 'postgres_12_gis_3.0',
      },
      {
        image:
          'registry.connect.redhat.com/crunchydata/crunchy-postgres-gis@sha256:23b8deca0a30982f14b433937c1c133e6f257b8599d52be60de9d85571a7f2a3',
        name: 'postgres_13_gis_3.0',
      },
      {
        image:
          'registry.connect.redhat.com/crunchydata/crunchy-postgres-gis@sha256:4e6bfa1def778e9f20506ba980a2bd2cfd392142c1cd072b6892b41a68d56db1',
        name: 'postgres_13_gis_3.1',
      },
      {
        image:
          'registry.connect.redhat.com/crunchydata/crunchy-postgres-gis@sha256:550426086d4647d3c49ec17ffc1fde265ac3026ab042113b64111177eb898fb6',
        name: 'postgres_14_gis_3.1',
      },
    ],
    cleanup: {
      enabled: false,
    },
    apiservicedefinitions: {},
    keywords: ['postgres', 'postgresql', 'database', 'sql', 'operator', 'crunchy data'],
    displayName: 'Crunchy Postgres for Kubernetes',
    provider: {
      name: 'Crunchy Data',
      url: 'https://www.crunchydata.com/',
    },
    maturity: 'stable',
    installModes: [
      {
        supported: true,
        type: 'OwnNamespace',
      },
      {
        supported: true,
        type: 'SingleNamespace',
      },
      {
        supported: false,
        type: 'MultiNamespace',
      },
      {
        supported: true,
        type: 'AllNamespaces',
      },
    ],
    version: '5.0.4',
    icon: [
      {
        base64data:
          'PD94bWwgdmVyc2lvbj0iMS4wIiBlbmNvZGluZz0idXRmLTgiPz4KPHN2ZyB2ZXJzaW9uPSIxLjEiIGlkPSJMYXllcl8xIiB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHhtbG5zOnhsaW5rPSJodHRwOi8vd3d3LnczLm9yZy8xOTk5L3hsaW5rIiB4PSIwcHgiIHk9IjBweCIKCSB2aWV3Qm94PSIwIDAgMzYzLjg1IDM2My4wNSIgc3R5bGU9ImVuYWJsZS1iYWNrZ3JvdW5kOm5ldyAwIDAgMzYzLjg1IDM2My4wNTsiIHhtbDpzcGFjZT0icHJlc2VydmUiPgo8c3R5bGUgdHlwZT0idGV4dC9jc3MiPgoJLnN0MHtmaWxsOiNGRkZGRkY7fQoJLnN0MXtmaWxsOnVybCgjU1ZHSURfMV8pO30KCS5zdDJ7ZmlsbDojNDE0MTQxO30KCS5zdDN7Y2xpcC1wYXRoOnVybCgjU1ZHSURfM18pO30KCS5zdDR7ZmlsbDpub25lO30KCS5zdDV7ZmlsbDp1cmwoI1NWR0lEXzRfKTt9Cgkuc3Q2e2ZpbGw6IzQ2NkJCMjt9Cgkuc3Q3e2ZpbGw6IzFDNDQ5Qjt9Cjwvc3R5bGU+CjxnPgoJPHBhdGggY2xhc3M9InN0MCIgZD0iTTM1My44LDIwOS41M2MtMC4yMy0zLjY1LDEuOTUtNy4wOCw1LjAxLTguOTVjMC4xMS01LjYxLDAuMzctMTEuMjIsMC40My0xNi44NGMwLjA0LTQuMS0wLjA1LTguMi0wLjQ0LTEyLjI5CgkJYy0wLjA4LTAuODktMC4yLTEuNzctMC4yOS0yLjY2Yy0wLjAzLTAuMjEtMC4wNS0wLjM3LTAuMDctMC41MWMtMC4wNy0wLjQxLTAuMTQtMC44My0wLjIyLTEuMjRjLTAuNDEtMi4xNS0wLjkyLTQuMjctMS41LTYuMzgKCQljLTAuNTEtMS44NC0wLjUtMy42Ni0wLjA3LTUuMzNjLTAuNjktMS4zNy0xLjE1LTIuODgtMS4zNS00LjRjLTAuMDYtMC40OC0wLjEzLTAuOTYtMC4yLTEuNDRjLTAuMDItMC4xMy0wLjA1LTAuMjktMC4wOC0wLjQ5CgkJYy0wLjIyLTEuMjMtMC40My0yLjQ2LTAuNjctMy42OGMtMC40Mi0yLjE0LTAuODgtNC4yNi0xLjQtNi4zOGMtMS4xLTQuNTUtMi40Mi05LjA1LTMuODktMTMuNDljLTEuNDQtNC4zNC0yLjktOC43LTQuNTItMTIuOTgKCQljLTAuNzgtMi4wNi0xLjYxLTQuMDktMi40Ny02LjExYy0wLjE0LTAuMy0wLjQ2LTEuMDMtMC42Mi0xLjM3Yy0wLjUxLTEuMDgtMS4wMi0yLjE2LTEuNTYtMy4yM2MtMi4wMS00LjAzLTQuMjMtNy45Ny02LjY1LTExLjc2CgkJYy0xLjExLTEuNzMtMi4yMi0zLjQ3LTMuMzYtNS4xOGMtMC42Mi0wLjkzLTEuMjctMS44NS0xLjk1LTIuNzRjLTAuMjEtMC4yOC0wLjQzLTAuNTYtMC42NS0wLjg0Yy0wLjA4LTAuMS0wLjE4LTAuMjItMC4zMS0wLjM3CgkJYy00Ljg0LTUuNTYtOS45OS0xMC44OC0xNC41Mi0xNi43MWMtMi4yLTAuMzEtNC4zNi0xLjI2LTYuMTEtMi42OGMtMS4xMy0wLjkxLTIuMjYtMS44NS0zLjQ0LTIuNzFjLTAuMjQtMC4xNy0wLjU2LTAuMzktMC44My0wLjU4CgkJYy0wLjQ0LTAuMzItMC44OC0wLjYzLTEuMzItMC45NGMtMi4zNS0xLjY1LTQuNzUtMy4yMy03LjE5LTQuNzVjLTQuOTgtMy4xMS0xMC4xMi01Ljk4LTE1LjMzLTguNjgKCQljLTEwLjUyLTUuNDUtMjEuMzctMTAuMjItMzIuMjktMTQuNzljLTQuNjItMS45My05LjI1LTMuODMtMTMuODgtNS43NGMtMC4zMi0wLjEzLTEuMjMtMC40OS0xLjQ2LTAuNTgKCQljLTAuNTUtMC4yMS0xLjExLTAuNDItMS42Ny0wLjYzYy0xLjMyLTAuNDgtMi42NC0wLjk1LTMuOTgtMS4zOWMtMi42My0wLjg2LTUuMjgtMS42NC03Ljk2LTIuMzNjLTUuNTUtMS40My0xMS4xOC0yLjQzLTE2Ljg2LTMuMTgKCQljLTAuMTMtMC4wMi0wLjI0LTAuMDMtMC4zMy0wLjA1Yy0wLjEzLTAuMDEtMC4yOS0wLjAyLTAuNDktMC4wNGMtMC41OS0wLjA1LTEuMTktMC4xMi0xLjc4LTAuMTdjLTEuMzQtMC4xMi0yLjY4LTAuMjMtNC4wMi0wLjMxCgkJYy0yLjY4LTAuMTgtNS4zNy0wLjI5LTguMDYtMC4zNWMtMTEuMzgtMC4yNi0yMi43NSwwLjQ1LTM0LjA4LDEuNDRjLTMsMC4yNi02LjAyLDAuNS05LjAxLDAuODZjLTAuNDgsMC4wNi0xLjA3LDAuMDgtMS41NiwwLjE5CgkJYy0wLjExLDAuMDItMC4yMSwwLjA1LTAuMywwLjA2Yy0xLjIzLDAuMjEtMi40NiwwLjQ1LTMuNjksMC43MWMtNS4xLDEuMDgtMTAuMTEsMi41OC0xNSw0LjRjLTEuMjgsMC40OC0yLjU1LDAuOTgtMy44MSwxLjQ5CgkJYy0wLjUsMC4yMS0xLjAxLDAuNDMtMS41MSwwLjYzYy0wLjA5LDAuMDQtMC4xNywwLjA3LTAuMjQsMC4xYy0yLjIyLDEuMDMtNC40MywyLjA3LTYuNiwzLjE4Yy00LjUyLDIuMzEtOC45NCw0Ljg0LTEzLjI3LDcuNDgKCQljLTguOTQsNS40Ni0xNy41NSwxMS40NC0yNi4yLDE3LjMzYy00LjMxLDIuOTQtOC43MSw1Ljc0LTEzLjAzLDguNjZjLTIuMjEsMS40OS00LjM5LDMuMDMtNi41Miw0LjY0YzAsMC0wLjQ5LDAuMzgtMC44NywwLjY3CgkJYy0wLjM4LDAuMzEtMC45OSwwLjgxLTEsMC44MmMtMC44NSwwLjcyLTEuNjksMS40Ni0yLjUsMi4yMWMtMS4xMywxLjA1LTIuMjMsMi4xMy0zLjI5LDMuMjVjLTAuNDgsMC41MS0wLjkzLDEuMDctMS40MywxLjU2CgkJYy0wLjEzLDAuMTMtMC40NCwwLjQ5LTAuNTcsMC42NGMtMS40MiwxLjk3LTIuNjUsNC4xMi0zLjksNi4xOWMtMy4yMSw1LjMzLTYuNCwxMC41NC0xMC4xNiwxNS41Yy0xLjgyLDIuNDEtNC43MSwzLjI3LTcuNTgsMy4wNgoJCUM2Ljk2LDEyMy45MiwwLDE1MS42NywwLDE4MS4wNWMwLDEwMC41Miw4MS40OCwxODIsMTgyLDE4MmM4Ny41OSwwLDE2MC43Mi02MS44NywxNzguMDktMTQ0LjI5CgkJQzM1Ni41LDIxNy4yMSwzNTQuMDYsMjEzLjcsMzUzLjgsMjA5LjUzeiIvPgoJPGc+CgkJPGc+CgkJCTxsaW5lYXJHcmFkaWVudCBpZD0iU1ZHSURfMV8iIGdyYWRpZW50VW5pdHM9InVzZXJTcGFjZU9uVXNlIiB4MT0iMTgxLjkyNjMiIHkxPSIwIiB4Mj0iMTgxLjkyNjMiIHkyPSIzMzUuNDA2OCI+CgkJCQk8c3RvcCAgb2Zmc2V0PSIwIiBzdHlsZT0ic3RvcC1jb2xvcjojMjU5Q0Q3Ii8+CgkJCQk8c3RvcCAgb2Zmc2V0PSIxIiBzdHlsZT0ic3RvcC1jb2xvcjojMDY2OEIyIi8+CgkJCTwvbGluZWFyR3JhZGllbnQ+CgkJCTxwYXRoIGNsYXNzPSJzdDEiIGQ9Ik02OS43OSwyOTAuNjdjLTAuNy0zLjg1LTEuMTUtNy43MS0xLjI4LTExLjU5Yy0wLjEzLTMuODcsMC4wNS03Ljc2LDAuNjEtMTEuNjYKCQkJCWMwLjc1LTUuMTYsMi40OS05LjgyLDQuODUtMTQuMTZjMi4zNS00LjM0LDUuMzItOC4zOCw4LjUtMTIuMzFjMC43LTAuODYsMS40MS0xLjcxLDIuMTEtMi41N2MwLjA2LTAuMDcsMC4wNS0wLjE5LDAuMTQtMC42MQoJCQkJYy04LjIyLTEuMDUtMTQuMTctNS4wMy0xNy4zLTEyLjY0Yy0xLjM1LTMuMjctMy43NC00LjY0LTYuNTYtNS4zM2MtMC45NC0wLjIzLTEuOTMtMC4zOC0yLjk0LTAuNWMtMS43MS0wLjItMy40NS0wLjEyLTUuMTQtMC4zOAoJCQkJYy0zLjI0LTAuNS01LjQ1LTIuMjQtNi4zNS00LjkzYy0wLjMtMC45LTAuNDUtMS45LTAuNDUtM2MwLjAxLTEuNi0wLjA5LTIuNjgtMi4wMy0yLjk5Yy0yLjk5LTAuNDgtNS40LTEuNS03LjMxLTIuODkKCQkJCWMtMC45NS0wLjY5LTEuNzgtMS40OC0yLjUtMi4zNGMtMC45MS0xLjA5LTEuNTctMi4zMy0yLjEzLTMuNjJjLTEuMTctMi43My0xLjY2LTUuNzYtMS41My04Ljc1YzAtMC4wMywwLTAuMDUsMC0wLjA4CgkJCQljMC4wNS0xLjExLDAuMTgtMi4yMSwwLjM3LTMuMjhjMS4yMS02Ljc0LDIuOTktMTMuMzgsNC40Mi0yMC4wOGMxLjE5LTUuNjIsMi4yMi0xMS4yOCwzLjM1LTE2LjkxCgkJCQljMS4yNC02LjE3LDUuMjMtMTAuNDMsMTAuMTEtMTMuODhjMS4zMy0wLjk0LDIuMzgtMS45OSwzLjE4LTMuMnMxLjM1LTIuNTcsMS42OS00LjEzYzEuMi01LjUsNC4wOS04LjYxLDguNjMtOS4zNAoJCQkJYzEuNTEtMC4yNSwzLjItMC4yMyw1LjA3LDAuMDVjMS40LDAuMjEsMi43OCwwLjU0LDQuMTksMC43YzEuNjYsMC4xOSwzLjI5LDAuMjgsNC45LDAuMjRjNC44Mi0wLjEyLDkuMzctMS4zOCwxMy41Ni00LjQzCgkJCQljNi4wNS00LjM5LDEyLjI1LTguNTksMTguMjgtMTMuMDJjMC43Ny0wLjU2LDEuMjEtMi4wMiwxLjIzLTMuMDdjMC4wOS00LjM1LTAuMi04LjctMC4wNC0xMy4wNGMwLjA5LTIuNTUsMC40OS00Ljg2LDEuMTgtNi45NAoJCQkJYzIuMDgtNi4yNCw2Ljg1LTEwLjM3LDE0LjIyLTEyLjIyYzUuMTktMS4zLDkuNDMtNC4wNywxMy4yNC03LjYzYzAuMjktMC4yOCwwLjU5LTAuNzYsMC43OC0xLjI0YzAuMTktMC40OCwwLjI3LTAuOTUsMC4xMi0xLjIxCgkJCQljLTEuNDQtMi42NC0xLjk4LTUuMTQtMS44OC03LjU1YzAuMDctMS42LDAuNDItMy4xNiwwLjk3LTQuNjljMC44My0yLjMsMi4xMi00LjUzLDMuNTktNi43M2MwLjQ1LTAuNjcsMC45Mi0xLjMyLDEuNjItMi4zMQoJCQkJYzEuMDcsMS4xNSwyLjE5LDIuMjUsMy4zLDMuMzZjMy4zMSwzLjMzLDYuNDYsNi43NSw3LjUxLDExLjk3YzYuMDgtMS4zLDEyLjI5LTIuNTQsMTguNDYtMy45N2M0LjU2LTEuMDYsOS4xMS0xLjc1LDEzLjY0LTIuMTEKCQkJCWMxMy41OS0xLjA4LDI3LjAxLDAuODYsNDAuMjQsNS4wOGMzLjcyLDEuMTgsNy4xNSwyLjksMTAuNCw0LjljMi43NCwxLjY4LDUuMzYsMy41Miw3Ljc1LDUuN2MxLjc0LDEuNTksMy4zOSwzLjMsNC45Myw1LjEyCgkJCQljMi45MSwzLjQyLDUuODEsNi44NSw4LjY4LDEwLjNjNS43NSw2LjksMTEuMzksMTMuODcsMTYuODIsMjAuOThjMi43MiwzLjU2LDUuMzgsNy4xNSw3Ljk3LDEwLjc5CgkJCQljNS4xOSw3LjI4LDEwLjExLDE0Ljc1LDE0LjY0LDIyLjQ3YzQuNTMsNy43Myw4LjY5LDE1LjcxLDEyLjM0LDI0LjA0YzQuMTQsOS40NCw3LjksMTkuMDQsMTEuOTUsMjguNTIKCQkJCWMwLjY0LDEuNSwxLjY4LDMsMi45MSw0LjAzYzEyLjQyLDEwLjQxLDI0LjA1LDIxLjU1LDM0LjU2LDMzLjY5YzIuODQtMTIuNzcsNC40Ni0yNi4wMSw0LjQ2LTM5LjY0CgkJCQljMC0zNy41MS0xMS4zNy03Mi4zNS0zMC44Mi0xMDEuMzFjLTYuNTMtOS42My0xMy45NS0xOC42Mi0yMi4xNS0yNi44MmMtMjAuNjUtMjAuNjUtNDYuMjEtMzYuMzgtNzQuNzUtNDUuMjgKCQkJCUMyMTguOTksMi44OCwyMDAuNzgsMCwxODEuOTIsMEMxMjUuMzQsMCw3NC42OSwyNS44OSw0MS4yLDY2LjQ2Yy0zLjY3LDQuNDQtNy4xMiw5LjA3LTEwLjM2LDEzLjg1CgkJCQljLTE5LjQ2LDI4Ljk2LTMwLjgzLDYzLjgtMzAuODMsMTAxLjMxYzAsNjQuODIsMzQsMTIxLjU2LDg1LjA0LDE1My43OGMtMy4zMi02Ljc5LTYuMzMtMTMuNjktOC44NC0yMC44CgkJCQlDNzMuNDcsMzA2Ljg2LDcxLjI4LDI5OC45LDY5Ljc5LDI5MC42N3oiLz4KCQkJPGc+CgkJCQk8cGF0aCBjbGFzcz0ic3QyIiBkPSJNNzguNTcsMTQ4LjJsLTAuMTQsMC43N2MwLDAsMy40NSwyMC4zNSwzNy4xNiw3Ljc2Yy0yLjExLTEuNTctMy4yMy00LjAyLTMuMi03LjYyCgkJCQkJYy02LjUyLDUuODYtMTMuODIsNy4yLTIxLjYxLDYuMzFDODUuMTEsMTU0Ljc4LDgwLjk3LDE1MS45Nyw3OC41NywxNDguMnoiLz4KCQkJCTxwYXRoIGNsYXNzPSJzdDIiIGQ9Ik04Mi45NywxMjYuMTlsMC4wOCwwLjAxYzAuMDEtMC4wMSwwLjAxLTAuMDIsMC4wMi0wLjAzQzgzLjAzLDEyNi4xOCw4MywxMjYuMTksODIuOTcsMTI2LjE5eiIvPgoJCQkJPHBhdGggY2xhc3M9InN0MiIgZD0iTTk3LjEsMTQ3Ljk1YzIuNDUtMi4yMSwyLjg2LTYuNSwxLTkuODFjLTEuNDUtMi41OS00LjQxLTMuNjgtNy42NC0yLjU1Yy0yLjMzLDAuODEtNC4yOCwyLjEzLTMuOTMsNS4xNwoJCQkJCWMxLjUzLTAuMjIsMi44Ny0wLjQsNC42OS0wLjY2Yy0xLjQxLDMuMTctMC40NSw1LjMxLDIuMjMsNy4wMWMtMS4xNSwwLjI2LTEuODIsMC40MS0yLjksMC42NQoJCQkJCUM5MywxNDkuODcsOTUuMDgsMTQ5Ljc4LDk3LjEsMTQ3Ljk1eiIvPgoJCQkJPHBhdGggY2xhc3M9InN0MiIgZD0iTTEyMi43OSwxMjAuMThjLTUuNDMsMi41NC0xMC43OSwzLjc2LTE2LjkxLDEuODVjLTMuMzItMS4wMy03LjIyLTAuMTgtMTAuODYtMC4xOAoJCQkJCWM2LjU2LDEuMjEsMTIsMy43OSwxNS4xNiw5LjMzYzUuMDgtNC4wNCwxMC4wOC04LjAzLDE1LjE4LTEyLjA5QzEyNC40MiwxMTkuNDgsMTIzLjU5LDExOS44MSwxMjIuNzksMTIwLjE4eiIvPgoJCQkJPHBhdGggY2xhc3M9InN0MiIgZD0iTTMyNC44MywxODcuNThjLTEuMjQtMS4wNC0yLjI3LTIuNTQtMi45MS00LjAzYy00LjA1LTkuNDgtNy44LTE5LjA4LTExLjk1LTI4LjUyCgkJCQkJYy0zLjY2LTguMzItNy44MS0xNi4zMS0xMi4zNC0yNC4wNGMtNC41My03LjczLTkuNDUtMTUuMTktMTQuNjQtMjIuNDdjLTIuNTktMy42NC01LjI2LTcuMjQtNy45Ny0xMC43OQoJCQkJCWMtNS40My03LjEyLTExLjA4LTE0LjA4LTE2LjgyLTIwLjk4Yy0yLjg3LTMuNDUtNS43Ny02Ljg4LTguNjgtMTAuM2MtMS41NS0xLjgyLTMuMTktMy41My00LjkzLTUuMTIKCQkJCQljLTIuMzktMi4xNy01LjAxLTQuMDItNy43NS01LjdjLTMuMjUtMi02LjY4LTMuNzEtMTAuNC00LjljLTEzLjIzLTQuMjEtMjYuNjUtNi4xNS00MC4yNC01LjA4Yy00LjUzLDAuMzYtOS4wOCwxLjA1LTEzLjY0LDIuMTEKCQkJCQljLTYuMTcsMS40My0xMi4zNywyLjY3LTE4LjQ2LDMuOTdjLTEuMDYtNS4yMi00LjItOC42NC03LjUxLTExLjk3Yy0xLjEtMS4xMS0yLjIzLTIuMjEtMy4zLTMuMzZjLTAuNywwLjk5LTEuMTcsMS42NC0xLjYyLDIuMzEKCQkJCQljLTEuNDcsMi4yMS0yLjc2LDQuNDQtMy41OSw2LjczYy0wLjU1LDEuNTMtMC45MSwzLjA5LTAuOTcsNC42OWMtMC4xLDIuNCwwLjQzLDQuOSwxLjg4LDcuNTVjMC4xNCwwLjI2LDAuMDYsMC43My0wLjEyLDEuMjEKCQkJCQljLTAuMTksMC40OC0wLjQ4LDAuOTYtMC43OCwxLjI0Yy0zLjgsMy41Ni04LjA1LDYuMzMtMTMuMjQsNy42M2MtNy4zNywxLjg1LTEyLjE0LDUuOTgtMTQuMjIsMTIuMjIKCQkJCQljLTAuNjksMi4wOC0xLjA5LDQuNC0xLjE4LDYuOTRjLTAuMTYsNC4zNCwwLjE0LDguNywwLjA0LDEzLjA0Yy0wLjAyLDEuMDUtMC40NywyLjUxLTEuMjMsMy4wNwoJCQkJCWMtNi4wMyw0LjQzLTEyLjIyLDguNjMtMTguMjgsMTMuMDJjLTQuMTksMy4wNC04Ljc0LDQuMzEtMTMuNTYsNC40M2MtMS42MSwwLjA0LTMuMjQtMC4wNS00LjktMC4yNAoJCQkJCWMtMS40LTAuMTYtMi43OS0wLjUtNC4xOC0wLjdjLTEuODctMC4yOC0zLjU2LTAuMy01LjA3LTAuMDVjLTQuNTMsMC43NC03LjQyLDMuODQtOC42Myw5LjM0Yy0wLjM0LDEuNTctMC44OSwyLjkzLTEuNjksNC4xMwoJCQkJCWMtMC44LDEuMjEtMS44NCwyLjI2LTMuMTgsMy4yYy00Ljg4LDMuNDUtOC44Nyw3LjcxLTEwLjExLDEzLjg4Yy0xLjEzLDUuNjMtMi4xNiwxMS4yOS0zLjM1LDE2LjkxCgkJCQkJYy0xLjQyLDYuNzEtMy4yLDEzLjM0LTQuNDIsMjAuMDhjLTAuMTksMS4wNy0wLjMyLDIuMTctMC4zNywzLjI4YzAsMC4wMywwLDAuMDUsMCwwLjA4Yy0wLjEzLDIuOTksMC4zNSw2LjAzLDEuNTMsOC43NQoJCQkJCWMwLjU2LDEuMjksMS4yMiwyLjUzLDIuMTMsMy42MmMwLjcxLDAuODYsMS41NCwxLjY1LDIuNSwyLjM0YzEuOTEsMS4zOSw0LjMyLDIuNCw3LjMxLDIuODljMS45NCwwLjMxLDIuMDQsMS4zOCwyLjAzLDIuOTkKCQkJCQljMCwxLjEsMC4xNSwyLjEsMC40NSwzYzAuOSwyLjY5LDMuMTEsNC40Myw2LjM1LDQuOTNjMS42OSwwLjI2LDMuNDQsMC4xOCw1LjE0LDAuMzhjMS4wMSwwLjEyLDIsMC4yNywyLjk0LDAuNQoJCQkJCWMyLjgyLDAuNjgsNS4yMSwyLjA2LDYuNTUsNS4zM2MzLjEzLDcuNiw5LjA4LDExLjU4LDE3LjMsMTIuNjRjLTAuMDksMC40MS0wLjA4LDAuNTQtMC4xNCwwLjYxYy0wLjcsMC44Ni0xLjQxLDEuNzEtMi4xMSwyLjU3CgkJCQkJYy0zLjE5LDMuOTMtNi4xNSw3Ljk2LTguNSwxMi4zMWMtMi4zNSw0LjM1LTQuMSw5LTQuODUsMTQuMTZjLTAuNTcsMy45LTAuNzUsNy43OS0wLjYxLDExLjY2YzAuMTMsMy44OCwwLjU4LDcuNzQsMS4yOCwxMS41OQoJCQkJCWMxLjQ5LDguMjMsMy42NywxNi4xOSw2LjQxLDIzLjk0YzIuNTEsNy4xLDUuNTIsMTQuMDEsOC44NCwyMC44YzYuMjUsMy45NCwxMi43NSw3LjQ5LDE5LjQ4LDEwLjY2CgkJCQkJYzIuMTYtOC42NSw0Ljc0LTE3LjI0LDcuODktMjUuNzNjMS44LTQuODcsNC40NS05LjU1LDcuMzYtMTMuODdjNS44Ny04LjcxLDE0LjIxLTEyLjkzLDI0Ljg3LTEyLjE3CgkJCQkJYzIzLjI4LDEuNjUsNDUuMzMsNy41LDY2LjEyLDE4LjMzYzE3LjAyLDguODYsMjcuNzMsMjIuMSwzMi44NSwzOS45NmM4LTIuODksMTUuNzktNi4yLDIzLjIyLTEwLjEzCgkJCQkJYy0wLjA1LTAuMTMtMC4xMi0wLjIzLTAuMTUtMC4zOGMtMi42Ny0xMy40MywxLjEyLTM2LjE1LDE3LjQyLTQ1Ljg1YzkuNzctNS44MSwyMC4zNy0xMC4yMywzMC42NC0xNS4xOAoJCQkJCWMyLjY5LTEuMjksNS41Ny0yLjE5LDguNzQtMy40MmMtMi40MS0xLjM3LTQuNS0yLjU0LTYuNTctMy43NWMtMTAuNTktNi4xOC0yMC41NC0xMy4yMS0yOS44Ny0yMS4yNAoJCQkJCWMtMTMuMDMtMTEuMjEtMTUuNzEtMjUuMDMtMTEuNTYtNDAuODljMC44MS0zLjEsMi02LjEsMy4wOC05LjM0Yy0wLjczLDAuNTMtMS4zMywwLjk2LTIuNTEsMS44MQoJCQkJCWM0LjM5LTEwLjQ3LDUuOC0yMC44Myw1LjY1LTMxLjQxYy0wLjA2LTQuNTQtMC43OS05LjA3LTAuODUtMTMuNjFjLTAuMDYtMy43MiwwLjQxLTcuNDUsMC42Ni0xMS4xN2MwLjEzLTIsMC4yOC0zLjk5LDAuNDUtNi40OAoJCQkJCWMtNC45MSwxLjItNy45OC0wLjkxLTkuNjktNC44OGMwLjc5LDcuMjQsMi4xNywxNC40MiwyLjIxLDIxLjYxYzAuMDUsOS41LTMuOSwxOC4xNy04LjI2LDI2LjM2CgkJCQkJYy04Ljg3LDE2LjY4LTIyLjk5LDI3LjkzLTM5LjU2LDM2LjM2Yy02LjQ2LDMuMjktMTIuNzMsMi4zOS0xOC44Mi0xLjA0Yy0yLjExLTEuMTktNC4xNS0yLjUyLTYuMjctMy42OQoJCQkJCWMtMS45Ny0xLjA5LTIuOTEtMi4zMi0yLjIyLTQuODNjMC42OC0yLjQ4LDIuMTYtMy4xOSw0LjM3LTMuMzFjMC4xLTAuMDEsMC4yLTAuMDQsMC4zLTAuMDJjNi4zNCwxLjA1LDkuNTgtMi45MSwxMS44My03Ljc5CgkJCQkJYzIuMTgtNC43NS0wLjA0LTktMi40NS0xMy4zYy0yLjA3LDAuNTgtNC4wNywwLjk3LTUuOTEsMS43NGMtMC44NywwLjM2LTEuNjEsMS4zNy0yLjA5LDIuMjVjLTMuNzEsNi44My03LjExLDEzLjgzLTExLjEyLDIwLjQ3CgkJCQkJYy0xNy4xNywyNi41Mi00NS40MSwxOC4xMi00NS40MSwxOC4xMmMtMTUuMjYtMi42Ny0zNy43OC0wLjc2LTM3Ljc4LTAuNzZjLTguNzgsMS41My0yNC40MiwxLjkxLTI0LjQyLDEuOTEKCQkJCQljLTExLjgzLDAtMTQuODgtMTIuMzQtMTQuODgtMTIuMzRjNi42MS00LjMyLDQ2LjA0LDEuNzgsNDYuMDQsMS43OGMyNi4wNCwzLjc1LDQzLjUyLTYuMTIsNTAuMTMtMTAuNzcKCQkJCQljLTM0Ljc0LDE2LjA4LTc2LjUyLTYuMjktMTEyLjYsMi45Yy0zLjU0LDAuOS01LjA0LTQuNTYtMS41MS01LjQ2YzI5LjMxLTcuNDYsNjMuNDQsNi40Miw5My40MSwyLjY3CgkJCQkJYzEwLjk5LTIuMDUsMjEuMjYtNi41MSwzMC44LTEyLjU4YzMuOTktMi41NCw2LjE2LTYuMzgsNi4xNC0xMS4yM2MtMC4wMi00LjM0LDAuMzItOC43Ni0wLjM0LTEzLjAyCgkJCQkJYy0xLjk5LTEyLjktMTYuNTgtMjQuMDMtMjkuOTMtMjMuMDljMCwwLDIwLjI1LDEyLjIsMjEuODgsMjMuMzRjNS41NywyMS43MS0zMS41OCwyNi42NS0zMS41OCwyNi42NXMtMjEuOTgsNC44OS00OC41OS0zLjkxCgkJCQkJYzAsMC0xOS4yMi00LjMzLTQ1LjM4LDMuMDZjMCwwLTkuMTIsMy4zOC0xMC4yNi00Ljg0Yy0wLjgxLTUuODQsMS4wNy0xOS44LDcuNTQtMzkuM2wtMC4xLTAuMmMwLjA2LDAuMDEsMC4xMS0wLjAxLDAuMTYtMC4wMQoJCQkJCWMwLjIxLTAuNjMsMC4zOC0xLjIsMC42LTEuODRjMCwwLDIuNzUsMC45Myw2LjY4LDEuMDRjMTAuMDgtMi45OCwxNC44My0xMy4zMiwxNC44My0xMy4zMmwtOC4wNCw1LjY1bDAuNTgtMS4wNgoJCQkJCWMtMy4wNSw0LjAxLTguOTgsNS4yOC0xMy4xNywyLjMxYy0yLjYxLTEuODUtMi41NC00LjI5LDAuMzQtNi4zOWMwLjY2LTAuNDgsMS4zNi0wLjkzLDIuMDUtMS4zOGMwLjAxLDAuMjEtMC4xMiwwLjQtMC4wNywwLjYxCgkJCQkJYzIuNjksMC4zOSw3LjQ1LTAuMjUsOS4xNS0yLjU2YzEuMDgtMS40NywxLjMyLTYuNy0xLjMzLTdjMC45LTUsMy4yOC03LjAzLDkuMDUtNy4wNWMzLjg0LTAuMDIsNy42OSwwLjI5LDExLjUzLDAuMTIKCQkJCQljNi4wOS0wLjI2LDExLjctMi4yLDE2LjU4LTUuODdjMTMuNDEtMTAuMDksMjYuNzYtMjAuMjgsNDAuMTMtMzAuNDNjMC4xNC0wLjEsMC4xNy0wLjM0LDAuMy0wLjZjLTIuODktMC4xMy01Ljc2LTAuMS04LjU5LTAuNDQKCQkJCQljLTMuNTItMC40Mi02LjcxLTEuNjctOC41LTUuMDZjLTIuMDktMy45Ni0wLjQ3LTYuOSwzLjcyLTguMjhjMy43OC0xLjI1LDcuODQtMi42NSwxMC44NC01LjEyCgkJCQkJYzE4LjQyLTE1LjIsNDAuMDgtMTcuNzEsNjIuNjctMTYuNDJjNi4zNCwwLjM2LDEyLjY2LDEuNDksMTguOTEsMi43OWMtMi4wNSwwLjQ5LTExLjQ1LDIuOTYtMTQuMzYsNy41NwoJCQkJCWMtMC45OSwxLjc2LTIuNjUsMy42My0zLjAzLDUuNzRjLTAuMjcsMS40OCwxLjIyLDMuMjgsMS45Miw0Ljk0YzEuMjQtMC45NiwyLjUtMS44OSwzLjctMi44OWMwLjI4LTAuMjMsMC4zOC0wLjcxLDAuNS0xLjA5CgkJCQkJYzEuNzItNS4zNiw2LjE2LTcuOTUsMTAuODYtMTAuOThjMC40MywyLjEsMC42MSwzLjc5LDEuMTMsNS4zOGMwLjcsMi4xNi0wLjI2LDMuNTgtMS44OCw0LjYyYy0wLjgyLDAuNTMtMS45NiwwLjU2LTIuOTYsMC44MgoJCQkJCWMtMC4yLTEuMTEtMC41Ni0yLjIyLTAuNTMtMy4zMmMwLjAyLTAuOSwwLjUxLTEuNzksMC43OS0yLjY4Yy00Ljk4LDMuMjMtNi44OCw4LjItOC43MywxMy40MWMxLjE4LDAuNDIsMi4wMywwLjcyLDIuMzIsMC44MgoJCQkJCWMtMC41OCwxLjg5LTEuMTMsMy42OC0xLjcsNS41NGw0LjMxLTIuMTNjMi44Ni0xLDUuMDQtMS43Myw3LjItMi41M2MzLjM0LTEuMjQsNC45NC0zLjc3LDQuOTYtNy4yNAoJCQkJCWMwLjA0LTUuNDktMS42LTEwLjU2LTMuOTktMTUuODdjMC43OCwwLjE2LDEuNTYsMC4yOCwyLjM0LDAuNDVjNy42OSwxLjY4LDE0LjEyLDYuMDQsMTkuNTQsMTEuNjcKCQkJCQljNC4yNyw0LjQ0LDguNzgsOC44MywxMi4xNywxMy45MWM3Ljc2LDExLjYxLDE4LjQ0LDIwLjc3LDI2LjA5LDMyLjQ4YzEzLjgyLDIxLjE0LDI2LjEzLDQzLjAzLDM1LjIsNjYuNjUKCQkJCQljMC4zOSwxLjAxLDAuNzIsMi4wNSwxLjEyLDMuMThjLTIuOTQsMC45My01LjcyLDEuOC04LjQzLDIuNjVjMTcuNzgsNy4zMSwzMC4wOCwyMS4zOSw0Mi45OSwzNC41NQoJCQkJCWMzLjM2LDMuNDMsNi41Myw3LjAyLDkuNjEsMTAuNjdjMC44NC0zLjAyLDEuNjYtNi4wNiwyLjM1LTkuMTRDMzQ4Ljg3LDIwOS4xMiwzMzcuMjUsMTk3Ljk5LDMyNC44MywxODcuNTh6IE0xNjMuMTcsMjYyLjM0CgkJCQkJYzIwLjY4LDIuMzQsNDAuOTYsMS40Miw1OC42Mi0xMS41MWM3LjI0LTUuMywxMy45LTExLjM4LDIwLjg3LTE3LjA2YzEuMDYtMC44NiwyLjI3LTEuNzUsMy41NS0yLjA3CgkJCQkJYzguODYtMi4xOSwxNi4yNi02LjU0LDIxLjYyLTE0LjA4YzAuMTUtMC4yMSwwLjQzLTAuMzIsMS4yOS0wLjk0Yy0wLjg5LDIuNjItMS4xOSw0Ljg0LTIuMzEsNi41Yy0xLjgxLDIuNjgtMi4yMSw1LjUyLTIuNCw4LjU4CgkJCQkJYy0xLjA1LDE2LjczLTIuOTIsMzMuMjctMTEuNTQsNDguMThjLTAuMSwwLjE3LTAuMiwwLjM1LTAuMjgsMC41NGMtNS42LDEzLjU2LTE2LjUsMTguMzEtMzAuMywxOC4xNAoJCQkJCWMtMTAuMjktMC4xMy0yMC4yNS0yLjQtMzAuMTMtNWwtNTUuMzEtMTQuNzNjLTYuNDQtMi42OS02Ljk5LTQuMDYtNC4xMi0xMC4yM2MyLjk4LTYuNCw2LjAyLTEyLjc3LDkuMjQtMTkuNTkKCQkJCQlDMTQ1Ljk2LDI1OC45NiwxNTQuNCwyNjEuMzUsMTYzLjE3LDI2Mi4zNHogTTg3LjM1LDI0Ny40NWM4LjU5LTEwLjQ0LDguNC0xMS4wNCwyMS44MS0xMS40MmM5LjUyLTAuMjcsMTkuMDksMC45MSwyOS4yOSwxLjQ5CgkJCQkJYy0wLjg1LDEuOTktMS4yOCwzLjA5LTEuNzgsNC4xNWMtNC44MywxMC4zNC05LjczLDIwLjY2LTE0LjQ3LDMxLjA0Yy0wLjg4LDEuOTMtMS44LDIuMzQtMy45LDEuOTkKCQkJCQljLTYuMzktMS4wNi0xMi42Ny0wLjYtMTkuMDQsMi44MWMxLjYzLDAuMiwyLjg3LDAuMTEsMy45MiwwLjUzYzIuNjQsMS4wNyw1LjY2LDEuODUsNy42NywzLjY5YzMuNTksMy4yOCw0LjQ5LDYuOTMsMi40MywxMi4zMQoJCQkJCWMtNS42OSwxNC44OC0xMC4yNiwzMC4xOS0xNS4yNyw0NS4zM2MtMC4xOCwwLjU2LTAuMzYsMS4xMi0wLjU0LDEuNjdjLTAuMzIsMC4xLTAuNjQsMC4yMS0wLjk2LDAuMzIKCQkJCQljLTMuMjctNy4xNC02LjcyLTE0LjE5LTkuNzUtMjEuNDNjLTUuMTMtMTIuMjUtOC45LTI0Ljg5LTEwLjIxLTM4LjJDNzUuMjksMjY4LjcxLDc5LjA5LDI1Ny41LDg3LjM1LDI0Ny40NXoiLz4KCQkJCTxwYXRoIGNsYXNzPSJzdDIiIGQ9Ik0xNTcuNTYsMTAxLjljMi45MS0yLjcxLDUuNDMtNC4yNyw3LjA0LTUuMWMtMC4zOSwyLjEzLDEuNyw1LjY5LDUuOTUsNi4yMmM3Ljk2LDAuMTEsNy44OC05LjIzLDcuODgtOS4yMwoJCQkJCWMyLjA2LTAuNTUsNC40Ni0wLjc5LDQuNDYtMC43OUMxNjYuMTksODUuMDIsMTU3LjU2LDEwMS45LDE1Ny41NiwxMDEuOXoiLz4KCQkJPC9nPgoJCTwvZz4KCTwvZz4KPC9nPgo8L3N2Zz4K',
        mediatype: 'image/svg+xml',
      },
    ],
    minKubeVersion: '1.18.0',
    links: [
      {
        name: 'Crunchy Data',
        url: 'https://www.crunchydata.com/',
      },
      {
        name: 'Documentation',
        url: 'https://access.crunchydata.com/documentation/postgres-operator/v5/',
      },
    ],
    install: {
      spec: {
        deployments: [
          {
            name: 'pgo',
            spec: {
              replicas: 1,
              selector: {
                matchLabels: {
                  'postgres-operator.crunchydata.com/control-plane': 'postgres-operator',
                },
              },
              strategy: {
                type: 'Recreate',
              },
              template: {
                metadata: {
                  creationTimestamp: null,
                  labels: {
                    'postgres-operator.crunchydata.com/control-plane': 'postgres-operator',
                  },
                },
                spec: {
                  containers: [
                    {
                      env: [
                        {
                          name: 'RELATED_IMAGE_PGBACKREST',
                          value:
                            'registry.connect.redhat.com/crunchydata/crunchy-pgbackrest@sha256:4256829ed455475e45ef210bea800c42d6eb53497a734428cb753c2af3d46ced',
                        },
                        {
                          name: 'RELATED_IMAGE_PGBOUNCER',
                          value:
                            'registry.connect.redhat.com/crunchydata/crunchy-pgbouncer@sha256:dd8c2aff733a4c064ce5a89bcd2b1e984099c72807e790def526d90dbc7f46dd',
                        },
                        {
                          name: 'RELATED_IMAGE_PGEXPORTER',
                          value:
                            'registry.connect.redhat.com/crunchydata/crunchy-postgres-exporter@sha256:a6f88150ddd3e01d32d1c573ee3022072f98031341d1bed2ae440d772482ce65',
                        },
                        {
                          name: 'RELATED_IMAGE_POSTGRES_12',
                          value:
                            'registry.connect.redhat.com/crunchydata/crunchy-postgres@sha256:74e35614839ae674ee210e3850dee01e50c5d3d218eeee2d4d33e778db76ffbc',
                        },
                        {
                          name: 'RELATED_IMAGE_POSTGRES_13',
                          value:
                            'registry.connect.redhat.com/crunchydata/crunchy-postgres@sha256:b9a152771c489673a51dfe815c290af5666e68e614ac0dfd1d3ba54a371f47be',
                        },
                        {
                          name: 'RELATED_IMAGE_POSTGRES_14',
                          value:
                            'registry.connect.redhat.com/crunchydata/crunchy-postgres@sha256:a2b34428eb1e23cd2a39e85d3da95a35a19715543b13d3d7ab0183ba8083ec33',
                        },
                        {
                          name: 'RELATED_IMAGE_POSTGRES_12_GIS_2.5',
                          value:
                            'registry.connect.redhat.com/crunchydata/crunchy-postgres-gis@sha256:ec92544d41f771e69ce84009ef145e1e59cd31521e4a948c5ecb8f0ddfb8fe9b',
                        },
                        {
                          name: 'RELATED_IMAGE_POSTGRES_12_GIS_3.0',
                          value:
                            'registry.connect.redhat.com/crunchydata/crunchy-postgres-gis@sha256:a1ec04b12610e2cb1094b85ed8fdd97106c07c048a3480d2baa25d7171284921',
                        },
                        {
                          name: 'RELATED_IMAGE_POSTGRES_13_GIS_3.0',
                          value:
                            'registry.connect.redhat.com/crunchydata/crunchy-postgres-gis@sha256:23b8deca0a30982f14b433937c1c133e6f257b8599d52be60de9d85571a7f2a3',
                        },
                        {
                          name: 'RELATED_IMAGE_POSTGRES_13_GIS_3.1',
                          value:
                            'registry.connect.redhat.com/crunchydata/crunchy-postgres-gis@sha256:4e6bfa1def778e9f20506ba980a2bd2cfd392142c1cd072b6892b41a68d56db1',
                        },
                        {
                          name: 'RELATED_IMAGE_POSTGRES_14_GIS_3.1',
                          value:
                            'registry.connect.redhat.com/crunchydata/crunchy-postgres-gis@sha256:550426086d4647d3c49ec17ffc1fde265ac3026ab042113b64111177eb898fb6',
                        },
                        {
                          name: 'PGO_TARGET_NAMESPACE',
                          valueFrom: {
                            fieldRef: {
                              fieldPath: "metadata.annotations['olm.targetNamespaces']",
                            },
                          },
                        },
                        {
                          name: 'CRUNCHY_DEBUG',
                          value: 'true',
                        },
                      ],
                      image:
                        'registry.connect.redhat.com/crunchydata/postgres-operator@sha256:35bd6e284d71881524766662657e60c654a9bc77cd79c43a667cd76b1984dc34',
                      name: 'operator',
                      resources: {},
                      securityContext: {
                        allowPrivilegeEscalation: false,
                        readOnlyRootFilesystem: true,
                        runAsNonRoot: true,
                      },
                    },
                  ],
                  serviceAccountName: 'pgo',
                },
              },
            },
          },
        ],
        permissions: [
          {
            rules: [
              {
                apiGroups: [''],
                resources: ['configmaps', 'persistentvolumeclaims', 'secrets', 'services'],
                verbs: ['create', 'delete', 'get', 'list', 'patch', 'watch'],
              },
              {
                apiGroups: [''],
                resources: ['endpoints'],
                verbs: ['create', 'delete', 'deletecollection', 'get', 'list', 'patch', 'watch'],
              },
              {
                apiGroups: [''],
                resources: ['endpoints/restricted', 'pods/exec'],
                verbs: ['create'],
              },
              {
                apiGroups: [''],
                resources: ['events'],
                verbs: ['create', 'patch'],
              },
              {
                apiGroups: [''],
                resources: ['pods'],
                verbs: ['delete', 'get', 'list', 'patch', 'watch'],
              },
              {
                apiGroups: [''],
                resources: ['serviceaccounts'],
                verbs: ['create', 'get', 'list', 'patch', 'watch'],
              },
              {
                apiGroups: ['apps'],
                resources: ['deployments', 'statefulsets'],
                verbs: ['create', 'delete', 'get', 'list', 'patch', 'watch'],
              },
              {
                apiGroups: ['batch'],
                resources: ['cronjobs', 'jobs'],
                verbs: ['create', 'delete', 'get', 'list', 'patch', 'watch'],
              },
              {
                apiGroups: ['postgres-operator.crunchydata.com'],
                resources: ['postgresclusters'],
                verbs: ['get', 'list', 'patch', 'watch'],
              },
              {
                apiGroups: ['postgres-operator.crunchydata.com'],
                resources: ['postgresclusters/finalizers'],
                verbs: ['update'],
              },
              {
                apiGroups: ['postgres-operator.crunchydata.com'],
                resources: ['postgresclusters/status'],
                verbs: ['patch'],
              },
              {
                apiGroups: ['rbac.authorization.k8s.io'],
                resources: ['rolebindings', 'roles'],
                verbs: ['create', 'get', 'list', 'patch', 'watch'],
              },
            ],
            serviceAccountName: 'pgo',
          },
        ],
      },
      strategy: 'deployment',
    },
    maintainers: [
      {
        email: 'info@crunchydata.com',
        name: 'Crunchy Data',
      },
    ],
    description:
      '[PGO](https://github.com/CrunchyData/postgres-operator), the\n[Postgres Operator](https://github.com/CrunchyData/postgres-operator) from\n[Crunchy Data](https://www.crunchydata.com), gives you a **declarative Postgres** solution that\nautomatically manages your [PostgreSQL](https://www.postgresql.org) clusters.\n\nDesigned for your GitOps workflows, it is [easy to get started](https://access.crunchydata.com/documentation/postgres-operator/v5/quickstart/)\nwith Postgres on Kubernetes with PGO. Within a few moments, you can have a production grade Postgres\ncluster complete with high availability, disaster recovery, and monitoring, all over secure TLS communications.\nEven better, PGO lets you easily customize your Postgres cluster to tailor it to your workload!\n\nWith conveniences like cloning Postgres clusters to using rolling updates to roll out disruptive\nchanges with minimal downtime, PGO is ready to support your Postgres data at every stage of your\nrelease pipeline. Built for resiliency and uptime, PGO will keep your desired Postgres in a desired\nstate so you do not need to worry about it.\n\nPGO is developed with many years of production experience in automating Postgres management on\nKubernetes, providing a seamless cloud native Postgres solution to keep your data always available.\n\n- **PostgreSQL Cluster Provisioning**: [Create, Scale, & Delete PostgreSQL clusters with ease][provisioning],\n  while fully customizing your Pods and PostgreSQL configuration!\n- **High-Availability**: Safe, automated failover backed by a [distributed consensus based high-availability solution][high-availability].\n  Uses [Pod Anti-Affinity][k8s-anti-affinity] to help resiliency; you can configure how aggressive this can be!\n  Failed primaries automatically heal, allowing for faster recovery time. You can even create regularly scheduled\n  backups as well and set your backup retention policy\n- **Disaster Recovery**: [Backups][backups] and [restores][disaster-recovery] leverage the open source [pgBackRest][] utility and\n  [includes support for full, incremental, and differential backups as well as efficient delta restores][backups].\n  Set how long you want your backups retained for. Works great with very large databases!\n- **Monitoring**: [Track the health of your PostgreSQL clusters][monitoring] using the open source [pgMonitor][] library.\n- **Clone**: [Create new clusters from your existing clusters or backups][clone] with efficient data cloning.\n- **TLS**: All connections are over [TLS][tls]. You can also [bring your own TLS infrastructure][tls] if you do not want to use the provided defaults.\n- **Connection Pooling**: Advanced [connection pooling][pool] support using [pgBouncer][].\n- **Affinity and Tolerations**: Have your PostgreSQL clusters deployed to [Kubernetes Nodes][k8s-nodes] of your preference.\n  Set your [pod anti-affinity][k8s-anti-affinity], node affinity, Pod tolerations and more rules to customize your deployment topology!\n- **Full Customizability**: Crunchy PostgreSQL for Kubernetes makes it easy to get your own PostgreSQL-as-a-Service up and running\n  and fully customize your deployments, including:\n    - Choose the resources for your Postgres cluster: [container resources and storage size][resize-cluster]. [Resize at any time][resize-cluster] with minimal disruption.\n    - Use your own container image repository, including support `imagePullSecrets` and private repositories\n    - [Customize your PostgreSQL configuration][customize-cluster]\n\nand much more!\n\n[backups]: https://access.crunchydata.com/documentation/postgres-operator/v5/tutorial/backups/\n[clone]: https://access.crunchydata.com/documentation/postgres-operator/v5/tutorial/disaster-recovery/#clone-a-postgres-cluster\n[customize-cluster]: https://access.crunchydata.com/documentation/postgres-operator/v5/tutorial/customize-cluster/\n[disaster-recovery]: https://access.crunchydata.com/documentation/postgres-operator/v5/tutorial/disaster-recovery/\n[high-availability]: https://access.crunchydata.com/documentation/postgres-operator/v5/tutorial/high-availability/\n[monitoring]: https://access.crunchydata.com/documentation/postgres-operator/v5/tutorial/monitoring/\n[pool]: https://access.crunchydata.com/documentation/postgres-operator/v5/tutorial/connection-pooling/\n[provisioning]: https://access.crunchydata.com/documentation/postgres-operator/v5/tutorial/create-cluster/\n[resize-cluster]: https://access.crunchydata.com/documentation/postgres-operator/v5/tutorial/resize-cluster/\n[tls]: https://access.crunchydata.com/documentation/postgres-operator/v5/tutorial/customize-cluster/#customize-tls\n\n[k8s-anti-affinity]: https://kubernetes.io/docs/concepts/configuration/assign-pod-node/#inter-pod-affinity-and-anti-affinity\n[k8s-nodes]: https://kubernetes.io/docs/concepts/architecture/nodes/\n\n[pgBackRest]: https://www.pgbackrest.org\n[pgBouncer]: https://access.crunchydata.com/documentation/postgres-operator/v5/tutorial/connection-pooling/\n[pgMonitor]: https://github.com/CrunchyData/pgmonitor\n\n\n## Post-Installation\n\n### Tutorial\n\nWant to [learn more about the PostgreSQL Operator][tutorial]? Browse through the [tutorial][] to learn more about what you can do!\n\n[tutorial]: https://access.crunchydata.com/documentation/postgres-operator/v5/tutorial',
    replaces: 'postgresoperator.v5.0.3',
  },
  status: {
    cleanup: {},
    conditions: [
      {
        lastTransitionTime: '2021-12-23T12:57:56Z',
        lastUpdateTime: '2021-12-23T12:57:56Z',
        message: 'requirements not yet checked',
        phase: 'Pending',
        reason: 'RequirementsUnknown',
      },
      {
        lastTransitionTime: '2021-12-23T12:57:56Z',
        lastUpdateTime: '2021-12-23T12:57:56Z',
        message: "one or more requirements couldn't be found",
        phase: 'Pending',
        reason: 'RequirementsNotMet',
      },
      {
        lastTransitionTime: '2021-12-23T12:57:58Z',
        lastUpdateTime: '2021-12-23T12:57:58Z',
        message: 'all requirements found, attempting install',
        phase: 'InstallReady',
        reason: 'AllRequirementsMet',
      },
      {
        lastTransitionTime: '2021-12-23T12:57:59Z',
        lastUpdateTime: '2021-12-23T12:57:59Z',
        message: 'waiting for install components to report healthy',
        phase: 'Installing',
        reason: 'InstallSucceeded',
      },
      {
        lastTransitionTime: '2021-12-23T12:57:59Z',
        lastUpdateTime: '2021-12-23T12:58:00Z',
        message:
          'installing: waiting for deployment pgo to become ready: deployment "pgo" not available: Deployment does not have minimum availability.',
        phase: 'Installing',
        reason: 'InstallWaiting',
      },
      {
        lastTransitionTime: '2021-12-23T12:58:08Z',
        lastUpdateTime: '2021-12-23T12:58:08Z',
        message: 'install strategy completed with no errors',
        phase: 'Succeeded',
        reason: 'InstallSucceeded',
      },
    ],
    lastTransitionTime: '2021-12-23T12:58:08Z',
    lastUpdateTime: '2021-12-23T12:58:08Z',
    message: 'The operator is running in openshift-operators but is managing this namespace',
    phase: 'Succeeded',
    reason: 'Copied',
    requirementStatus: [
      {
        group: 'operators.coreos.com',
        kind: 'ClusterServiceVersion',
        message: 'CSV minKubeVersion (1.18.0) less than server version (v1.22.1+6859754)',
        name: 'postgresoperator.v5.0.4',
        status: 'Present',
        version: 'v1alpha1',
      },
      {
        group: 'apiextensions.k8s.io',
        kind: 'CustomResourceDefinition',
        message: 'CRD is present and Established condition is true',
        name: 'postgresclusters.postgres-operator.crunchydata.com',
        status: 'Present',
        uuid: 'bf2ea0fd-63e5-4fef-8cd8-7d6becea9c48',
        version: 'v1',
      },
      {
        dependents: [
          {
            group: 'rbac.authorization.k8s.io',
            kind: 'PolicyRule',
            message:
              'namespaced rule:{"verbs":["create","delete","get","list","patch","watch"],"apiGroups":[""],"resources":["configmaps","persistentvolumeclaims","secrets","services"]}',
            status: 'Satisfied',
            version: 'v1',
          },
          {
            group: 'rbac.authorization.k8s.io',
            kind: 'PolicyRule',
            message:
              'namespaced rule:{"verbs":["create","delete","deletecollection","get","list","patch","watch"],"apiGroups":[""],"resources":["endpoints"]}',
            status: 'Satisfied',
            version: 'v1',
          },
          {
            group: 'rbac.authorization.k8s.io',
            kind: 'PolicyRule',
            message:
              'namespaced rule:{"verbs":["create"],"apiGroups":[""],"resources":["endpoints/restricted","pods/exec"]}',
            status: 'Satisfied',
            version: 'v1',
          },
          {
            group: 'rbac.authorization.k8s.io',
            kind: 'PolicyRule',
            message:
              'namespaced rule:{"verbs":["create","patch"],"apiGroups":[""],"resources":["events"]}',
            status: 'Satisfied',
            version: 'v1',
          },
          {
            group: 'rbac.authorization.k8s.io',
            kind: 'PolicyRule',
            message:
              'namespaced rule:{"verbs":["delete","get","list","patch","watch"],"apiGroups":[""],"resources":["pods"]}',
            status: 'Satisfied',
            version: 'v1',
          },
          {
            group: 'rbac.authorization.k8s.io',
            kind: 'PolicyRule',
            message:
              'namespaced rule:{"verbs":["create","get","list","patch","watch"],"apiGroups":[""],"resources":["serviceaccounts"]}',
            status: 'Satisfied',
            version: 'v1',
          },
          {
            group: 'rbac.authorization.k8s.io',
            kind: 'PolicyRule',
            message:
              'namespaced rule:{"verbs":["create","delete","get","list","patch","watch"],"apiGroups":["apps"],"resources":["deployments","statefulsets"]}',
            status: 'Satisfied',
            version: 'v1',
          },
          {
            group: 'rbac.authorization.k8s.io',
            kind: 'PolicyRule',
            message:
              'namespaced rule:{"verbs":["create","delete","get","list","patch","watch"],"apiGroups":["batch"],"resources":["cronjobs","jobs"]}',
            status: 'Satisfied',
            version: 'v1',
          },
          {
            group: 'rbac.authorization.k8s.io',
            kind: 'PolicyRule',
            message:
              'namespaced rule:{"verbs":["get","list","patch","watch"],"apiGroups":["postgres-operator.crunchydata.com"],"resources":["postgresclusters"]}',
            status: 'Satisfied',
            version: 'v1',
          },
          {
            group: 'rbac.authorization.k8s.io',
            kind: 'PolicyRule',
            message:
              'namespaced rule:{"verbs":["update"],"apiGroups":["postgres-operator.crunchydata.com"],"resources":["postgresclusters/finalizers"]}',
            status: 'Satisfied',
            version: 'v1',
          },
          {
            group: 'rbac.authorization.k8s.io',
            kind: 'PolicyRule',
            message:
              'namespaced rule:{"verbs":["patch"],"apiGroups":["postgres-operator.crunchydata.com"],"resources":["postgresclusters/status"]}',
            status: 'Satisfied',
            version: 'v1',
          },
          {
            group: 'rbac.authorization.k8s.io',
            kind: 'PolicyRule',
            message:
              'namespaced rule:{"verbs":["create","get","list","patch","watch"],"apiGroups":["rbac.authorization.k8s.io"],"resources":["rolebindings","roles"]}',
            status: 'Satisfied',
            version: 'v1',
          },
        ],
        group: '',
        kind: 'ServiceAccount',
        message: '',
        name: 'pgo',
        status: 'Present',
        version: 'v1',
      },
    ],
  },
};

export const serviceBinding = {
  kind: 'ServiceBinding',
  apiVersion: 'binding.operators.coreos.com/v1alpha1',
  metadata: {
    annotations: {
      'servicebinding.io/requester':
        '{"username":"kube:admin","groups":["system:cluster-admins","system:authenticated"],"extra":{"scopes.authorization.openshift.io":["user:full"]}}',
    },
    resourceVersion: '171436',
    name: 'spring-petclinic-rest-d-hippo-pc',
    uid: '59d472e8-fa05-4cc2-9d16-08710b5dafa0',
    creationTimestamp: '2021-12-23T13:03:55Z',
    generation: 1,
    managedFields: [
      {
        apiVersion: 'binding.operators.coreos.com/v1alpha1',
        fieldsType: 'FieldsV1',
        fieldsV1: {
          'f:spec': {
            '.': {},
            'f:application': {
              '.': {},
              'f:group': {},
              'f:name': {},
              'f:resource': {},
              'f:version': {},
            },
            'f:bindAsFiles': {},
            'f:detectBindingResources': {},
            'f:services': {},
          },
        },
        manager: 'Mozilla',
        operation: 'Update',
        time: '2021-12-23T13:03:55Z',
      },
      {
        apiVersion: 'binding.operators.coreos.com/v1alpha1',
        fieldsType: 'FieldsV1',
        fieldsV1: {
          'f:metadata': {
            'f:finalizers': {
              '.': {},
              'v:"finalizer.servicebinding.openshift.io"': {},
            },
          },
        },
        manager: 'manager',
        operation: 'Update',
        time: '2021-12-23T13:03:55Z',
      },
      {
        apiVersion: 'binding.operators.coreos.com/v1alpha1',
        fieldsType: 'FieldsV1',
        fieldsV1: {
          'f:status': {
            '.': {},
            'f:conditions': {
              '.': {},
              'k:{"type":"CollectionReady"}': {
                '.': {},
                'f:lastTransitionTime': {},
                'f:message': {},
                'f:reason': {},
                'f:status': {},
                'f:type': {},
              },
              'k:{"type":"InjectionReady"}': {
                '.': {},
                'f:lastTransitionTime': {},
                'f:message': {},
                'f:reason': {},
                'f:status': {},
                'f:type': {},
              },
              'k:{"type":"Ready"}': {
                '.': {},
                'f:lastTransitionTime': {},
                'f:message': {},
                'f:reason': {},
                'f:status': {},
                'f:type': {},
              },
            },
            'f:secret': {},
          },
        },
        manager: 'manager',
        operation: 'Update',
        subresource: 'status',
        time: '2021-12-23T13:03:56Z',
      },
    ],
    namespace: 'my-postgresql',
    finalizers: ['finalizer.servicebinding.openshift.io'],
  },
  spec: {
    application: {
      group: 'apps',
      name: 'spring-petclinic-rest',
      resource: 'deployments',
      version: 'v1',
    },
    bindAsFiles: true,
    detectBindingResources: true,
    services: [
      {
        group: 'postgres-operator.crunchydata.com',
        kind: 'PostgresCluster',
        name: 'hippo',
        version: 'v1beta1',
      },
    ],
  },
  status: {
    conditions: [
      {
        lastTransitionTime: '2021-12-23T13:03:56Z',
        message: '',
        reason: 'DataCollected',
        status: 'True',
        type: 'CollectionReady',
      },
      {
        lastTransitionTime: '2021-12-23T13:03:56Z',
        message: '',
        reason: 'ApplicationUpdated',
        status: 'True',
        type: 'InjectionReady',
      },
      {
        lastTransitionTime: '2021-12-23T13:03:56Z',
        message: '',
        reason: 'ApplicationsBound',
        status: 'True',
        type: 'Ready',
      },
    ],
    secret: 'spring-petclinic-rest-d-hippo-pc-2d428a0c',
  },
};
