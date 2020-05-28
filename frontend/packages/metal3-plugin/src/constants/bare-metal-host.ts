// TODO(jtomasek): HOST_STATUS_READY is deprecated, remove its occurrences
// once 'ready' status is replaced with 'available' in BMO
export const HOST_STATUS_READY = 'ready';
export const HOST_STATUS_AVAILABLE = 'available';
export const HOST_STATUS_DISCOVERED = 'discovered';
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

export const HOST_STATUS_TITLES = {
  [HOST_STATUS_READY]: 'Available',
  [HOST_STATUS_AVAILABLE]: 'Available',
  [HOST_STATUS_DISCOVERED]: 'Discovered',
  [HOST_STATUS_OK]: 'OK',
  [HOST_STATUS_ERROR]: 'Error',
  [HOST_STATUS_PROVISIONED]: 'Provisioned',
  [HOST_STATUS_EXTERNALLY_PROVISIONED]: 'Externally provisioned',
  [HOST_STATUS_DEPROVISIONED]: 'Deprovisioned',
  [HOST_STATUS_REGISTERING]: 'Registering',
  [HOST_STATUS_INSPECTING]: 'Inspecting',
  [HOST_STATUS_PROVISIONING]: 'Provisioning',
  [HOST_STATUS_DEPROVISIONING]: 'Deprovisioning',
  [HOST_STATUS_REGISTRATION_ERROR]: 'Registration error',
  [HOST_STATUS_INSPECTION_ERROR]: 'Inspection error',
  [HOST_STATUS_PROVISIONING_ERROR]: 'Provisioning error',
  [HOST_STATUS_POWER_MANAGEMENT_ERROR]: 'Power Management Error',
  [HOST_STATUS_MATCH_PROFILE]: 'Matching profile',
  [HOST_STATUS_DELETING]: 'Deleting',
  [HOST_STATUS_UNKNOWN]: 'Unknown',
};

export const HOST_STATUS_DESCRIPTIONS = {
  [HOST_STATUS_READY]: 'The host is available to be provisioned as a node.',
  [HOST_STATUS_AVAILABLE]: 'The host is available to be provisioned as a node.',
  [HOST_STATUS_INSPECTING]:
    'The hardware details of the host are being collected. This will take a while. The host will become available when finished.',
  [HOST_STATUS_PROVISIONING]:
    "An image is being written to the host's disk(s). This will take a while.",
  [HOST_STATUS_DEPROVISIONING]:
    "The image is being wiped from the host's disk(s). This may take a while.",
  [HOST_STATUS_REGISTRATION_ERROR]:
    "The details for the host's BMC are either incorrect or incomplete therefore the host could not be managed.",
  [HOST_STATUS_INSPECTION_ERROR]: 'Collecting hardware details from the host failed',
  [HOST_STATUS_PROVISIONING_ERROR]: 'The image could not be written to the host.',
  [HOST_STATUS_POWER_MANAGEMENT_ERROR]:
    'An error was found while trying to power the host either on or off.',
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
  HOST_STATUS_DISCOVERED,
  HOST_STATUS_OK,
  HOST_STATUS_PROVISIONED,
  HOST_STATUS_EXTERNALLY_PROVISIONED,
  HOST_STATUS_DEPROVISIONED,
];

export const HOST_HARDWARE_ERROR_STATES = [HOST_STATUS_POWER_MANAGEMENT_ERROR];

export const HOST_HEALTH_OK = 'Host is healthy';
export const HOST_HEALTH_ERROR = 'Host is in an error state';
export const HOST_HEALTH_LOADING = 'Loading host health data';
