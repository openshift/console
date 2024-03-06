import { K8sResourceKind, StorageClassResourceKind } from '@console/internal/module/k8s';

export const getRequestedPVCSize = (pvc: K8sResourceKind): string =>
  pvc?.spec?.resources?.requests?.storage;

export const onlyPvcSCs = (
  scObj: StorageClassResourceKind,
  scResourceLoadError: boolean,
  scResource: StorageClassResourceKind | null,
) =>
  !scResourceLoadError
    ? scObj.provisioner.includes(scResource?.provisioner) &&
      scObj.parameters?.encrypted === scResource?.parameters?.encrypted
    : true;
