import * as _ from 'lodash';
import { K8sKind, TemplateKind } from '@console/internal/module/k8s';
import { TemplateModel } from '@console/internal/models';
import { VirtualMachineModel } from '../models';
import { VMKind, VMLikeEntityKind } from '../types';
import { selectVM } from './vm-template/selectors';

export const getAnnotations = (vm: VMLikeEntityKind, defaultValue?: any) =>
  _.get(vm, 'metadata.annotations', defaultValue);
export const getDescription = (vm: VMLikeEntityKind) =>
  _.get(vm, 'metadata.annotations.description');

export const getStorageSize = (value): string => _.get(value, 'requests.storage');

export const isVM = (vmLikeEntity: VMLikeEntityKind): boolean =>
  vmLikeEntity && vmLikeEntity.kind === VirtualMachineModel.kind;

export const getVMLikeModel = (vmLikeEntity: VMLikeEntityKind): K8sKind =>
  isVM(vmLikeEntity) ? VirtualMachineModel : TemplateModel;

export const asVM = (vmLikeEntity: VMLikeEntityKind): VMKind => {
  if (!vmLikeEntity) {
    return null;
  }

  if (isVM(vmLikeEntity)) {
    return vmLikeEntity as VMKind;
  }
  return selectVM(vmLikeEntity as TemplateKind);
};
