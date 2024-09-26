import { K8sResourceKind } from '@console/internal/module/k8s';
import { getNamespace } from '../k8sCommon';
import { getMigrationVMIName, isMigrating } from './vmi-migration';

export const findVMIMigration = (
  name: string,
  namespace: string,
  migrations?: K8sResourceKind[],
) => {
  if (!migrations) {
    return null;
  }

  return migrations
    .filter((m) => getNamespace(m) === namespace && getMigrationVMIName(m) === name)
    .find(isMigrating);
};
