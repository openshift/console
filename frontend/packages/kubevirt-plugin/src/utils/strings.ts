export const COULD_NOT_LOAD_DATA = 'Could not load data';

export const CREATED = 'created';
export const CREATED_WITH_FAILED_CLEANUP = 'created & failed to clean up';
export const CREATED_WITH_CLEANUP = 'created & cleaned up';
export const FAILED_TO_CREATE = 'failed to create';
export const FAILED_TO_PATCH = 'failed to patch';
export const DYNAMIC = 'Dynamic';

export const EDIT = 'Edit';
export const SAVE = 'Save';
export const RESTORE = 'Restore';
export const ADD = 'Add';
export const READY = 'Ready';

export const ADD_DISK = 'Add Disk';
export const ADD_NETWORK_INTERFACE = 'Add Network Interface';
export const ADD_SNAPSHOT = 'Take Snapshot';
export const RESTORE_SNAPSHOT = 'Restore Snapshot';
export const EXAMPLE_CONTAINER = 'kubevirt/fedora-cloud-container-disk-demo';
export const FEDORA_IMAGE_LINK = 'https://alt.fedoraproject.org/cloud/';
export const RHEL_IMAGE_LINK =
  'https://access.redhat.com/downloads/content/479/ver=/rhel---8/8.2/x86_64/product-software';

// storage ui sources descriptions
export const UI_SOURCE_BLANK_DESC = 'Create an empty disk (PVC)';
export const UI_SOURCE_URL_DESC =
  'Upload content via URL (HTTP or S3 endpoint). A new persistent volume claim (PVC) will be created';
export const UI_SOURCE_CONTAINER_DESC = `Upload content from a container located in a registry accessible from the cluster. Example: ${EXAMPLE_CONTAINER}. The container disk is meant to be used only for read-only filesystems such
as CD-ROMs or for small short-lived throw-away VMs. A new persistent volume claim (PVC) will be created`;
export const UI_SOURCE_ATTACH_CLONED_DISK_DESC =
  'Clone a persistent volume claim (PVC) already available in the cluster';
export const UI_SOURCE_ATTACH_DISK_DESC =
  'Use a persistent volume claim (PVC) already available on the cluster';
export const UI_SOURCE_IMPORT_DISK_DESC = 'TBD';

// provision sources descriptions
export const PROVISION_SOURCE_PXE_DESC =
  'Boot an operating system from a server on a network. Requires a PXE bootable network attachment definition';
export const PROVISION_SOURCE_CONTAINER_DESC = `Link to a bootable operating system container located in a registry accessible from the cluster. Example: ${EXAMPLE_CONTAINER}. The container disk is meant to be used only for read-only filesystems such
as CD-ROMs or for small short-lived throw-away VMs. This will show up as a disk in the Storage step`;
export const PROVISION_SOURCE_URL_DESC =
  'Link to an operating system image via URL (HTTP or S3 endpoint). A new persistent volume claim (PVC) will be created to store this image. This will show up as a disk in the Storage step';
export const PROVISION_SOURCE_DISK_DESC = UI_SOURCE_ATTACH_DISK_DESC;

// nics descriptions
export const NIC_MODEL_VIRTIO_DESC =
  'Optimized for best performance. Supported by most Linux distributions. Windows requires additional drivers to use this model.';
export const NIC_MODEL_E1000E_DESC =
  'Supported by most operating systems including Windows out of the box. Offers lower performance compared to virtio.';
export const NIC_TYPE_MASQUERADE_DESC =
  'Put the VM behind a NAT Proxy for high compability with different network providers. The VMs IP will differ from the IP seen on the pod network';
export const NIC_TYPE_BRIDGE_DESC =
  'The VM will be bridged to the selected network, ideal for L2 devices';
export const NIC_TYPE_SRIOV_DESC =
  'Attach a virtual function network device to the VM for high performance';

export const getDialogUIError = (hasAllRequiredFilled) =>
  hasAllRequiredFilled
    ? 'Please correct the invalid fields.'
    : 'Please fill in all required fields.';

export const getSimpleDialogUIError = (hasAllRequiredFilled) =>
  hasAllRequiredFilled ? 'Some fields are not correct' : 'Required fields not completed';

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
