import { TFunction } from 'i18next';

export const COULD_NOT_LOAD_DATA = 'Could not load data';

export const CREATED = 'created';
export const CREATED_WITH_FAILED_CLEANUP = 'created & failed to clean up';
export const CREATED_WITH_CLEANUP = 'created & cleaned up';
export const FAILED_TO_CREATE = 'failed to create';
export const FAILED_TO_PATCH = 'failed to patch';
export const DYNAMIC = 'Dynamic';

export const READY = 'Ready';

export const EXAMPLE_CONTAINER = 'kubevirt/fedora-cloud-container-disk-demo';
export const FEDORA_IMAGE_LINK = 'https://alt.fedoraproject.org/cloud/';
export const RHEL_IMAGE_LINK =
  'https://access.redhat.com/downloads/content/479/ver=/rhel---8/8.2/x86_64/product-software';
export const CLOUD_INIT_MISSING_USERNAME =
  'No username set, see operating system documentation for the default username.';
export const CLOUD_INIT_DOC_LINK = 'https://cloudinit.readthedocs.io/en/latest/index.html';

export const getDialogUIError = (hasAllRequiredFilled, t: TFunction) =>
  hasAllRequiredFilled
    ? t('kubevirt-plugin~Please correct the invalid fields.')
    : t('kubevirt-plugin~Please fill in all required fields.');

export const getSimpleDialogUIError = (hasAllRequiredFilled, t: TFunction) =>
  hasAllRequiredFilled
    ? t('kubevirt-plugin~Some fields are not correct')
    : t('kubevirt-plugin~Required fields not completed');

export const getBooleanReadableValue = (value: boolean) => (value ? 'yes' : 'no');

export const getBooleanAsEnabledValue = (value: boolean) => (value ? 'Enabled' : 'Not Enabled');

export const getSequenceName = (name: string, usedSequenceNames?: Set<string>) => {
  if (!usedSequenceNames) {
    return `${name}-${0}`;
  }

  for (let i = 0; i < usedSequenceNames.size + 1; i++) {
    const sequenceName = `${name}-${i}`;
    if (!usedSequenceNames.has(sequenceName)) {
      return sequenceName;
    }
  }
  return null;
};

export const pluralize = (i: number, singular: string, plural: string = `${singular}s`) =>
  i === 1 ? singular : plural;

export const intervalBracket = (isInclusive: boolean, leftValue?: number, rightValue?: number) => {
  if (leftValue) {
    return isInclusive && Number.isFinite(leftValue) ? '[' : '(';
  }

  return isInclusive && Number.isFinite(rightValue) ? ']' : ')';
};

export const createUniqueNameResolver = (data: { name: string }[]) => {
  const nameCounts = (data || [])
    .filter(({ name }) => name)
    .reduce((acc, { name }) => {
      if (acc[name]) {
        acc[name].max++;
      } else {
        acc[name] = { max: 1, next: 1 };
      }
      return acc;
    }, {});

  return (name: string) => {
    if (!name) {
      return name;
    }
    if (nameCounts[name].max === 1) {
      return name;
    }
    nameCounts[name].next++;
    return `${name}-${nameCounts[name].next - 1}`;
  };
};
