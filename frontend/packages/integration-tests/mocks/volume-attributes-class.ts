import type { DeploymentKind } from '@console/internal/module/k8s';

// Factory function to generate unique fixture names and objects per test run
// This prevents collisions when tests run concurrently on shared clusters
// Configuration tested and working on GCP with hyperdisk-balanced
export const getVACFixtures = (suffix: string) => {
  const names = {
    TEST_VAC_STANDARD: `gcp-vac-standard-${suffix}`,
    TEST_VAC_PERFORMANCE: `gcp-vac-performance-${suffix}`,
    TEST_VAC_INVALID: `gcp-vac-invalid-${suffix}`,
    TEST_STORAGECLASS: `gcp-hyperdisk-sc-${suffix}`,
    // Namespace-scoped, no suffix needed
    TEST_PVC: 'test-pvc',
    TEST_DEPLOYMENT: 'test-deployment',
  };

  return {
    ...names,
    // Standard tier VAC
    VAC_STANDARD: {
      apiVersion: 'storage.k8s.io/v1',
      kind: 'VolumeAttributesClass',
      metadata: { name: names.TEST_VAC_STANDARD },
      driverName: 'pd.csi.storage.gke.io',
      parameters: {
        iops: '3000',
        throughput: '140Mi',
      },
    },
    // Performance tier VAC - uses identical parameters to VAC_STANDARD to minimize CSI driver
    // modification time and reduce test flakiness. This allows verification of VAC name fields
    // on the PVC details page without long waits for actual volume operations.
    VAC_PERFORMANCE: {
      apiVersion: 'storage.k8s.io/v1',
      kind: 'VolumeAttributesClass',
      metadata: { name: names.TEST_VAC_PERFORMANCE },
      driverName: 'pd.csi.storage.gke.io',
      parameters: {
        iops: '3000',
        throughput: '140Mi',
      },
    },
    // Invalid VAC - exceeds limits to trigger error
    VAC_INVALID: {
      apiVersion: 'storage.k8s.io/v1',
      kind: 'VolumeAttributesClass',
      metadata: { name: names.TEST_VAC_INVALID },
      driverName: 'pd.csi.storage.gke.io',
      parameters: {
        iops: '999999',
        throughput: '999999Mi',
      },
    },
    // GCP hyperdisk-balanced StorageClass
    STORAGE_CLASS: {
      apiVersion: 'storage.k8s.io/v1',
      kind: 'StorageClass',
      metadata: { name: names.TEST_STORAGECLASS },
      provisioner: 'pd.csi.storage.gke.io',
      parameters: {
        type: 'hyperdisk-balanced',
      },
      volumeBindingMode: 'WaitForFirstConsumer',
      allowVolumeExpansion: true,
    },
    // Deployment to consume the PVC
    getDeployment: (namespace: string, pvcName: string): DeploymentKind => ({
      apiVersion: 'apps/v1',
      kind: 'Deployment',
      metadata: { name: names.TEST_DEPLOYMENT, namespace },
      spec: {
        replicas: 1,
        selector: { matchLabels: { app: 'test-app' } },
        template: {
          metadata: { labels: { app: 'test-app' } },
          spec: {
            containers: [
              {
                name: 'container',
                image: 'image-registry.openshift-image-registry.svc:5000/openshift/httpd:latest',
                volumeMounts: [{ name: 'storage', mountPath: '/data' }],
              },
            ],
            volumes: [{ name: 'storage', persistentVolumeClaim: { claimName: pvcName } }],
          },
        },
      },
    }),
  };
};
