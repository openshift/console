import { K8sResourceCommon } from '@console/dynamic-plugin-sdk';
import { V2V_TEMPORARY_LABEL } from '../../../constants/v2v';
import { V2VVMwareModel } from '../../../models';
import { K8sResourceWrapper } from '../common/k8s-resource-wrapper';
import { K8sInitAddon } from '../common/util/k8s-mixin';

type InitData = {
  isTemporary?: boolean; // remove this object automatically (by controller)
};

export class V2VVMwareWrappper extends K8sResourceWrapper<K8sResourceCommon, V2VVMwareWrappper> {
  constructor(v2vvmware?: K8sResourceCommon | V2VVMwareWrappper | any, copy = false) {
    super(V2VVMwareModel, v2vvmware, copy);
  }

  init(data: K8sInitAddon & InitData = {}) {
    super.init(data);
    const { isTemporary } = data;

    if (isTemporary) {
      this.ensurePath('metadata.labels');
      this.data.metadata.labels[V2V_TEMPORARY_LABEL] = 'true'; // will be automatically garbage-collected by the controller
    }

    return this;
  }

  setConnection = (connectionSecretName: string) => {
    this.ensurePath('spec');
    (this.data as any).spec.connection = connectionSecretName;
    return this;
  };
}
