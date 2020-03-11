import { K8sResourceCommon } from '@console/internal/module/k8s';
import { RoleModel } from '@console/internal/models';
import { K8sResourceWrapper } from '../common/k8s-resource-wrapper';

export class RoleWrappper extends K8sResourceWrapper<K8sResourceCommon, RoleWrappper> {
  constructor(role?: K8sResourceCommon | RoleWrappper | any, copy = false) {
    super(RoleModel, role, copy);
  }

  addRules = (...rules: any[]) => {
    this.ensurePath('rules', []);
    this.uncheckedData().rules.push(...rules);
    return this;
  };
}
