import { getName, getNamespace } from '@console/shared';
import { K8sResourceKind } from '@console/internal/module/k8s';
import { VMIKind } from '../../types/vm';
import { getMigrationVMIName, isMigrating } from './selectors';

export const findVMIMigration = (migrations: K8sResourceKind[], vmi: VMIKind) => {
  if (!migrations) {
    return null;
  }

  return migrations
    .filter((m) => getNamespace(m) === getNamespace(vmi) && getMigrationVMIName(m) === getName(vmi))
    .find(isMigrating);
};
