import type { DeploymentKind } from '@console/internal/module/k8s';

// Factory function to generate unique fixture names and objects per test run
// This prevents collisions when tests run concurrently on shared clusters
export const getVACFixtures = (suffix: string) => {
  const names = {
    TEST_VAC_LOW_IOPS: `test-vac-low-iops-${suffix}`,
    TEST_VAC_HIGH_IOPS: `test-vac-high-iops-${suffix}`,
    TEST_VAC_INVALID: `test-vac-invalid-${suffix}`,
    TEST_STORAGECLASS: `test-storageclass-${suffix}`,
    // Namespace-scoped, no suffix needed
    TEST_PVC: 'test-pvc',
    TEST_DEPLOYMENT: 'test-deployment',
  };

  return {
    ...names,
    VAC_LOW_IOPS: {
      apiVersion: 'storage.k8s.io/v1',
      kind: 'VolumeAttributesClass',
      metadata: { name: names.TEST_VAC_LOW_IOPS },
      driverName: 'ebs.csi.aws.com',
      parameters: { iops: '3000', throughput: '125', type: 'gp3' },
    },
    VAC_HIGH_IOPS: {
      apiVersion: 'storage.k8s.io/v1',
      kind: 'VolumeAttributesClass',
      metadata: { name: names.TEST_VAC_HIGH_IOPS },
      driverName: 'ebs.csi.aws.com',
      // Uses identical parameters to VAC_LOW_IOPS to minimize CSI driver modification time and reduce test flakiness.
      // This allows verification of VAC name fields on the PVC details page without long waits for actual volume operations.
      parameters: { iops: '3000', throughput: '125', type: 'gp3' },
    },
    VAC_INVALID: {
      apiVersion: 'storage.k8s.io/v1',
      kind: 'VolumeAttributesClass',
      metadata: { name: names.TEST_VAC_INVALID },
      driverName: 'ebs.csi.aws.com',
      parameters: { iops: '999999', throughput: '999999', type: 'gp3' },
    },
    STORAGE_CLASS: {
      apiVersion: 'storage.k8s.io/v1',
      kind: 'StorageClass',
      metadata: { name: names.TEST_STORAGECLASS },
      provisioner: 'ebs.csi.aws.com',
      allowVolumeExpansion: true,
    },
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
