import { getNamespace } from '@console/dynamic-plugin-sdk/src/shared/selectors';
import { K8sResourceKind } from '@console/internal/module/k8s';
import { getMigrationVMIName, isMigrating } from './selectors';

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
