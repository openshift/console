export const testerDeployment = {
  apiVersion: 'apps/v1',
  kind: 'Deployment',
  metadata: {
    name: 'busybox-deployment',
    labels: { app: 'busybox' },
  },
  spec: {
    replicas: 1,
    strategy: { type: 'RollingUpdate' },
    selector: { matchLabels: { app: 'busybox' } },
    template: {
      metadata: { labels: { app: 'busybox' } },
      spec: {
        securityContext: {
          runAsNonRoot: true,
          seccompProfile: { type: 'RuntimeDefault' },
        },
        volumes: [
          {
            name: 'testpvc',
            persistentVolumeClaim: { claimName: 'testpvc' },
          },
        ],
        containers: [
          {
            name: 'busybox',
            image: 'busybox',
            imagePullPolicy: 'IfNotPresent',
            securityContext: {
              allowPrivilegeEscalation: false,
              capabilities: { drop: ['ALL'] },
            },
            volumeDevices: [{ name: 'testpvc', devicePath: '/data' }],
            command: ['sh', '-c', 'echo Container 1 is Running ; sleep 3600'],
          },
        ],
      },
    },
  },
};

export const PVC = {
  apiVersion: 'v1',
  kind: 'PersistentVolumeClaim',
  metadata: { name: 'testpvc' },
  spec: {
    storageClassName: 'gp2-csi',
    accessModes: ['ReadWriteOnce'],
    resources: { requests: { storage: '1Gi' } },
  },
};

export const PVCGP3 = {
  apiVersion: 'v1',
  kind: 'PersistentVolumeClaim',
  metadata: { name: 'testpvcgp3' },
  spec: {
    storageClassName: 'gp3-csi',
    accessModes: ['ReadWriteOnce'],
    resources: { requests: { storage: '1Gi' } },
  },
};

export const SnapshotClass = {
  apiVersion: 'snapshot.storage.k8s.io/v1',
  kind: 'VolumeSnapshotClass',
  metadata: { name: 'csi-hostpath-snapclass' },
  driver: 'ebs.csi.aws.com',
  deletionPolicy: 'Delete',
};

export const patchForVolume = {
  op: 'add' as const,
  path: '/spec/template/spec/volumes/-',
  value: {
    name: 'testpvc-snapshot-restore',
    persistentVolumeClaim: { claimName: 'testpvc-snapshot-restore' },
  },
};

// --- Storage Class provisioner fixtures ---

export type Parameter = {
  name: string;
  id?: string;
  values?: string | string[];
  hintText?: string;
  nestedParameter?: Parameter;
};

export const provisionersMap: Record<string, Parameter[]> = {
  'kubernetes.io/aws-ebs': [
    { name: 'Type', id: 'type', values: ['io1', 'gp2', 'sc1', 'st1'] },
    { name: 'IOPS per GiB', id: 'iopsPerGB', values: '10' },
    { name: 'Filesystem type', id: 'fsType', values: 'ext4' },
    {
      name: 'Encrypted',
      id: 'encrypted',
      nestedParameter: { name: 'KMS key ID', values: 'sample-kms-id' },
    },
  ],
  'kubernetes.io/cinder': [
    { name: 'Volume type', id: 'type', values: 'ext4' },
    { name: 'Availability zone', id: 'availability', values: 'lalitpur' },
  ],
  'kubernetes.io/azure-file': [
    {
      name: 'SKU name',
      id: 'skuName',
      hintText: 'Azure storage account SKU tier',
      values: 'sample-name',
    },
    {
      name: 'Location',
      id: 'location',
      hintText: 'Azure storage account name',
      values: 'bhaktapur',
    },
    {
      name: 'Azure storage account name',
      id: 'storageAccount',
      hintText: 'Azure storage account name',
      values: 'test-account',
    },
  ],
  'kubernetes.io/azure-disk': [
    {
      name: 'Storage account type',
      id: 'storageaccounttype',
      hintText: 'Storage account type',
      values: 'tester',
    },
    { name: 'Account kind', id: 'kind', values: ['shared', 'dedicated', 'managed'] },
  ],
  'kubernetes.io/quobyte': [
    { name: 'Quobyte API server', id: 'quobyteAPIServer', values: 'test.xyzab' },
    { name: 'Registry address(es)', id: 'registry', values: 'xyz.abc' },
    { name: 'Admin secret name', id: 'adminSecretName', values: 'secret-admin' },
    { name: 'Admin secret namespace', id: 'adminSecretNamespace', values: 'secret-ns' },
    { name: 'User', id: 'user', values: 'admin' },
    { name: 'Quobyte configuration', id: 'quobyteConfig', values: 'config' },
    { name: 'Quobyte tenant', id: 'quobyteTenant', values: 'tester' },
  ],
  'kubernetes.io/vsphere-volume': [
    {
      name: 'Disk format',
      id: 'diskformat',
      values: ['thin', 'zeroed thick', 'eager zeroed thick'],
    },
    { name: 'Datastore', id: 'datastore', values: 'store-thin' },
  ],
  'kubernetes.io/portworx-volume': [
    { name: 'Filesystem', id: 'fs', values: ['none', 'xfs', 'ext4'] },
    { name: 'Block size', id: 'block_size', values: '1024' },
    {
      name: 'Number of synchronous replicas to be provided in the form of replication factor',
      id: 'repl',
      values: '2',
    },
    { name: 'I/O priority', id: 'io_priority', values: ['high', 'medium', 'low'] },
    { name: 'Snapshot interval', id: 'snap_interval', values: '5' },
    { name: 'Aggregation level', id: 'aggregation_level', values: '2024' },
    { name: 'Ephemeral', id: 'ephemeral' },
  ],
  'kubernetes.io/scaleio': [
    { name: 'API gateway', id: 'gateway', values: 'abc.xyz' },
    { name: 'System name', id: 'system', values: 'test-sys' },
    { name: 'Protection domain', id: 'protectionDomain', values: 'local' },
    { name: 'Storage pool', id: 'storagePool', values: 'simple-pool' },
    { name: 'Storage mode', id: 'storageMode', values: ['ThinProvisioned', 'ThickProvisioned'] },
    { name: 'Secret reference', id: 'secretRef', values: 'simpleSecret' },
    { name: 'Read Only', id: 'readOnly' },
    { name: 'Filesystem Type', id: 'fsType', values: 'ext2' },
  ],
  'kubernetes.io/storageos': [
    { name: 'Pool', id: 'pool', values: 'test-pool' },
    { name: 'Description', id: 'description', values: 'storage drive' },
    { name: 'Filesystem type', id: 'fsType', values: 'ext3' },
    { name: 'Admin secret name', id: 'adminSecretName', values: 'admin-secret-name' },
    { name: 'Admin secret namespace', id: 'adminSecretNamespace', values: 'secret-ns' },
  ],
};

