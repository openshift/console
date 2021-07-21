import { MachineSetKind } from '@console/internal/module/k8s';

// How to find the instance type varies by provider
// Amazon: obj.spec?.template?.spec?.providerSpec?.value?.instanceType
// Azure: obj.spec?.template?.spec?.providerSpec?.value?.vmSize
// GCP: obj.spec?.template?.spec?.providerSpec?.value?.machineType
// OpenStack: obj.spec?.template?.spec?.providerSpec?.value?.flavor
// RHV: Field is being removed in favor of users setting memory/CPU explicitly
// vSphere has no single field to gather this information
export const getMachineSetInstanceType = (obj: MachineSetKind): string =>
  obj.spec?.template?.spec?.providerSpec?.value?.instanceType ||
  obj.spec?.template?.spec?.providerSpec?.value?.vmSize ||
  obj.spec?.template?.spec?.providerSpec?.value?.machineType ||
  obj.spec?.template?.spec?.providerSpec?.value?.flavor;
