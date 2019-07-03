import { getName, getNamespace } from '@console/shared';
import { K8sResourceKind } from '@console/internal/module/k8s';
import { getMigrationVMIName, isMigrating } from './selectors';
import { VMIKind } from '../../types/vm';

export const findVMIMigration = (migrations: K8sResourceKind[], vmi: VMIKind) => {
  if (!migrations) {
    return null;
  }

  return migrations
    .filter((m) => getNamespace(m) === getNamespace(vmi) && getMigrationVMIName(m) === getName(vmi))
    .find(isMigrating);
};
