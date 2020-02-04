export const BMH_PAGE_FILTERS = [
  'Registering',
  'Available',
  'Provisioning',
  'Provisioned',
  'Error',
  'Maintenance',
  'Other',
];

export enum BMH_ACTION {
  Deprovision = 'Deprovision',
  PowerOff = 'Power Off',
  PowerOn = 'Power On',
}

export enum BMH_STATUS {
  Provisioned = 'Provisioned',
}

export const SEC = 1000;
export const MIN = 60 * SEC;

export const BMH_ACTION_TIMEOUT_DEFAULT = 2 * MIN;
export const BMH_ACTION_TIMEOUT_PROVISION = 10 * MIN;
export const BMH_ACTION_TIMEOUT_PROVISION_DEPROVISION_CYCLE =
  BMH_ACTION_TIMEOUT_DEFAULT + BMH_ACTION_TIMEOUT_PROVISION;
