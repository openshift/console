import * as _ from 'lodash';
import { getAddNicPatch, getDeviceBootOrderPatch } from 'kubevirt-web-ui-components';
import { Patch } from '@console/internal/module/k8s';
import { getInterfaces, getNetworks, getNicBootOrder } from '../../../selectors/vm';
import { getVmLikePatches } from '../vm-template';
import { VMLikeEntityKind } from '../../../types';

export const getRemoveNicPatches = (vmLikeEntity: VMLikeEntityKind, nic: any): Patch[] => {
  return getVmLikePatches(vmLikeEntity, (vm) => {
    const nicName = nic.name;
    const nics = getInterfaces(vm);
    const networks = getNetworks(vm);

    const nicIndex = nics.findIndex((d) => d.name === nicName);
    const networkIndex = networks.findIndex((v) => v.name === nicName);

    const patches: Patch[] = [];
    if (nicIndex >= 0) {
      patches.push({
        op: 'remove',
        path: `/spec/template/spec/domain/devices/interfaces/${nicIndex}`,
      });
    }

    if (networkIndex >= 0) {
      patches.push({
        op: 'remove',
        path: `/spec/template/spec/networks/${networkIndex}`,
      });
    }

    // if pod network is deleted, we need to set autoattachPodInterface to false
    if (_.get(nic, 'network.pod')) {
      const op = _.has(vm, 'spec.domain.devices.autoattachPodInterface') ? 'replace' : 'add';
      patches.push({
        op,
        path: '/spec/template/spec/domain/devices/autoattachPodInterface',
        value: false,
      });
    }

    const bootOrderIndex = getNicBootOrder(nic);
    if (bootOrderIndex != null) {
      return [...patches, ...getDeviceBootOrderPatch(vm, 'interfaces', nicName)];
    }

    return patches;
  });
};

export const getAddNicPatches = (vmLikeEntity: VMLikeEntityKind, nic: any): Patch[] => {
  return getVmLikePatches(vmLikeEntity, (vm) => {
    return getAddNicPatch(vm, nic);
  });
};
