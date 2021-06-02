import { k8sCreate } from '@console/internal/module/k8s';
import { getName } from '@console/shared';
import { VirtualMachineInstanceMigrationModel } from '../../../models';
import { VMIKind } from '../../../types/vm';
import { prefixedID } from '../../../utils';
import { VMIMigration } from '../../objects/vmi-migration/vmi-migration';

export const getMigrationName = (vmi: VMIKind) => prefixedID(getName(vmi), 'migration');

export const startVMIMigration = (vmi: VMIKind) => {
  const migration = new VMIMigration()
    .setName(getMigrationName(vmi))
    .setVMI(vmi)
    .build();

  return k8sCreate(VirtualMachineInstanceMigrationModel, migration);
};
