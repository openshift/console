import * as _ from 'lodash';
import { getName, getNamespace } from '@console/shared';
import { VirtualMachineInstanceModel } from '../../models';
import { getConsoleAPIBase } from '../../utils/url';
import { VMIKind } from '../../types/vm';
import { getVolumePersistentVolumeClaimName } from '../vm/volume';
import { getVMIVolumes } from './basic';
import { K8sResourceKind } from '@console/internal/module/k8s/types';

export const getVMISubresourcePath = () =>
  `${getConsoleAPIBase()}/apis/subresources.${VirtualMachineInstanceModel.apiGroup}`;

export const getVMIApiPath = (vmi: VMIKind) =>
  `${VirtualMachineInstanceModel.apiVersion}/namespaces/${getNamespace(vmi)}/${
    VirtualMachineInstanceModel.plural
  }/${getName(vmi)}`;

export const getVMIPVCSourceByDisk = (vmi: VMIKind, diskName: string) =>
  getVolumePersistentVolumeClaimName(getVMIVolumes(vmi).find((vol) => vol.name === diskName));

export const getVMIDataVolumeNameByDisk = (vmi: VMIKind, diskName: string): string => {
  const volume = getVMIVolumes(vmi).find((vol) => vol.name === diskName);
  return _.get(volume, 'dataVolume.name');
};

export const getVMIURLSourceByDisk = (dv: K8sResourceKind) =>
  dv && dv.spec && dv.spec.source && dv.spec.source.http && dv.spec.source.http.url;
