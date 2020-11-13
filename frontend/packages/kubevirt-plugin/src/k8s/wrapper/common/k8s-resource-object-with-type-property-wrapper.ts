/* eslint-disable lines-between-class-members */
import { ObjectEnum } from '@console/shared/src/constants/object-enum';
import {
  getName,
  getNamespace,
  hasLabel,
  getLabels,
  getOwnerReferences,
  getCreationTimestamp,
} from '@console/shared/src/selectors/common';
import { compareOwnerReference } from '@console/shared/src/utils/owner-references';
import { K8sKind, K8sResourceKind, OwnerReference } from '@console/internal/module/k8s/types';
import { K8sResourceKindMethods } from '../types/types';
import { ObjectWithTypePropertyWrapper } from './object-with-type-property-wrapper';
import { clearMetadata, clearRuntimeMetadata, initK8sObject, K8sInitAddon } from './util/k8s-mixin';

export abstract class K8sResourceObjectWithTypePropertyWrapper<
  RESOURCE extends K8sResourceKind,
  TYPE extends ObjectEnum<string>,
  COMBINED_TYPE_DATA,
  SELF extends K8sResourceObjectWithTypePropertyWrapper<RESOURCE, TYPE, COMBINED_TYPE_DATA, SELF>
> extends ObjectWithTypePropertyWrapper<RESOURCE, TYPE, COMBINED_TYPE_DATA, SELF>
  implements K8sResourceKindMethods {
  private readonly model: K8sKind;

  protected constructor(
    model: K8sKind,
    data?: RESOURCE | SELF,
    copy = false,
    typeClass: { getAll: () => TYPE[] | Readonly<TYPE[]> } = undefined,
    typeDataPath: string[] = [],
  ) {
    super(data, copy, typeClass, typeDataPath);
    this.model = model;
    if (!this.model) {
      throw new Error('model must be defined');
    }
  }

  init(data: K8sInitAddon = {}) {
    initK8sObject(this.data, this.model, data);
    return (this as any) as SELF;
  }

  clearMetadata() {
    clearMetadata(this.data);
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
  hasLabel = (label: string) => hasLabel(this.data, label);
  getOwnerReferences = () => getOwnerReferences(this.data);

  setName = (name: string) => {
    this.ensurePath('metadata');
    this.data.metadata.name = name;
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

  addLabel = (key: string, value: string) => {
    if (key) {
      this.ensurePath('metadata.labels');
      this.data.metadata.labels[key] = value;
    }
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
