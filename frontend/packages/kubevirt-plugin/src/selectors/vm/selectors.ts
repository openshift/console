import * as _ from 'lodash';
import { getDiskBus } from './disk';
import { BUS_VIRTIO } from '../../constants/vm';
import { VMKind } from '../../types';

export const getDisks = (volume) => _.get(volume, 'spec.template.spec.domain.devices.disks', []);
export const getInterfaces = (vm: VMKind) =>
  _.get(vm, 'spec.template.spec.domain.devices.interfaces', []);
export const getVolumes = (vm: VMKind) => _.get(vm, 'spec.template.spec.volumes', []);
export const getDataVolumeTemplates = (vm: VMKind) => _.get(vm, 'spec.dataVolumeTemplates', []);

export const isVMRunning = (value: VMKind) =>
  _.get(value, 'spec.running', false) as VMKind['spec']['running'];

export const isVMReady = (value: VMKind) =>
  _.get(value, 'status.ready', false) as VMKind['status']['ready'];

export const isVMCreated = (value: VMKind) =>
  _.get(value, 'status.created', false) as VMKind['status']['created'];

export const getVmPreferableDiskBus = (vm: VMKind) =>
  getDisks(vm)
    .map((disk) => getDiskBus(disk))
    .find((bus) => bus) || BUS_VIRTIO;
