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
      'ceph-storage-plugin~Data will be consumed by a Multi-cloud object gateway, deduped, compressed, and encrypted. The encrypted chunks would be saved on the selected BackingStores. Best used when the applications would always use the OpenShift Data Foundation endpoints to access the data.',
    ),
  },
  {
    id: BucketClassType.NAMESPACE,
    value: BucketClassType.NAMESPACE,
    label: t('ceph-storage-plugin~Namespace'),
    description: t(
      'ceph-storage-plugin~Data is stored on the NamespaceStores without performing de-duplication, compression, or encryption. BucketClasses of namespace type allow connecting to existing data and serving from them. These are best used for existing data or when other applications (and cloud-native services) need to access the data from outside OpenShift Container Storage.',
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
    label: t('ceph-storage-plugin~Single NamespaceStore'),
    description: 'The namespace bucket will read and write its data to a selected namespace store',
  },
  {
    id: NamespacePolicyType.MULTI,
    value: NamespacePolicyType.MULTI,
    label: t('ceph-storage-plugin~Multi NamespaceStores'),
    description: t(
      'ceph-storage-plugin~The namespace bucket will serve reads from several selected backing stores, creating a virtual namespace on top of them and will write to one of those as its chosen write target',
    ),
  },
  {
    id: NamespacePolicyType.CACHE,
    value: NamespacePolicyType.CACHE,
    label: t('ceph-storage-plugin~Cache NamespaceStore'),
    description: t(
      'ceph-storage-plugin~The caching bucket will serve data from a large raw data out of a local caching tiering.',
    ),
  },
];
