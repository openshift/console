// TODO(jtomasek): HOST_STATUS_READY is deprecated, remove its occurrences
// once 'ready' status is replaced with 'available' in BMO
export const HOST_STATUS_READY = 'ready';
export const HOST_STATUS_AVAILABLE = 'available';
export const HOST_STATUS_UNMANAGED = 'unmanaged';
export const HOST_STATUS_OK = 'OK';
export const HOST_STATUS_ERROR = 'error';
export const HOST_STATUS_UNKNOWN = 'Unknown';
export const HOST_STATUS_EXTERNALLY_PROVISIONED = 'externally provisioned';
export const HOST_STATUS_PROVISIONED = 'provisioned';
export const HOST_STATUS_DEPROVISIONED = 'deprovisioned';
export const HOST_STATUS_REGISTERING = 'registering';
export const HOST_STATUS_INSPECTING = 'inspecting';
export const HOST_STATUS_PROVISIONING = 'provisioning';
export const HOST_STATUS_DEPROVISIONING = 'deprovisioning';
export const HOST_STATUS_MATCH_PROFILE = 'match profile';
export const HOST_STATUS_REGISTRATION_ERROR = 'registration error';
export const HOST_STATUS_INSPECTION_ERROR = 'inspection error';
export const HOST_STATUS_PROVISIONING_ERROR = 'provisioning error';
export const HOST_STATUS_POWER_MANAGEMENT_ERROR = 'power management error';
export const HOST_STATUS_DELETING = 'deleting';

export const HOST_POWER_STATUS_POWERED_ON = 'Powered on';
export const HOST_POWER_STATUS_POWERED_OFF = 'Powered off';
export const HOST_POWER_STATUS_POWERING_OFF = 'Powering off';
export const HOST_POWER_STATUS_POWERING_ON = 'Powering on';

// NOTE(yaacov): HOST_STATUS_TITLE_KEYS translation keys.
// t('metal3-plugin~Available')
// t('metal3-plugin~OK')
// t('metal3-plugin~Error')
// t('metal3-plugin~Provisioned')
// t('metal3-plugin~Externally provisioned')
// t('metal3-plugin~Deprovisioned')
// t('metal3-plugin~Registering')
// t('metal3-plugin~Inspecting')
// t('metal3-plugin~Provisioning')
// t('metal3-plugin~Deprovisioning')
// t('metal3-plugin~Registering')
// t('metal3-plugin~Provisioned')
// t('metal3-plugin~Registration error')
// t('metal3-plugin~Inspection error')
// t('metal3-plugin~Provisioning error')
// t('metal3-plugin~Power Management Error'
// t('metal3-plugin~Matching profile')
// t('metal3-plugin~Deleting')
// t('metal3-plugin~Unknown')
// t('metal3-plugin~Unmanaged')

export const HOST_STATUS_TITLE_KEYS = {
  [HOST_STATUS_READY]: 'metal3-plugin~Available',
  [HOST_STATUS_AVAILABLE]: 'metal3-plugin~Available',
  [HOST_STATUS_OK]: 'metal3-plugin~OK',
  [HOST_STATUS_ERROR]: 'metal3-plugin~Error',
  [HOST_STATUS_PROVISIONED]: 'metal3-plugin~Provisioned',
  [HOST_STATUS_EXTERNALLY_PROVISIONED]: 'metal3-plugin~Externally provisioned',
  [HOST_STATUS_DEPROVISIONED]: 'metal3-plugin~Deprovisioned',
  [HOST_STATUS_REGISTERING]: 'metal3-plugin~Registering',
  [HOST_STATUS_INSPECTING]: 'metal3-plugin~Inspecting',
  [HOST_STATUS_PROVISIONING]: 'metal3-plugin~Provisioning',
  [HOST_STATUS_DEPROVISIONING]: 'metal3-plugin~Deprovisioning',
  [HOST_STATUS_REGISTRATION_ERROR]: 'metal3-plugin~Registration error',
  [HOST_STATUS_INSPECTION_ERROR]: 'metal3-plugin~Inspection error',
  [HOST_STATUS_PROVISIONING_ERROR]: 'metal3-plugin~Provisioning error',
  [HOST_STATUS_POWER_MANAGEMENT_ERROR]: 'metal3-plugin~Power Management Error',
  [HOST_STATUS_MATCH_PROFILE]: 'metal3-plugin~Matching profile',
  [HOST_STATUS_DELETING]: 'metal3-plugin~Deleting',
  [HOST_STATUS_UNKNOWN]: 'metal3-plugin~Unknown',
  [HOST_STATUS_UNMANAGED]: 'metal3-plugin~Unmanaged',
};

