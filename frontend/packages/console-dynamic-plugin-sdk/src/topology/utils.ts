import { GraphElement } from '@patternfly/react-topology';
import OdcBaseNode from '@console/topology/src/elements/OdcBaseNode';
import { TopologyDataObject } from '../extensions/topology-types';
import { K8sResourceKind } from '../lib-core';

export const getTopologyResourceObject = (topologyObject: TopologyDataObject): K8sResourceKind => {
  if (!topologyObject) {
    return null;
  }
  return topologyObject.resource || topologyObject.resources?.obj;
};

export const getResource = <T = K8sResourceKind>(node: GraphElement): T => {
  const resource = (node as OdcBaseNode)?.getResource();
  return (resource as T) || (getTopologyResourceObject(node?.getData()) as T);
};

export const formatToFractionalDigits = (value, digits) =>
  Intl.NumberFormat(undefined, {
    minimumFractionDigits: digits,
    maximumFractionDigits: digits,
  }).format(value);

export const formatBytesAsMiB = (bytes) => {
  const mib = bytes / 1024 / 1024;
  return formatToFractionalDigits(mib, 1);
};

export const formatBytesAsGiB = (bytes) => {
  const gib = bytes / 1024 / 1024 / 1024;
  return formatToFractionalDigits(gib, 2);
};

export const formatCores = (cores) => formatToFractionalDigits(cores, 3);
