import { Item } from '@console/internal/components/catalog/types';

export const developerCatalogItems: Item[] = [
  {
    createLabel: 'Create Application',
    href:
      '/catalog/source-to-image?imagestream=dotnet&imagestream-ns=openshift&preselected-ns=openshift-operators',
    kind: 'ImageStream',
    obj: {
      metadata: {
        name: 'dotnet',
        namespace: 'openshift',
      },
    },
    tileIconClass: null,
    tileImgUrl: 'static/assets/dotnet.svg',
    tileName: '.NET Core',
    tileProvider: undefined,
  },
  {
    createLabel: 'Instantiate Template',
    documentationUrl: undefined,
    href:
      '/catalog/instantiate-template?template=dotnet-pgsql-persistent&template-ns=openshift&preselected-ns=openshift-operators',
    kind: 'Template',
    obj: {
      metadata: {
        name: 'dotnet-pgsql-persistent',
        namespace: 'openshift',
      },
    },
    tileIconClass: null,
    tileImgUrl: 'static/assets/dotnet.svg',
    tileName: '.NET Core + PostgreSQL (Persistent)',
    tileProvider: undefined,
  },
  {
    createLabel: 'Create',
    documentationUrl: undefined,
    href:
      '/ns/openshift-operators/clusterserviceversions/elasticsearch-operator.4.2.9-201911261133/logging.openshift.io~v1~Elasticsearch/~new',
    kind: 'InstalledOperator',
    obj: {
      csv: {
        kind: 'ClusterServiceVersion',
        metadata: {
          name: 'elasticsearch-operator.4.2.9-201911261133',
          namespace: 'openshift-operators',
        },
        spec: {
          displayName: 'Elastic Search Operator',
        },
      },
    },
    tileDescription: 'An Elasticsearch cluster instance',
    tileIconClass: null,
    tileImgUrl: 'static/assets/operator.svg',
    tileName: 'Elasticsearch',
    tileProvider: 'Red Hat, Inc',
  },
  {
    createLabel: 'Create',
    documentationUrl: undefined,
    href:
      '/ns/openshift-operators/clusterserviceversions/servicemeshoperator.v1.0.2/maistra.io~v1~ServiceMeshControlPlane/~new',
    kind: 'InstalledOperator',
    obj: {
      csv: {
        kind: 'ClusterServiceVersion',
        metadata: {
          name: 'servicemeshoperator.v1.0.2',
          namespace: 'openshift-operators',
        },
        spec: {
          displayName: 'Service Mesh Operator',
        },
      },
    },
    tileDescription: 'An Istio control plane installation',
    tileIconClass: null,
    tileImgUrl: 'static/assets/operator.svg',
    tileName: 'Istio Service Mesh Control Plane',
    tileProvider: 'Red Hat, Inc',
  },
  {
    createLabel: 'Create',
    documentationUrl: undefined,
    href:
      '/ns/openshift-operators/clusterserviceversions/servicemeshoperator.v1.0.2/maistra.io~v1~ServiceMeshMemberRoll/~new',
    kind: 'InstalledOperator',
    obj: {
      csv: {
        kind: 'ClusterServiceVersion',
        metadata: {
          name: 'servicemeshoperator.v1.0.2',
          namespace: 'openshift-operators',
        },
        spec: {
          displayName: 'Service Mesh Operator',
        },
      },
    },
    tileDescription: 'A list of namespaces in Service Mesh',
    tileIconClass: null,
    tileImgUrl: 'static/assets/operator.svg',
    tileName: 'Istio Service Mesh Member Roll',
    tileProvider: 'Red Hat, Inc',
  },
];

export const groupedByOperator = {
  'Elastic Search Operator': [
    {
      createLabel: 'Create',
      documentationUrl: undefined,
      href:
        '/ns/openshift-operators/clusterserviceversions/elasticsearch-operator.4.2.9-201911261133/logging.openshift.io~v1~Elasticsearch/~new',
      kind: 'InstalledOperator',
      obj: {
        csv: {
          kind: 'ClusterServiceVersion',
          metadata: {
            name: 'elasticsearch-operator.4.2.9-201911261133',
            namespace: 'openshift-operators',
          },
          spec: {
            displayName: 'Elastic Search Operator',
          },
        },
      },
      tileDescription: 'An Elasticsearch cluster instance',
      tileIconClass: null,
      tileImgUrl: 'static/assets/operator.svg',
      tileName: 'Elasticsearch',
      tileProvider: 'Red Hat, Inc',
    },
  ],
  'Service Mesh Operator': [
    {
      createLabel: 'Create',
      documentationUrl: undefined,
      href:
        '/ns/openshift-operators/clusterserviceversions/servicemeshoperator.v1.0.2/maistra.io~v1~ServiceMeshControlPlane/~new',
      kind: 'InstalledOperator',
      obj: {
        csv: {
          kind: 'ClusterServiceVersion',
          metadata: {
            name: 'servicemeshoperator.v1.0.2',
            namespace: 'openshift-operators',
          },
          spec: {
            displayName: 'Service Mesh Operator',
          },
        },
      },
      tileDescription: 'An Istio control plane installation',
      tileIconClass: null,
      tileImgUrl: 'static/assets/operator.svg',
      tileName: 'Istio Service Mesh Control Plane',
      tileProvider: 'Red Hat, Inc',
    },
    {
      createLabel: 'Create',
      documentationUrl: undefined,
      href:
        '/ns/openshift-operators/clusterserviceversions/servicemeshoperator.v1.0.2/maistra.io~v1~ServiceMeshMemberRoll/~new',
      kind: 'InstalledOperator',
      obj: {
        csv: {
          kind: 'ClusterServiceVersion',
          metadata: {
            name: 'servicemeshoperator.v1.0.2',
            namespace: 'openshift-operators',
          },
          spec: {
            displayName: 'Service Mesh Operator',
          },
        },
      },
      tileDescription: 'A list of namespaces in Service Mesh',
      tileIconClass: null,
      tileImgUrl: 'static/assets/operator.svg',
      tileName: 'Istio Service Mesh Member Roll',
      tileProvider: 'Red Hat, Inc',
    },
  ],
  'Non Operators': [
    {
      createLabel: 'Create Application',
      href:
        '/catalog/source-to-image?imagestream=dotnet&imagestream-ns=openshift&preselected-ns=openshift-operators',
      kind: 'ImageStream',
      obj: {
        metadata: {
          name: 'dotnet',
          namespace: 'openshift',
        },
      },
      tileIconClass: null,
      tileImgUrl: 'static/assets/dotnet.svg',
      tileName: '.NET Core',
      tileProvider: undefined,
    },
    {
      createLabel: 'Instantiate Template',
      documentationUrl: undefined,
      href:
        '/catalog/instantiate-template?template=dotnet-pgsql-persistent&template-ns=openshift&preselected-ns=openshift-operators',
      kind: 'Template',
      obj: {
        metadata: {
          name: 'dotnet-pgsql-persistent',
          namespace: 'openshift',
        },
      },
      tileIconClass: null,
      tileImgUrl: 'static/assets/dotnet.svg',
      tileName: '.NET Core + PostgreSQL (Persistent)',
      tileProvider: undefined,
    },
  ],
};
