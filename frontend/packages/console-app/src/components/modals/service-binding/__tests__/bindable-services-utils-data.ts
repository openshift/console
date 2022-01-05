import { ClusterServiceVersionDataType } from '../bindable-services-utils';

export const csvResources: ClusterServiceVersionDataType = {
  data: [
    {
      apiVersion: 'operators.coreos.com/v1alpha1',
      kind: 'ClusterServiceVersion',
      metadata: {
        annotations: {},
        labels: {},
        name: 'cloud-native-postgresql.v1.10.0',
        namespace: 'test',
        resourceVersion: '147739',
        uid: '0d3374cb-59ef-4558-b58a-ee3ace969f61',
      },
      spec: {
        customresourcedefinitions: {
          owned: [
            {
              description: 'PostgreSQL backup manager',
              displayName: 'Backups',
              kind: 'Backup',
              name: 'backups.postgresql.k8s.enterprisedb.io',
              version: 'v1',
            },
            {
              description: 'PostgreSQL cluster manager',
              displayName: 'Cluster',
              kind: 'Cluster',
              name: 'clusters.postgresql.k8s.enterprisedb.io',
              version: 'v1',
            },
            {
              description: 'PgBouncer Pooler Manager',
              displayName: 'Pooler',
              kind: 'Pooler',
              name: 'poolers.postgresql.k8s.enterprisedb.io',
              version: 'v1',
            },
          ],
        },
        description:
          'Cloud Native PostgreSQL is an operator designed by EnterpriseDB\nto manage PostgreSQL workloads\n',
        displayName: 'Cloud Native PostgreSQL',
        install: null,
        installModes: null,
      },
      status: null,
    },
    {
      apiVersion: 'operators.coreos.com/v1alpha1',
      kind: 'ClusterServiceVersion',
      metadata: {
        annotations: {},
        labels: {},
        name: 'openshift-pipelines-operator-rh.v1.6.0',
        namespace: 'test1',
        resourceVersion: '147695',
        uid: '1251d83e-43b4-4d6f-a0d1-e3b06f9d6a3c',
      },
      spec: {
        customresourcedefinitions: {
          owned: [
            {
              description: 'Represents an installation of latest version of Tekton Triggers',
              displayName: 'Tekton Triggers',
              kind: 'TektonTrigger',
              name: 'tektontriggers.operator.tekton.dev',
              version: 'v1',
            },
            {
              description: 'Represents an installation of latest version of Tekton Pipelines',
              displayName: 'Tekton Pipelines',
              kind: 'TektonPipeline',
              name: 'tektonpipelines.operator.tekton.dev',
              version: 'v1',
            },
            {
              description:
                'This CustomResourceDefinition (CRD) is used internally by the other OpenShift Pipelines CRDs to maintain the lifecycle of OpenShift Pipelines',
              displayName: 'Tekton Installer Set',
              kind: 'TektonInstallerSet',
              name: 'tektoninstallersets.operator.tekton.dev',
              version: 'v1',
            },
          ],
        },
        install: null,
        installModes: null,
        description:
          'Red Hat OpenShift Pipelines is a cloud-native continuous integration and delivery\n(CI/CD) solution for building pipelines using [Tekton]',
        displayName: 'Red Hat OpenShift Pipelines',
      },
      status: null,
    },
    {
      apiVersion: 'operators.coreos.com/v1alpha1',
      kind: 'ClusterServiceVersion',
      metadata: {
        annotations: {},
        labels: {},
        name: 'service-binding-operator.v1.0.0',
        namespace: 'test',
        resourceVersion: '147580',
        uid: '4de38f53-a84d-4da5-b163-605275634851',
      },
      spec: {
        customresourcedefinitions: {
          owned: [
            {
              description:
                '(Tech Preview) Service Binding implementing community specification describing the connection between a backing service and an application workload.',
              displayName: 'Service Binding (Spec API Tech Preview)',
              kind: 'ServiceBinding',
              name: 'servicebindings.servicebinding.io',
              version: 'v1alpha3',
            },
            {
              description:
                'Service Binding expresses intent to bind a backing service with an application workload.',
              displayName: 'Service Binding',
              kind: 'ServiceBinding',
              name: 'servicebindings.binding.operators.coreos.com',
              version: 'v1alpha1',
            },
            {
              description:
                "BindableKinds contains a list of bindable type (group, version, kind) found in the cluster. It is cluster-scoped and there is only single instance named 'bindable-kinds'.",
              displayName: 'Bindable Kinds',
              kind: 'BindableKinds',
              name: 'bindablekinds.binding.operators.coreos.com',
              version: 'v1alpha1',
            },
          ],
        },
        install: null,
        installModes: null,
        description:
          'The Service Binding Operator manages the data plane for applications and backing services. It enables developers to connect their\napplications to backing services (REST API, databases, event buses and others) with a consistent and predictable\nexperience. The operator reads data made available by the control plane of backing services and projects the bindings\ndata to applications either as accessible files mounted into the application’s container or environment variables.\n\nIn Kubernetes, each service suggests a different way to access their secrets and developers will consume them in their\napplication in a custom way. While this provides a good deal of flexibility, it also creates discrepancies and\ncomplexity dealing with each specific services, which leads large development teams to lose overall velocity.\n\nService Binding Operator removes the error-prone manual configuration of binding information, provides service operators\na low-touch administrative experience to provision and manage access to services and enriches development lifecycle.\n\nFor additional details refer to the project [documentation](https://redhat-developer.github.io/service-binding-operator).\n\nGet Started with Service Binding Operator\n* Find out about SBO’s [prerequisites](https://redhat-developer.github.io/service-binding-operator/userguide/getting-started/installing-service-binding.html).\n* Refer to the [Quick Start Guide](https://redhat-developer.github.io/service-binding-operator/userguide/getting-started/quick-start.html) to see SBO in action in a simple scenario.\n\nNeed Help\n* Raise a ticket for bugs, features and enhancement [here](https://github.com/redhat-developer/service-binding-operator/)\n\nLicence\n* Service Binding Operator is licensed under [Apache License 2.0](https://github.com/redhat-developer/service-binding-operator/blob/master/LICENSE)\n\nService Binding Operator is providing and supporting two different APIs.\n* `binding.operators.coreos.com/v1alpha1`: This API is compliant with the Service Binding specification. It is fully supported and considered as the mature API. It’s the API we recommend in production environments.\n* `servicebinding.io/v1alpha3`: This API is the one defined in the Service Binding specification. The specification is still evolving and maturing, as a result the API might change in the future. We recommend you to carefully use that API for testing purposes and preparing your integration to become fully compliant with the specification. It is available in Service Binding Operator 1.x, as Tech Preview.\n\nWe’ll consider supporting only the API from the specification, once the Service Binding specification will be officially GA. Of course, that will be a breaking change and handle in a safe way for you.\n',
        displayName: 'Service Binding Operator',
      },
      status: null,
    },
  ],
  loadError: '',
  loaded: true,
};

