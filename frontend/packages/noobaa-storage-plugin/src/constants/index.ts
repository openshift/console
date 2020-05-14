export const ACCOUNTS = 'Accounts';
export const PROVIDERS = 'Providers';
export const BY_IOPS = 'I/O Operations';
export const BY_LOGICAL_USAGE = 'Logical Used Capacity';
export const BY_PHYSICAL_VS_LOGICAL_USAGE = 'Physical Vs Logical Usage';
export const BY_EGRESS = 'Egress';
export const PROJECTS = 'Projects';
export const BUCKET_CLASS = 'Bucket Class';
export const OCS_NS = 'openshift-storage';
export const NB_PROVISIONER = 'noobaa.io/obc';

export const CHART_LABELS = {
  [BY_LOGICAL_USAGE]: 'Logical used capacity per account',
  [BY_PHYSICAL_VS_LOGICAL_USAGE]: 'Physical vs. Logical used capacity',
  [BY_EGRESS]: 'Egress Per Provider',
  [BY_IOPS]: 'I/O Operations count',
};

export enum BC_PROVIDERS {
  AWS = 'AWS S3',
  S3 = 'S3 Compatible',
  PVC = 'PVC',
  GCP = 'Google cloud storage',
  AZURE = 'Azure Blob',
  IBM = 'IBM COS',
}

export const PROVIDERS_NOOBAA_MAP = {
  [BC_PROVIDERS.AWS]: 'awsS3',
  [BC_PROVIDERS.S3]: 's3Compatible',
  [BC_PROVIDERS.AZURE]: 'azureBlob',
  [BC_PROVIDERS.GCP]: 'googleCloudStorage',
  [BC_PROVIDERS.PVC]: 'pvPool',
  [BC_PROVIDERS.IBM]: 'ibmCos',
};

export const BUCKET_LABEL_NOOBAA_MAP = {
  [BC_PROVIDERS.AWS]: 'targetBucket',
  [BC_PROVIDERS.S3]: 'targetBucket',
  [BC_PROVIDERS.AZURE]: 'targetBlobContainer',
  [BC_PROVIDERS.GCP]: 'targetBucket',
  [BC_PROVIDERS.IBM]: 'targetBucket',
};

export const NOOBAA_TYPE_MAP = {
  [BC_PROVIDERS.AWS]: 'aws-s3',
  [BC_PROVIDERS.S3]: 's3-compatible',
  [BC_PROVIDERS.AZURE]: 'azure-blob',
  [BC_PROVIDERS.GCP]: 'google-cloud-storage',
  [BC_PROVIDERS.PVC]: 'pv-pool',
  [BC_PROVIDERS.IBM]: 'ibm-cos',
};

export const AWS_REGIONS = [
  'us-east-1',
  'us-east-2',
  'us-west-1',
  'us-west-2',
  'ca-central-1',
  'eu-central-1',
  'eu-west-1',
  'eu-west-2',
  'eu-west-3',
  'eu-north-1',
  'ap-east-1',
  'ap-northeast-1',
  'ap-northeast-2',
  'ap-northeast-3',
  'ap-southeast-1',
  'ap-southeast-2',
  'ap-south-1',
  'me-south-1',
  'sa-east-1',
];
