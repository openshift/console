import * as React from 'react';
import * as _ from 'lodash';
import { FirehoseResult } from '@console/internal/components/utils';
import { NodeKind, K8sResourceKind } from '@console/internal/module/k8s';
import { getLabels } from '@console/shared';
import { getLoadedData, isLoaded } from '../../../../utils';
import { IDLabel } from '../../../LabelsList/types';

export const useNodeQualifier = <T extends IDLabel = IDLabel>(
  labels: T[],
  nodes: FirehoseResult<K8sResourceKind[]>,
): NodeKind[] => {
  const loadedNodes = getLoadedData(nodes, []);
  const isNodesLoaded = isLoaded(nodes);

  const [qualifiedNodes, setQualifiedNodes] = React.useState([]);

  React.useEffect(() => {
    if (isNodesLoaded) {
      const filteredLabels = labels.filter(({ key }) => !!key);
      const newNodes = [];
      loadedNodes.forEach((node) => {
        const nodeLabels = getLabels(node);
        if (
          nodeLabels &&
          filteredLabels.every(({ key, value }) =>
            value ? nodeLabels[key] === value : _.has(nodeLabels, key),
          )
        ) {
          newNodes.push(node);
        }
      });
      setQualifiedNodes(newNodes);
    }
  }, [labels, loadedNodes, isNodesLoaded]);

  return qualifiedNodes;
};
