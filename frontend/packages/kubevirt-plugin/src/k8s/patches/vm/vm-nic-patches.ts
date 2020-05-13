import * as _ from 'lodash';
import { Patch } from '@console/internal/module/k8s';
import { PatchBuilder } from '@console/shared/src/k8s';
import { getDisks, getInterfaces, getNetworks } from '../../../selectors/vm';
import { getVMLikePatches } from '../vm-template';
import { VMLikeEntityKind } from '../../../types/vmLike';
import { V1Network, V1NetworkInterface } from '../../../types/vm';
import { getSimpleName } from '../../../selectors/utils';
import { NetworkWrapper } from '../../wrapper/vm/network-wrapper';
import { NetworkInterfaceWrapper } from '../../wrapper/vm/network-interface-wrapper';
import { getShiftBootOrderPatches } from './utils';

export const getRemoveNICPatches = (
  vmLikeEntity: VMLikeEntityKind,
  nic: V1NetworkInterface,
): Patch[] => {
  return getVMLikePatches(vmLikeEntity, (vm) => {
    const nicName = nic.name;
    const nics = getInterfaces(vm);
    const networks = getNetworks(vm);
    const network = networks.find((n) => getSimpleName(n) === nicName);
    const networkInterfaceWrapper = new NetworkInterfaceWrapper(nic);
    const networkChoice = new NetworkWrapper(network);

    const patches = [
      new PatchBuilder('/spec/template/spec/domain/devices/interfaces')
        .setListRemove(nics, (item) => getSimpleName(item) === nicName)
        .build(),
      new PatchBuilder('/spec/template/spec/networks')
        .setListRemove(networks, (item) => getSimpleName(item) === getSimpleName(network))
        .build(),
    ];

    // if pod network is deleted, we need to set autoattachPodInterface to false
    if (networkChoice.isPodNetwork()) {
      patches.push(
        new PatchBuilder('/spec/template/spec/domain/devices/autoattachPodInterface')
          .add(false)
          .build(),
      );
    }

    if (networkInterfaceWrapper.hasBootOrder()) {
      patches.push(
        ...[
          ...getShiftBootOrderPatches(
            '/spec/template/spec/domain/devices/disks',
            getDisks(vm),
            null,
            networkInterfaceWrapper.getBootOrder(),
          ),
          ...getShiftBootOrderPatches(
            '/spec/template/spec/domain/devices/interfaces',
            nics,
            nicName,
            networkInterfaceWrapper.getBootOrder(),
          ),
        ],
      );
    }

    return _.compact(patches);
  });
};

export const getUpdateNICPatches = (
  vmLikeEntity: VMLikeEntityKind,
  {
    nic,
    network,
    oldNICName,
    oldNetworkName,
  }: { nic: V1NetworkInterface; network: V1Network; oldNICName: string; oldNetworkName: string },
): Patch[] => {
  return getVMLikePatches(vmLikeEntity, (vm) => {
    const nics = getInterfaces(vm, null);
    const networks = getNetworks(vm, null);

    return [
      new PatchBuilder('/spec/template/spec/domain/devices/interfaces')
        .setListUpdate(nic, nics, (other) => getSimpleName(other) === oldNICName)
        .build(),
      new PatchBuilder('/spec/template/spec/networks')
        .setListUpdate(network, networks, (other) => getSimpleName(other) === oldNetworkName)
        .build(),
    ].filter((patch) => patch);
  });
};
