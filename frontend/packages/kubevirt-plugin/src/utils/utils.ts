import { referenceForModel } from '@console/internal/module/k8s';
import { getName, getNamespace } from '@console/shared/src';
import * as _ from 'lodash';
import { VMWizardName, VMWizardMode } from '../constants/vm';
import { VirtualMachineModel } from '../models';

export const getSequence = (from, to) => Array.from({ length: to - from + 1 }, (v, i) => i + from);

export const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

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

export const getNextIDResolver = (entities: { id?: string }[] = []) => {
  let lastID =
    _.max(entities.map((entity) => (entity.id == null ? 0 : _.toSafeInteger(entity.id)))) || 0;
  return () => _.toString(++lastID);
};

export const wrapWithProgress = (setProgress: (inProgress: boolean) => void) => (
  promise: Promise<any>,
) => {
  setProgress(true);
  promise
    .then(() => setProgress(false))
    .catch((reason) => {
      setProgress(false);
      throw reason;
    });
};

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

export const getVMWizardCreateLink = (
  namespace: string,
  itemName: VMWizardName = VMWizardName.WIZARD,
  mode: VMWizardMode = VMWizardMode.TEMPLATE,
  template?: string,
) => {
  // Overide mode if name is import.
  const wizardMode = itemName === VMWizardName.IMPORT ? VMWizardMode.IMPORT : mode;

  const type = itemName === VMWizardName.YAML ? '~new' : '~new-wizard';
  const args = `${wizardMode ? `mode=${wizardMode}` : ''}${
    template ? `&template=${template}` : ''
  }`;

  return `/k8s/ns/${namespace || 'default'}/virtualization/${type}${args ? `?${args}` : ''}`; // covers 'yaml', new-wizard and default
};
