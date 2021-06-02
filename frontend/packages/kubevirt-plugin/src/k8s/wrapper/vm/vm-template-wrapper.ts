import { TemplateModel } from '@console/internal/models';
/* eslint-disable lines-between-class-members */
import { TemplateKind } from '@console/internal/module/k8s';
import {
  TEMPLATE_FLAVOR_LABEL,
  TEMPLATE_OS_LABEL,
  TEMPLATE_WORKLOAD_LABEL,
} from '../../../constants/vm';
import { VirtualMachineModel } from '../../../models';
import { findHighestKeyBySuffixValue, findKeySuffixValue } from '../../../selectors/utils';
import { selectVM } from '../../../selectors/vm-template/basic';
import { K8sResourceWrapper } from '../common/k8s-resource-wrapper';
import { K8sInitAddon } from '../common/util/k8s-mixin';
import { VMWrapper } from './vm-wrapper';

export class VMTemplateWrapper extends K8sResourceWrapper<TemplateKind, VMTemplateWrapper> {
  constructor(template?: TemplateKind | VMTemplateWrapper | any, copy = false) {
    super(TemplateModel, template, copy);
  }

  init(data: K8sInitAddon & { parameters?: any[]; objects?: any[] } = {}) {
    super.init(data);
    const { parameters, objects } = data || {};
    if (parameters !== undefined) {
      this.data.parameters = parameters;
    }
    if (objects !== undefined) {
      this.data.objects = objects;
    }

    return this;
  }

  getOperatingSystem = () => findHighestKeyBySuffixValue(this.getLabels(), TEMPLATE_OS_LABEL);
  getWorkloadProfile = () => findKeySuffixValue(this.getLabels(), TEMPLATE_WORKLOAD_LABEL);
  getFlavor = () => findKeySuffixValue(this.getLabels(), TEMPLATE_FLAVOR_LABEL);

  getParameters = (defaultValue = []) => (this.data && this.data.parameters) || defaultValue;

  getVM = (copy = false) => {
    const vm = selectVM(this.data);
    if (vm && vm.apiVersion) {
      vm.apiVersion = `${VirtualMachineModel.apiGroup}/${VirtualMachineModel.apiVersion}`; // Override template api version
    }

    return new VMWrapper(vm, copy);
  };

  setParameter = (name, value) => {
    const parameter = this.getParameters().find((param) => param.name === name);
    if (parameter) {
      parameter.value = value;
    }
    return this;
  };

  unrequireParameters = (parameterNames: Set<string>) => {
    this.getParameters()
      .filter((param) => parameterNames.has(param.name) && param.required)
      .forEach((param) => {
        delete param.required;
      });
    return this;
  };

  removeParameter = (parameterName: string) => {
    const index = this.data.parameters
      ? this.data.parameters.findIndex((p) => p.name === parameterName)
      : -1;
    if (index !== -1) {
      this.data.parameters.splice(index, 1);
    }
    this.clearIfEmpty('parameters');
    return this;
  };
}
