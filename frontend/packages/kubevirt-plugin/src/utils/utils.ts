import { referenceForModel } from '@console/internal/module/k8s';
import { getName, getNamespace } from '@console/shared/src';
import { VirtualMachineModel } from '../models';

export const getSequence = (from, to) => Array.from({ length: to - from + 1 }, (v, i) => i + from);

export const setNativeValue = (element, value) => {
  const valueSetter = Object.getOwnPropertyDescriptor(element, 'value').set;
  const prototype = Object.getPrototypeOf(element);
  const prototypeValueSetter = Object.getOwnPropertyDescriptor(prototype, 'value').set;

  if (valueSetter && valueSetter !== prototypeValueSetter) {
    prototypeValueSetter.call(element, value);
  } else {
    valueSetter.call(element, value);
  }
};

export const getFullResourceId = (obj) =>
  `${referenceForModel(obj)}~${getNamespace(obj)}~${getName(obj)}`;

export const getVMLikeModelName = (isCreateTemplate: boolean) =>
  isCreateTemplate ? 'virtual machine template' : VirtualMachineModel.label.toLowerCase();

export const getVMLikeModelListPath = (isCreateTemplate: boolean, namespace: string) =>
  isCreateTemplate
    ? `/k8s/ns/${namespace}/vmtemplates`
    : `/k8s/ns/${namespace}/${VirtualMachineModel.plural}`;

export const getVMLikeModelDetailPath = (
  isCreateTemplate: boolean,
  namespace: string,
  name: string,
) => `${getVMLikeModelListPath(isCreateTemplate, namespace)}/${name}`;
