import * as _ from 'lodash';

import { K8sResourceKind } from '@console/internal/module/k8s';
import { getName, getNamespace } from '@console/shared';

import { VirtualMachineInstanceMigrationModel } from '../../../models';
import { VMIKind } from '../../../types/vm';
import { getKubevirtModelAvailableVersion } from '../../../models/kvReferenceForModel';

/**
 * @deprecated FIXME deprecate in favor of VMIMigrationWrapper
 */
export class VMIMigration {
  private data: K8sResourceKind;

  constructor() {
    this.data = {
      apiVersion: getKubevirtModelAvailableVersion(VirtualMachineInstanceMigrationModel),
      kind: VirtualMachineInstanceMigrationModel.kind,
      metadata: {
        generateName: null,
        namespace: null,
      },
      spec: {
        vmiName: null,
      },
    };
  }

  setName(name) {
    this.data.metadata.generateName = `${name}-`;
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
