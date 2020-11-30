const validationKeyToNameResolver = {
  name: 'Name',
  macAddress: 'MAC Address',
  network: 'Network',
  size: 'Size',
  url: 'Url',
  container: 'Container',
  diskInterface: 'Model',
  pvc: 'PVC',
};

export const getValidationNameByKey = (key: string) => {
  return validationKeyToNameResolver[key];
};
