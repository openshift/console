import { ProvisionerDetails } from 'packages/console-dynamic-plugin-sdk';

type Parameters = ProvisionerDetails['parameters'];

export const formatToString = (value) => value?.toString();

export const isAWSIopsPerGBVisible = (params: Parameters) => params?.type?.value === 'io1';
export const isAWSKmsKeyIdVisible = (params: Parameters) => params?.encrypted?.value ?? false;

export const isStorageOsAdminSecretNSRequired = (params: Parameters) => {
  const adminSecretName = params?.adminSecretName?.value ?? null;
  return adminSecretName !== null && adminSecretName !== '';
};

export const validateAWSIopsPerGB = (params: Parameters) => {
  if (params.iopsPerGB.value && !params.iopsPerGB.value.match(/^\d+$/)) {
    // t(''console-app~IOPS per GiB must be a number')
    return 'console-app~IOPS per GiB must be a number';
  }
  return null;
};

export const validateGcePdZone = (params: Parameters) => {
  if (params.zone.value !== '' && (params?.zones?.value ?? '') !== '') {
    // t('console-app~Zone and zones parameters must not be used at the same time')
    return 'console-app~Zone and zones parameters must not be used at the same time';
  }
  return null;
};

export const validateGcePdZones = (params: Parameters) => {
  if (params.zones.value !== '' && (params?.zone?.value ?? '') !== '') {
    // t('console-app~Zone and zones parameters must not be used at the same time')
    return 'console-app~Zone and zones parameters must not be used at the same time';
  }
  return null;
};

export const validateGCEReplicationType = (params: Parameters) => {
  if (params['replication-type'].value === 'regional-pd' && (params?.zone?.value ?? '') !== '') {
    // t('console-app~Zone cannot be specified when replication type regional-pd is chosen. Use zones instead.')
    return 'console-app~Zone cannot be specified when replication type regional-pd is chosen. Use zones instead.';
  }
  return null;
};

export const validateGlusterGidMin = (params: Parameters) => {
  if (params.gidMin.value !== '' && !params.gidMin.value.match(/^[1-9]\d*$/)) {
    // t('console-app~GID min must be number')
    return 'console-app~GID min must be number';
  }
  return null;
};

export const validateGlusterGidMax = (params: Parameters) => {
  if (params.gidMax.value !== '' && !params.gidMax.value.match(/^[1-9]\d*$/)) {
    // t('console-app~GID max must be number')
    return 'console-app~GID max must be number';
  }
  return null;
};

export const validatePortworxBlockSize = (params: Parameters) => {
  if (params.block_size.value !== '' && !params.block_size.value.match(/^[1-9]\d*$/)) {
    // t('console-app~Snapshot interval must be a number')
    return 'console-app~Snapshot interval must be a number';
  }
  return null;
};

export const validatePorworxReplicas = (params: Parameters) => {
  if (params.repl.value !== '' && !params.repl.value.match(/^[1-9]\d*$/)) {
    // t('console-app~Number of replicas must be a number')
    return 'console-app~Number of replicas must be a number';
  }
  return null;
};

export const validatePortworxSnapshotInterval = (params: Parameters) => {
  if (params.repl.value !== '' && !params.repl.value.match(/^[1-9]\d*$/)) {
    // t('console-app~Snapshot interval must be a number')
    return 'console-app~Snapshot interval must be a number';
  }
  return null;
};

export const validatePortworxAggregationLevel = (params: Parameters) => {
  if (
    params.aggregation_level.value !== '' &&
    !params.aggregation_level.value.match(/^[1-9]\d*$/)
  ) {
    // t('console-app~Aggregation level must be a number')
    return 'console-app~Aggregation level must be a number';
  }
  return null;
};
