/* eslint-disable lines-between-class-members */
import { K8sKind, K8sResourceCommon, OwnerReference } from '@console/internal/module/k8s';
import {
  getAnnotations,
  getCreationTimestamp,
  getLabels,
  getName,
  getNamespace,
  getOwnerReferences,
  hasLabel,
} from '../../../selectors/k8sCommon';
import { compareOwnerReference } from '../../../utils/utils';
import { K8sResourceKindMethods } from '../types/types';
import { clearRuntimeMetadata, initK8sObject, K8sInitAddon } from './utils/k8s-mixin';
import { Wrapper } from './wrapper';

export abstract class K8sResourceWrapper<
  RESOURCE extends K8sResourceCommon,
  SELF extends K8sResourceWrapper<RESOURCE, SELF>
> extends Wrapper<RESOURCE, SELF> implements K8sResourceKindMethods {
  private readonly model: K8sKind;

  protected constructor(model: K8sKind, data?: RESOURCE | SELF, copy = false) {
    super(data, copy);
    this.model = model;
    if (!this.model) {
      throw new Error('model must be defined');
    }
  }

  init(data: K8sInitAddon = {}) {
    initK8sObject(this.data, this.model, data);
    return (this as any) as SELF;
  }

  clearRuntimeMetadata() {
    clearRuntimeMetadata(this.data);
    return (this as any) as SELF;
  }

  getModel = () => this.model;
  getName = () => getName(this.data);
  getNamespace = () => getNamespace(this.data);
  getCreationTimestamp = () => getCreationTimestamp(this.data);
  getLabels = (defaultValue = {}) => getLabels(this.data, defaultValue);
  getAnnotations = (defaultValue = {}) => getAnnotations(this.data, defaultValue);
  hasLabel = (label: string) => hasLabel(this.data, label);
  getOwnerReferences = () => getOwnerReferences(this.data);

  setName = (name: string) => {
    this.ensurePath('metadata');
    this.data.metadata.name = name;
    delete this.data.metadata.generateName;
    return (this as any) as SELF;
  };

  setGenerateName = (generateName: string) => {
    this.ensurePath('metadata');
    this.data.metadata.generateName = generateName;
    delete this.data.metadata.name;
    return (this as any) as SELF;
  };

  setNamespace = (namespace: string) => {
    this.ensurePath('metadata');
    this.data.metadata.namespace = namespace;
    return (this as any) as SELF;
  };

  addAnotation = (key: string, value: string) => {
    if (key) {
      this.ensurePath('metadata.annotations');
      this.data.metadata.annotations[key] = value;
    }
    return (this as any) as SELF;
  };

  removeAnnotation = (key: string) => {
    if (key) {
      this.ensurePath('metadata.annotations');
      delete this.data.metadata.annotations[key];
      this.clearIfEmpty('metadata.annotations');
    }
    return (this as any) as SELF;
  };

  removeAnnotations = () => {
    delete this.data.metadata.annotations;
    return (this as any) as SELF;
  };

  addLabel = (key: string, value: string) => {
    if (key) {
      this.ensurePath('metadata.labels');
      this.data.metadata.labels[key] = value;
    }
    return (this as any) as SELF;
  };

  removeLabel = (key: string) => {
    if (key) {
      this.ensurePath('metadata.labels');
      delete this.data.metadata.labels[key];
      this.clearIfEmpty('metadata.labels');
    }
    return (this as any) as SELF;
  };

  removeLabels = () => {
    delete this.data.metadata.labels;
    return (this as any) as SELF;
  };

  addOwnerReferences = (...additionalOwnerReferences: OwnerReference[]) => {
    this.ensurePath('metadata.ownerReferences', []);
    if (additionalOwnerReferences) {
      const ownerReferences = getOwnerReferences(this.data);
      additionalOwnerReferences.forEach((newReference) => {
        if (
          !ownerReferences.some((oldReference) => compareOwnerReference(oldReference, newReference))
        ) {
          ownerReferences.push(newReference);
        }
      });
    }
    return (this as any) as SELF;
  };
}
