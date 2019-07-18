import * as _ from 'lodash';
import { getName, getNamespace } from '@console/shared';
import { apiVersionForModel, K8sResourceKind } from '@console/internal/module/k8s';
import { VMIKind } from '../../../types/vm';
import { VirtualMachineInstanceMigrationModel } from '../../../models';

export class VMIMigration {
  private data: K8sResourceKind;

  constructor() {
    this.data = {
      apiVersion: apiVersionForModel(VirtualMachineInstanceMigrationModel),
      kind: VirtualMachineInstanceMigrationModel.kind,
      metadata: {
        name: null,
        namespace: null,
      },
      spec: {
        vmiName: null,
      },
    };
  }

  setName(name) {
    this.data.metadata.name = name;
    return this;
  }

  setVMI(vmi: VMIKind) {
    this.data.metadata.namespace = getNamespace(vmi);
    this.data.spec.vmiName = getName(vmi);
    return this;
  }

  build() {
    return _.cloneDeep(this.data);
  }
}
