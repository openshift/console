import * as classNames from 'classnames';
import { Kebab } from '@console/internal/components/utils';
import { DASH } from '@console/shared';
import { NetworkBinding, NetworkType, POD_NETWORK } from '../../constants/vm';

export const getNetworkBindings = (networkType) => {
  switch (networkType) {
    case NetworkType.MULTUS:
      return [NetworkBinding.BRIDGE, NetworkBinding.SRIOV];
    case NetworkType.POD:
    default:
      return [NetworkBinding.MASQUERADE, NetworkBinding.BRIDGE, NetworkBinding.SRIOV];
  }
};

export const getDefaultNetworkBinding = (networkType) => {
  switch (networkType) {
    case NetworkType.MULTUS:
      return NetworkBinding.BRIDGE;
    case NetworkType.POD:
      return NetworkBinding.MASQUERADE;
    default:
      return null;
  }
};

export const getInterfaceBinding = (intface) => {
  if (intface.bridge) {
    return NetworkBinding.BRIDGE;
  }
  if (intface.sriov) {
    return NetworkBinding.SRIOV;
  }
  if (intface.masquerade) {
    return NetworkBinding.MASQUERADE;
  }
  return null;
};

export const getNetworkName = (network) => {
  if (network) {
    // eslint-disable-next-line no-prototype-builtins
    if (network.hasOwnProperty('pod')) {
      return POD_NETWORK;
    }
    // eslint-disable-next-line no-prototype-builtins
    if (network.hasOwnProperty('multus')) {
      return network.multus.networkName;
    }
  }
  return DASH;
};

export const nicTableColumnClasses = [
  classNames('col-lg-3'),
  classNames('col-lg-3'),
  classNames('col-lg-2'),
  classNames('col-lg-2'),
  classNames('col-lg-2'),
  Kebab.columnClass,
];