// --- VolumeAttributesClass fixtures ---

export const getVACFixtures = (suffix: string) => {
  const names = {
    TEST_VAC_LOW_IOPS: `test-vac-low-iops-${suffix}`,
    TEST_VAC_HIGH_IOPS: `test-vac-high-iops-${suffix}`,
    TEST_VAC_INVALID: `test-vac-invalid-${suffix}`,
    TEST_STORAGECLASS: `test-storageclass-${suffix}`,
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
    getDeployment: (namespace: string, pvcName: string) => ({
      apiVersion: 'apps/v1',
      kind: 'Deployment',
      metadata: { name: names.TEST_DEPLOYMENT, namespace },
      spec: {
        replicas: 1,
        selector: { matchLabels: { app: 'test-app' } },
        template: {
          metadata: { labels: { app: 'test-app' } },
          spec: {
            securityContext: {
              runAsNonRoot: true,
              seccompProfile: { type: 'RuntimeDefault' },
            },
            containers: [
              {
                name: 'container',
                image: 'image-registry.openshift-image-registry.svc:5000/openshift/httpd:latest',
                securityContext: {
                  allowPrivilegeEscalation: false,
                  capabilities: { drop: ['ALL'] },
                },
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

// --- VolumeGroupSnapshot fixtures ---

export const getVGSFixtures = (suffix: string, groupSnapshotStorageClassName: string) => {
  const names = {
    TEST_PVC_A: `vgs-testpvc-a-${suffix}`,
    TEST_PVC_B: `vgs-testpvc-b-${suffix}`,
    TEST_PVC_MIXED_A: `vgs-mixed-pvc-a-${suffix}`,
    TEST_PVC_MIXED_B: `vgs-mixed-pvc-b-${suffix}`,
    TEST_FAKE_STORAGECLASS_A: `vgs-fake-sc-a-${suffix}`,
    TEST_FAKE_STORAGECLASS_B: `vgs-fake-sc-b-${suffix}`,
    TEST_DEPLOYMENT: `vgs-tester-deployment-${suffix}`,
  };

  const makePVC = (name: string, storageClassName: string, labels: Record<string, string>) => ({
    apiVersion: 'v1',
    kind: 'PersistentVolumeClaim',
    metadata: { name, labels },
    spec: {
      storageClassName,
      accessModes: ['ReadWriteOnce'],
      resources: { requests: { storage: '1Gi' } },
    },
  });

  return {
    ...names,
    // Two PVCs on the same StorageClass/provisioner, for the happy-path group snapshot.
    // The caller discovers groupSnapshotStorageClassName from an existing
    // VolumeGroupSnapshotClass on the cluster (see findGroupSnapshotCapableStorageClass),
    // since not every StorageClass's CSI driver actually implements group snapshots.
    PVC_SAME_PROVISIONER_A: makePVC(names.TEST_PVC_A, groupSnapshotStorageClassName, {
      'vgs-test': 'true',
    }),
    PVC_SAME_PROVISIONER_B: makePVC(names.TEST_PVC_B, groupSnapshotStorageClassName, {
      'vgs-test': 'true',
    }),
    // Two PVCs on two throwaway StorageClasses with distinct fake provisioners, so the
    // create form's mixed-provisioner validation is exercised without depending on any
    // real StorageClass existing on the cluster. Neither needs to be Bound: the
    // validation only inspects the matched PVCs' declared StorageClass/provisioner.
    PVC_MIXED_FAKE_PROVISIONER_A: makePVC(names.TEST_PVC_MIXED_A, names.TEST_FAKE_STORAGECLASS_A, {
      'vgs-mixed-test': 'true',
    }),
    PVC_MIXED_FAKE_PROVISIONER_B: makePVC(names.TEST_PVC_MIXED_B, names.TEST_FAKE_STORAGECLASS_B, {
      'vgs-mixed-test': 'true',
    }),
    FAKE_STORAGE_CLASS_A: {
      apiVersion: 'storage.k8s.io/v1',
      kind: 'StorageClass',
      metadata: { name: names.TEST_FAKE_STORAGECLASS_A },
      provisioner: 'csi.fake-a.example.com',
    },
    FAKE_STORAGE_CLASS_B: {
      apiVersion: 'storage.k8s.io/v1',
      kind: 'StorageClass',
      metadata: { name: names.TEST_FAKE_STORAGECLASS_B },
      provisioner: 'csi.fake-b.example.com',
    },
    getDeployment: (namespace: string, pvcNames: string[]) => ({
      apiVersion: 'apps/v1',
      kind: 'Deployment',
      metadata: { name: names.TEST_DEPLOYMENT, namespace },
      spec: {
        replicas: 1,
        selector: { matchLabels: { app: names.TEST_DEPLOYMENT } },
        template: {
          metadata: { labels: { app: names.TEST_DEPLOYMENT } },
          spec: {
            securityContext: {
              runAsNonRoot: true,
              seccompProfile: { type: 'RuntimeDefault' },
            },
            containers: [
              {
                name: 'busybox',
                image: 'busybox',
                imagePullPolicy: 'IfNotPresent',
                securityContext: {
                  allowPrivilegeEscalation: false,
                  capabilities: { drop: ['ALL'] },
                },
                command: ['sh', '-c', 'echo Container is Running ; sleep 3600'],
                volumeMounts: pvcNames.map((pvcName, i) => ({
                  name: `vol-${i}`,
                  mountPath: `/data-${i}`,
                })),
              },
            ],
            volumes: pvcNames.map((pvcName, i) => ({
              name: `vol-${i}`,
              persistentVolumeClaim: { claimName: pvcName },
            })),
          },
        },
      },
    }),
  };
};

export async function isAwsPlatform(
  k8sClient: import('../clients/kubernetes-client').default,
): Promise<boolean> {
  const infra = (await k8sClient.getClusterCustomResource(
    'config.openshift.io',
    'v1',
    'infrastructures',
    'cluster',
  )) as any;
  return infra?.status?.platformStatus?.type === 'AWS';
}

/**
 * Finds a StorageClass whose provisioner matches the driver of an existing
 * VolumeGroupSnapshotClass. Group-snapshot support depends on the CSI driver/
 * snapshot-controller sidecar having the CSIVolumeGroupSnapshot feature gate
 * enabled, which isn't implied by the CRDs being installed or by any particular
 * platform, so this discovers a combination the cluster has actually been
 * configured with rather than assuming one.
 */
export async function findGroupSnapshotCapableStorageClass(
  k8sClient: import('../clients/kubernetes-client').default,
): Promise<{ storageClassName: string; vgsClassName: string } | null> {
  const vgsClasses = (await k8sClient.listClusterCustomResources(
    'groupsnapshot.storage.k8s.io',
    'v1',
    'volumegroupsnapshotclasses',
  )) as { metadata: { name: string }; driver: string }[];
  if (vgsClasses.length === 0) {
    return null;
  }
  const storageClasses = (await k8sClient.listClusterCustomResources(
    'storage.k8s.io',
    'v1',
    'storageclasses',
  )) as { metadata: { name: string }; provisioner: string }[];
  for (const vgsClass of vgsClasses) {
    const storageClass = storageClasses.find((sc) => sc.provisioner === vgsClass.driver);
    if (storageClass) {
      return { storageClassName: storageClass.metadata.name, vgsClassName: vgsClass.metadata.name };
    }
  }
  return null;
}