export const watchedResources = [
  {
    isList: true,
    kind: 'postgresql.k8s.enterprisedb.io~v1~Backup',
    namespace: 'test',
    optional: true,
    prop: 'Backup',
  },
  {
    isList: true,
    kind: 'postgresql.k8s.enterprisedb.io~v1~Cluster',
    namespace: 'test',
    optional: true,
    prop: 'Cluster',
  },
  {
    isList: true,
    kind: 'postgresql.k8s.enterprisedb.io~v1~Pooler',
    namespace: 'test',
    optional: true,
    prop: 'Pooler',
  },
  {
    isList: true,
    kind: 'operator.tekton.dev~v1~TektonTrigger',
    namespace: 'test',
    optional: true,
    prop: 'TektonTrigger',
  },
  {
    isList: true,
    kind: 'operator.tekton.dev~v1~TektonPipeline',
    namespace: 'test',
    optional: true,
    prop: 'TektonPipeline',
  },
  {
    isList: true,
    kind: 'operator.tekton.dev~v1~TektonInstallerSet',
    namespace: 'test',
    optional: true,
    prop: 'TektonInstallerSet',
  },
  false,
  {
    isList: true,
    kind: 'binding.operators.coreos.com~v1alpha1~BindableKinds',
    namespace: 'test',
    optional: true,
    prop: 'BindableKinds',
  },
];

export const expectedBindableResources = [
  {
    isList: true,
    kind: 'postgresql.k8s.enterprisedb.io~v1~Backup',
    namespace: 'test',
    optional: true,
    prop: 'Backup',
  },
  {
    isList: true,
    kind: 'postgresql.k8s.enterprisedb.io~v1~Cluster',
    namespace: 'test',
    optional: true,
    prop: 'Cluster',
  },
  {
    isList: true,
    kind: 'postgresql.k8s.enterprisedb.io~v1~Pooler',
    namespace: 'test',
    optional: true,
    prop: 'Pooler',
  },
  {
    isList: true,
    kind: 'operator.tekton.dev~v1~TektonTrigger',
    namespace: 'test',
    optional: true,
    prop: 'TektonTrigger',
  },
  {
    isList: true,
    kind: 'operator.tekton.dev~v1~TektonPipeline',
    namespace: 'test',
    optional: true,
    prop: 'TektonPipeline',
  },
  {
    isList: true,
    kind: 'operator.tekton.dev~v1~TektonInstallerSet',
    namespace: 'test',
    optional: true,
    prop: 'TektonInstallerSet',
  },
  false,
  {
    isList: true,
    kind: 'binding.operators.coreos.com~v1alpha1~BindableKinds',
    namespace: 'test',
    optional: true,
    prop: 'BindableKinds',
  },
  {
    isList: true,
    kind: 'rhoas.redhat.com~v1alpha1~KafkaConnection',
    namespace: 'test',
    optional: true,
    prop: 'KafkaConnection',
  },
  {
    isList: true,
    kind: 'rhoas.redhat.com~v1alpha1~ServiceRegistryConnection',
    namespace: 'test',
    optional: true,
    prop: 'ServiceRegistryConnection',
  },
  {
    isList: true,
    kind: 'postgresql.k8s.enterprisedb.io~v1~Cluster',
    namespace: 'test',
    optional: true,
    prop: 'Cluster',
  },
  {
    isList: true,
    kind: 'postgres-operator.crunchydata.com~v1beta1~PostgresCluster',
    namespace: 'test',
    optional: true,
    prop: 'PostgresCluster',
  },
  {
    isList: true,
    kind: 'rabbitmq.com~v1beta1~RabbitmqCluster',
    namespace: 'test',
    optional: true,
    prop: 'RabbitmqCluster',
  },
  {
    isList: true,
    kind: 'redis.redis.opstreelabs.in~v1beta1~Redis',
    namespace: 'test',
    optional: true,
    prop: 'Redis',
  },
];
