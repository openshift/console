/* eslint-disable lines-between-class-members */
import { getName } from '@console/shared/src';
import { apiVersionForModel, K8sKind, TemplateKind } from '@console/internal/module/k8s';
import { TemplateModel } from '@console/internal/models';
import { Wrapper } from '../common/wrapper';
import { getLabels } from '../../../selectors/selectors';
import { ensurePath } from '../utils/utils';
import { selectVM } from '../../../selectors/vm-template/selectors';
import { MutableVMWrapper, VMWrapper } from './vm-wrapper';

export class VMTemplateWrapper extends Wrapper<TemplateKind> {
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

  getName = () => getName(this.data);
  getLabels = (defaultValue = {}) => getLabels(this.data, defaultValue);

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
