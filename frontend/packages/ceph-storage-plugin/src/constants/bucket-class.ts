import { TFunction } from 'i18next';

export const bucketClassNameRegex: RegExp = /^[a-z0-9]+[a-z0-9-.]+[a-z0-9]+$/;
export const consecutivePeriodsAndHyphensRegex: RegExp = /(\.\.)|(--)/g;

export enum TimeUnits {
  HOUR = 'Hour',
  MIN = 'Min',
}

export enum BucketClassType {
  STANDARD = 'Standard',
  NAMESPACE = 'Namespace',
}

export const bucketClassTypeRadios = (t: TFunction) => [
  {
    id: BucketClassType.STANDARD,
    value: BucketClassType.STANDARD,
    label: t('ceph-storage-plugin~Standard'),
    description: t(
      'ceph-storage-plugin~Data will be ingested by Multi-cloud object gateway, deduped, compressed and encrypted. The encrypted chunks would be saved on the selected backing stores. Best used when the applications would always use the OpenShift Container Storage endpoints to access the data.',
    ),
  },
  {
    id: BucketClassType.NAMESPACE,
    value: BucketClassType.NAMESPACE,
    label: t('ceph-storage-plugin~Namespace'),
    description: t(
      'ceph-storage-plugin~Data will be stored as is(no dedupe, compression, encryption) on the namespace stores. Namespace buckets allow for connecting to existing data and serving from them. Best used for existing data or when other applications (and native cloud services) need to access the data from outside the OpenShift Container Storage.',
    ),
  },
];

export enum NamespacePolicyType {
  SINGLE = 'Single',
  MULTI = 'Multi',
  CACHE = 'Cache',
}

export const namespacePolicyTypeRadios = (t: TFunction) => [
  {
    id: NamespacePolicyType.SINGLE,
    value: NamespacePolicyType.SINGLE,
    label: t('ceph-storage-plugin~Single namespace-store'),
    description: 'The namespace bucket will read and write its data to a selected namespace store',
  },
  {
    id: NamespacePolicyType.MULTI,
    value: NamespacePolicyType.MULTI,
    label: t('ceph-storage-plugin~Multi namespace-stores'),
    description: t(
      'ceph-storage-plugin~The namespace bucket will serve reads from several selected backing stores, creating a virtual namespace on top of them and will write to one of those as its chosen write target',
    ),
  },
  {
    id: NamespacePolicyType.CACHE,
    value: NamespacePolicyType.CACHE,
    label: t('ceph-storage-plugin~Cache namespace-store'),
    description: t(
      'ceph-storage-plugin~The caching bucket will serve data from a large raw data out of a local caching tiering.',
    ),
  },
];
