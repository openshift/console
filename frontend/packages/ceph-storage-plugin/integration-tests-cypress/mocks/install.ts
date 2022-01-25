export const PULL_SECRET_PATH = '/var/run/operator-secret/dockerconfig';

export const CATALOG = {
  NAMESPACE: 'openshift-marketplace',
  SECRET: 'ocs-image-secret',
  IMAGE: 'quay.io/rhceph-dev/ocs-registry:latest-stable-4.10.0',
};

export const odfCatalogSource = {
  apiVersion: 'operators.coreos.com/v1alpha1',
  kind: 'CatalogSource',
  metadata: {
    labels: {
      'ocs-operator-internal': 'true',
    },
    namespace: CATALOG.NAMESPACE,
    name: 'redhat-operators',
  },
  spec: {
    sourceType: 'grpc',
    image: CATALOG.IMAGE,
    secrets: [CATALOG.SECRET],
    displayName: 'Openshift Data Foundation',
    publisher: 'Red Hat',
  },
};
