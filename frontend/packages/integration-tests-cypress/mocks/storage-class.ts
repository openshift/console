import { Parameter } from '../views/storage/create-storage-class';

type ProvisionerAndParameters = {
  [provisionerName: string]: Parameter[];
};

export const provisionersMap: ProvisionerAndParameters = {
  'kubernetes.io/aws-ebs': [
    {
      name: 'Type',
      id: 'type',
      values: ['io1', 'gp2', 'sc1', 'st1'],
    },
    {
      name: 'IOPS per GiB',
      id: 'iopsPerGB',
      values: '10',
    },
    {
      name: 'Filesystem type',
      id: 'fsType',
      values: 'ext4',
    },
    {
      name: 'Encrypted',
      id: 'encrypted',
      nestedParameter: {
        name: 'KMS key ID',
        values: 'sample-kms-id',
      },
    },
  ],
  // not showing up on GCP cluster
  /*   'ebs.csi.aws.com': [
    {
      name: 'Type',
      id: 'type',
      values: ['gp3', 'gp2', 'io1', 'sc1', 'st1', 'standard'],
    },
    {
      name: 'IOPS per GiB',
      id: 'iopsPerGB',
      values: '10',
    },
    {
      name: 'Filesystem Type',
      id: 'fsType',
      values: ['ext4', 'xfs', 'ext2', 'ext3'],
    },
    {
      name: 'Encrypted',
      id: 'encrypted',
      nestedParameter: {
        name: 'KMS key ID',
        values: 'sample-kms-id',
      },
    },
  ],
  'kubernetes.io/gce-pd': [
    {
      name: 'Type',
      id: 'type',
      values: ['pd-standard', 'pd-ssd'],
    },
    {
      name: 'Zone',
      id: 'zone',
      values: 'kathmandu',
    },
    {
      name: 'Replication type',
      id: 'replication-type',
      values: ['none', 'regional-pd'],
    },
  ],
  'kubernetes.io/glusterfs': [
    {
      name: 'Gluster REST/Heketi URL',
      id: 'resturl',
      values: 'abcd.xyz',
    },
    {
      name: 'Gluster REST/Heketi user',
      id: 'restuser',
      values: 'user',
    },
    {
      name: 'Secret Namespace',
      id: 'secretNamespace',
      values: 'secret-ns',
    },
    {
      name: 'Secret Name',
      id: 'secretName',
      values: 'secret-name',
    },
    {
      name: 'Cluster ID',
      id: 'clusterid',
      values: 'drogo',
    },
    {
      name: 'GID min',
      id: 'gidMin',
      values: '50',
    },
    {
      name: 'GID max',
      id: 'gidMax',
      values: '100',
    },
    {
      name: 'Volume type',
      id: 'volumetype',
      values: 'ext4',
    },
  ], */
  'kubernetes.io/cinder': [
    {
      name: 'Volume type',
      id: 'type',
      values: 'ext4',
    },
    {
      name: 'Availability zone',
      id: 'availability',
      values: 'lalitpur',
    },
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
    {
      name: 'Account kind',
      id: 'kind',
      values: ['shared', 'dedicated', 'managed'],
    },
  ],
  'kubernetes.io/quobyte': [
    {
      name: 'Quobyte API server',
      id: 'quobyteAPIServer',
      values: 'test.xyzab',
    },
    {
      name: 'Registry address(es)',
      id: 'registry',
      values: 'xyz.abc',
    },
    {
      name: 'Admin secret name',
      id: 'adminSecretName',
      values: 'secret-admin',
    },
    {
      name: 'Admin secret namespace',
      id: 'adminSecretNamespace',
      values: 'secret-ns',
    },
    {
      name: 'User',
      id: 'user',
      values: 'admin',
    },
    {
      name: 'Quobyte configuration',
      id: 'quobyteConfig',
      values: 'config',
    },
    {
      name: 'Quobyte tenant',
      id: 'quobyteTenant',
      values: 'tester',
    },
  ],
  'kubernetes.io/vsphere-volume': [
    {
      name: 'Disk format',
      id: 'diskformat',
      values: ['thin', 'zeroedthick', 'eagerzeroedthick'],
    },
    {
      name: 'Datastore',
      id: 'datastore',
      values: 'store-thin',
    },
  ],
  'kubernetes.io/portworx-volume': [
    {
      name: 'Filesystem',
      id: 'fs',
      values: ['none', 'xfs', 'ext4'],
    },
    {
      name: 'Block size',
      id: 'block_size',
      values: '1024',
    },
    {
      name: 'Number of synchronous replicas to be provided in the form of replication factor',
      id: 'repl',
      values: '2',
    },
    {
      name: 'I/O priority',
      id: 'io_priority',
      values: ['high', 'medium', 'low'],
    },
    {
      name: 'Snapshot interval',
      id: 'snap_interval',
      values: '5',
    },
    {
      name: 'Aggregation level',
      id: 'aggregation_level',
      values: '2024',
    },
    {
      name: 'Ephemeral',
      id: 'ephemeral',
    },
  ],
  'kubernetes.io/scaleio': [
    {
      name: 'API gateway',
      id: 'gateway',
      values: 'abc.xyz',
    },
    {
      name: 'System name',
      id: 'system',
      values: 'test-sys',
    },
    {
      name: 'Protection domain',
      id: 'protectionDomain',
      values: 'local',
    },
    {
      name: 'Storage pool',
      id: 'storagePool',
      values: 'simple-pool',
    },
    {
      name: 'Storage mode',
      id: 'storageMode',
      values: ['thinProvisioned', 'thickProvisioned'],
    },
    {
      name: 'Secret reference',
      id: 'secretRef',
      values: 'simpleSecret',
    },
    {
      name: 'Read Only',
      id: 'readOnly',
    },
    {
      name: 'Filesystem Type',
      id: 'fsType',
      values: 'ext2',
    },
  ],
  'kubernetes.io/storageos': [
    {
      name: 'Pool',
      id: 'pool',
      values: 'test-pool',
    },
    {
      name: 'Description',
      id: 'description',
      values: 'storage drive',
    },
    {
      name: 'Filesystem type',
      id: 'fsType',
      values: 'ext3',
    },
    {
      name: 'Admin secret name',
      id: 'adminSecretName',
      values: 'admin-secret-name',
    },
    {
      name: 'Admin secret namespace',
      id: 'adminSecretNamespace',
      values: 'secret-ns',
    },
  ],
};
