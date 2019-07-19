import * as _ from 'lodash';
import { TemplateKind } from '@console/internal/module/k8s';
import { VirtualMachineModel } from '../models';
import { VMLikeEntityKind, VMKind } from '../types';
import { selectVm } from './vm-template/selectors';

export const getStorageSize = (value): string => _.get(value, 'requests.storage');

export const isVm = (vmLikeEntity: VMLikeEntityKind): boolean =>
  vmLikeEntity && vmLikeEntity.kind === VirtualMachineModel.kind;

export const asVm = (vmLikeEntity: VMLikeEntityKind): VMKind => {
  if (!vmLikeEntity) {
    return null;
  }

  if (isVm(vmLikeEntity)) {
    return vmLikeEntity as VMKind;
  }
  return selectVm(vmLikeEntity as TemplateKind);
};
