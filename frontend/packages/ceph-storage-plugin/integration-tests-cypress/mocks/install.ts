export const PULL_SECRET_PATH = '/var/run/operator-secret/dockerconfig';

export const CATALOG = {
  NAMESPACE: 'openshift-marketplace',
  SECRET: 'ocs-secret',
  IMAGE: 'quay.io/rhceph-dev/ocs-registry:latest-stable-4.8',
};

export const ocsCatalogSource = {
  apiVersion: 'operators.coreos.com/v1alpha1',
  kind: 'CatalogSource',
  metadata: {
    labels: {
      'ocs-operator-internal': 'true',
    },
    namespace: CATALOG.NAMESPACE,
    name: 'ocs-catalogsource',
  },
  spec: {
    sourceType: 'grpc',
    image: CATALOG.IMAGE,
    secrets: [CATALOG.SECRET],
    displayName: 'OpenShift Container Storage',
    publisher: 'Red Hat',
  },
};
