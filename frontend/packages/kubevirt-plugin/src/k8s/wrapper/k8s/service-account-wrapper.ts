import { K8sResourceCommon } from '@console/internal/module/k8s';
import { ServiceAccountModel } from '@console/internal/models';
import { K8sResourceWrapper } from '../common/k8s-resource-wrapper';

export class ServiceAccountWrappper extends K8sResourceWrapper<
  K8sResourceCommon,
  ServiceAccountWrappper
> {
  constructor(serviceAccount?: K8sResourceCommon | ServiceAccountWrappper | any, copy = false) {
    super(ServiceAccountModel, serviceAccount, copy);
  }
}
