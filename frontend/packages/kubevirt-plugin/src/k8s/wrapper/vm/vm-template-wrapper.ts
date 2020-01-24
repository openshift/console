/* eslint-disable lines-between-class-members */
import { apiVersionForModel, K8sKind, TemplateKind } from '@console/internal/module/k8s';
import { TemplateModel } from '@console/internal/models';
import { K8sResourceWrapper } from '../common/k8s-resource-wrapper';
import { ensurePath } from '../utils/utils';
import { MutableVMWrapper, VMWrapper } from './vm-wrapper';
import { K8sResourceKindMethods } from '../types/types';
import { selectVM } from '../../../selectors/vm-template/basic';
import { findKeySuffixValue } from '../../../selectors/utils';
import {
  TEMPLATE_FLAVOR_LABEL,
  TEMPLATE_OS_LABEL,
  TEMPLATE_WORKLOAD_LABEL,
} from '../../../constants/vm';

export class VMTemplateWrapper extends K8sResourceWrapper<TemplateKind>
  implements K8sResourceKindMethods {
  static mergeWrappers = (...vmTemplateWrappers: VMTemplateWrapper[]): VMTemplateWrapper =>
    VMTemplateWrapper.defaultMergeWrappers(VMTemplateWrapper, vmTemplateWrappers);

  static initializeFromSimpleData = (params?: {
    name?: string;
    namespace?: string;
    labels?: { [k: string]: string };
    parameters?: any[];
    objects?: any[];
  }) => {
    const { name, namespace, labels, parameters, objects } = params || {};

    return new VMTemplateWrapper({
      apiVersion: apiVersionForModel(TemplateModel),
      kind: TemplateModel.kind,
      metadata: {
        name,
        namespace,
        labels,
      },
      objects,
      parameters,
    });
  };

  static initialize = (vmTemplate?: TemplateKind, copy?: boolean) =>
    new VMTemplateWrapper(vmTemplate, copy && { copy });

  protected constructor(
    vmTemplate?: TemplateKind,
    opts?: {
      copy?: boolean;
    },
  ) {
    super(vmTemplate, opts);
  }

  getOperatingSystem = () => findKeySuffixValue(this.getLabels(), TEMPLATE_OS_LABEL);
  getWorkloadProfile = () => findKeySuffixValue(this.getLabels(), TEMPLATE_WORKLOAD_LABEL);
  getFlavor = () => findKeySuffixValue(this.getLabels(), TEMPLATE_FLAVOR_LABEL);

  getParameters = (defaultValue = []) => (this.data && this.data.parameters) || defaultValue;

  getVM = () => VMWrapper.initialize(selectVM(this.data));
}

export class MutableVMTemplateWrapper extends VMTemplateWrapper {
  public constructor(vmTemplate?: TemplateKind, opts?: { copy?: boolean }) {
    super(vmTemplate, opts);
  }

  setName = (name: string) => {
    this.ensurePath('metadata', {});
    this.data.metadata.name = name;
  };

  setNamespace = (namespace: string) => {
    this.ensurePath('metadata', {});
    this.data.metadata.namespace = namespace;
  };

  setModel = (model: K8sKind) => {
    this.data.kind = model.kind;
    this.data.apiVersion = apiVersionForModel(model);
  };

  addAnotation = (key: string, value: string) => {
    if (key) {
      this.ensurePath('metadata.annotations', {});
      this.data.metadata.annotations[key] = value;
    }
  };

  addLabel = (key: string, value: string) => {
    if (key) {
      this.ensurePath('metadata.labels', {});
      this.data.metadata.labels[key] = value;
    }
  };

  setParameter = (name, value) => {
    const parameter = this.getParameters().find((param) => param.name === name);
    if (parameter) {
      parameter.value = value;
    }
  };

  unrequireParameters = (parameterNames: Set<string>) =>
    this.getParameters()
      .filter((param) => parameterNames.has(param.name) && param.required)
      .forEach((param) => {
        delete param.required;
      });

  getMutableVM = () => new MutableVMWrapper(selectVM(this.data));

  asMutableResource = () => this.data;

  ensurePath = (path: string[] | string, value) => ensurePath(this.data, path, value);
}