// NOTE(yaacov): HOST_STATUS_DESCRIPTION_KEYS translation keys.
// t('metal3-plugin~The host is available to be provisioned as a node.')
// t('metal3-plugin~The host is available to be provisioned as a node.')
// t('metal3-plugin~The hardware details of the host are being collected. This will take a while. The host will become available when finished.')
// t('metal3-plugin~An image is being written to the host's disk(s). This will take a while."')
// t('metal3-plugin~The image is being wiped from the host's disk(s). This may take a while.')
// t('metal3-plugin~The details for the host's BMC are either incorrect or incomplete therefore the host could not be managed.')
// t('metal3-plugin~Collecting hardware details from the host failed.')
// t('metal3-plugin~The image could not be written to the host.')
// t('metal3-plugin~An error was found while trying to power the host either on or off.')
// t('metal3-plugin~This host was provisioned outside of this cluster and added manually.')
// t('metal3-plugin~Power operations cannot be performed on this host until Baseboard Management Controller (BMC) credentials are provided.')

export const HOST_STATUS_DESCRIPTION_KEYS = {
  [HOST_STATUS_READY]: 'metal3-plugin~The host is available to be provisioned as a node.',
  [HOST_STATUS_AVAILABLE]: 'metal3-plugin~The host is available to be provisioned as a node.',
  [HOST_STATUS_INSPECTING]:
    'metal3-plugin~The hardware details of the host are being collected. This will take a while. The host will become available when finished.',
  [HOST_STATUS_PROVISIONING]:
    "metal3-plugin~An image is being written to the host's disk(s). This will take a while.",
  [HOST_STATUS_DEPROVISIONING]:
    "metal3-plugin~The image is being wiped from the host's disk(s). This may take a while.",
  [HOST_STATUS_REGISTRATION_ERROR]:
    "metal3-plugin~The details for the host's BMC are either incorrect or incomplete therefore the host could not be managed.",
  [HOST_STATUS_INSPECTION_ERROR]: 'metal3-plugin~Collecting hardware details from the host failed.',
  [HOST_STATUS_PROVISIONING_ERROR]: 'metal3-plugin~The image could not be written to the host.',
  [HOST_STATUS_POWER_MANAGEMENT_ERROR]:
    'metal3-plugin~An error was found while trying to power the host either on or off.',
  [HOST_STATUS_EXTERNALLY_PROVISIONED]:
    'metal3-plugin~This host was provisioned outside of this cluster and added manually.',
  [HOST_STATUS_UNMANAGED]:
    'metal3-plugin~Power operations cannot be performed on this host until Baseboard Management Controller (BMC) credentials are provided.',
};

export const HOST_REGISTERING_STATES = [
  HOST_STATUS_REGISTERING,
  HOST_STATUS_INSPECTING,
  HOST_STATUS_MATCH_PROFILE,
];

export const HOST_PROVISIONING_STATES = [HOST_STATUS_PROVISIONING, HOST_STATUS_DEPROVISIONING];

export const HOST_ERROR_STATES = [
  HOST_STATUS_REGISTRATION_ERROR,
  HOST_STATUS_INSPECTION_ERROR,
  HOST_STATUS_PROVISIONING_ERROR,
  HOST_STATUS_POWER_MANAGEMENT_ERROR,
  HOST_STATUS_ERROR,
];

export const HOST_WARN_STATES = [];

export const HOST_PROGRESS_STATES = [
  HOST_STATUS_INSPECTING,
  HOST_STATUS_PROVISIONING,
  HOST_STATUS_DEPROVISIONING,
  HOST_STATUS_REGISTERING,
  HOST_STATUS_MATCH_PROFILE,
  HOST_STATUS_DELETING,
];

export const HOST_SUCCESS_STATES = [
  HOST_STATUS_READY,
  HOST_STATUS_AVAILABLE,
  HOST_STATUS_OK,
  HOST_STATUS_PROVISIONED,
  HOST_STATUS_EXTERNALLY_PROVISIONED,
  HOST_STATUS_DEPROVISIONED,
];

export const HOST_INFO_STATES = [HOST_STATUS_UNMANAGED];

export const HOST_HARDWARE_ERROR_STATES = [HOST_STATUS_POWER_MANAGEMENT_ERROR];
