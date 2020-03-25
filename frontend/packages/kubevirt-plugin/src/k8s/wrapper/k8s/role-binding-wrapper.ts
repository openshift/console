import { K8sResourceCommon } from '@console/internal/module/k8s';
import { RoleBindingModel, RoleModel, ServiceAccountModel } from '@console/internal/models';
import { K8sResourceWrapper } from '../common/k8s-resource-wrapper';

export class RoleBindingWrappper extends K8sResourceWrapper<
  K8sResourceCommon,
  RoleBindingWrappper
> {
  constructor(roleBinding?: K8sResourceCommon | RoleBindingWrappper | any, copy = false) {
    super(RoleBindingModel, roleBinding, copy);
  }

  setRole = (roleName: string) => {
    this.uncheckedData().roleRef = {
      kind: RoleModel.kind,
      name: roleName,
      apiGroup: RoleModel.apiGroup,
    };
    return this;
  };

  bindServiceAccount = (serviceAccountName: string) => {
    this.ensurePath('subjects', []);

    this.uncheckedData().subjects.push({
      kind: ServiceAccountModel.kind,
      name: serviceAccountName,
    });
    return this;
  };
}
