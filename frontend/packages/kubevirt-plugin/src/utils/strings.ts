import { TFunction } from 'i18next';
import { adjectives, animals, uniqueNamesGenerator } from 'unique-names-generator';

import { TemplateKind } from '@console/internal/module/k8s';
import { alignWithDNS1123 } from '@console/shared/src/utils/validation/validation';

import { TEMPLATE_BASE_IMAGE_NAME_PARAMETER } from '../constants';
import { getParameterValue } from '../selectors/selectors';
import { getTemplateName } from '../selectors/vm-template/basic';

export const COULD_NOT_LOAD_DATA = 'Could not load data';

export const CREATED = 'created';
export const CREATED_WITH_FAILED_CLEANUP = 'created & failed to clean up';
export const CREATED_WITH_CLEANUP = 'created & cleaned up';
export const FAILED_TO_CREATE = 'failed to create';
export const FAILED_TO_PATCH = 'failed to patch';
export const DYNAMIC = 'Dynamic';

export const READY = 'Ready';

export const CLOUD = 'cloud';
export const SSH = 'ssh';

export const EXAMPLE_CONTAINER = 'registry.redhat.io/rhel8/rhel-guest-image';
export const FEDORA_EXAMPLE_CONTAINER = 'quay.io/kubevirt/fedora-cloud-container-disk-demo:latest';
export const CENTOS_IMAGE_LINK = 'https://cloud.centos.org/centos/';
export const FEDORA_IMAGE_LINK = 'https://alt.fedoraproject.org/cloud/';
export const RHEL_IMAGE_LINK =
  'https://access.redhat.com/downloads/content/479/ver=/rhel---8/8.2/x86_64/product-software';
export const WINDOWS_IMAGE_LINK = 'https://www.microsoft.com/en-us/software-download/windows10ISO';
export const CLOUD_INIT_MISSING_USERNAME =
  'No username set, see operating system documentation for the default username.';
export const CLOUD_INIT_DOC_LINK = 'https://cloudinit.readthedocs.io/en/latest/index.html';
export const STORAGE_CLASS_SUPPORTED_MATRIX_DOC_LINK =
  'https://docs.openshift.com/container-platform/4.6/virt/virtual_machines/virtual_disks/virt-features-for-storage.html';
export const STORAGE_CLASS_SUPPORTED_RHV_LINK =
  'https://docs.openshift.com/container-platform/4.7/virt/virtual_machines/importing_vms/virt-importing-rhv-vm.html';
export const STORAGE_CLASS_SUPPORTED_VMWARE_LINK =
  'https://docs.openshift.com/container-platform/4.7/virt/virtual_machines/importing_vms/virt-importing-vmware-vm.html';
export const NODE_PORTS_LINK =
  'https://docs.openshift.com/container-platform/4.7/networking/configuring_ingress_cluster_traffic/configuring-ingress-cluster-traffic-nodeport.html#nw-using-nodeport_configuring-ingress-cluster-traffic-nodeport';

export const PREALLOCATION_DATA_VOLUME_LINK =
  'https://docs.openshift.com/container-platform/4.7/virt/virtual_machines/virtual_disks/virt-using-preallocation-for-datavolumes.html';
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

export const generateVMName = (template: TemplateKind): string =>
  alignWithDNS1123(
    `${getParameterValue(template, TEMPLATE_BASE_IMAGE_NAME_PARAMETER) ||
      getTemplateName(template)}-${uniqueNamesGenerator({
      dictionaries: [adjectives, animals],
      separator: '-',
    })}`,
  );
