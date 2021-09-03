import { WatchK8sResource } from '@console/dynamic-plugin-sdk';
import { NodeModel } from '@console/internal/models';

export const nodeResource: WatchK8sResource = {
  kind: NodeModel.kind,
  namespaced: false,
  isList: true,
};
