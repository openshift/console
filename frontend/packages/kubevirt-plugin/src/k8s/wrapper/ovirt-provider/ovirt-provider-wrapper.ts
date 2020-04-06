import { K8sResourceCommon } from '@console/internal/module/k8s';
import { K8sResourceWrapper } from '../common/k8s-resource-wrapper';
import { OVirtProviderModel } from '../../../models';
import { K8sInitAddon } from '../common/util/k8s-mixin';
import { V2V_TEMPORARY_LABEL } from '../../../constants/v2v';

type InitData = {
  isTemporary?: boolean; // remove this object automatically (by controller)
};

export class OVirtProviderWrappper extends K8sResourceWrapper<
  K8sResourceCommon,
  OVirtProviderWrappper
> {
  constructor(ovirtProvider?: K8sResourceCommon | OVirtProviderWrappper | any, copy = false) {
    super(OVirtProviderModel, ovirtProvider, copy);
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
