import * as React from 'react';
import * as _ from 'lodash';
import { FirehoseResult } from '@console/internal/components/utils';
import { NodeKind, K8sResourceKind } from '@console/internal/module/k8s';
import { getLabels } from '@console/shared';
import { getLoadedData, isLoaded } from '../../../../utils';
import { IDLabel } from '../../../LabelsList/types';

// path.key => value || key => value

const withOperatorPredicate = <T extends IDLabel = IDLabel>(store: any, label: T) => {
  const { key, value, values, operator } = label;
  const hasMultiple = !!values;

  switch (operator) {
    case 'Exists':
      return _.has(store, key);
    case 'DoesNotExist':
      return !_.has(store, key);
    case 'In':
      return !hasMultiple
        ? _.get(store, key) === value
        : values.some((singleValue) => _.get(store, key) === singleValue);
    case 'NotIn':
      return !hasMultiple
        ? _.get(store, key) === value
        : values.every((singleValue) => _.get(store, key) !== singleValue);
    default:
      return value ? _.get(store, key) === value : _.has(store, key);
  }
};

export const useNodeQualifier = <T extends IDLabel = IDLabel>(
  nodes: FirehoseResult<K8sResourceKind[]>,
  labels: T[],
  fields?: T[],
): NodeKind[] => {
  const loadedNodes = getLoadedData(nodes, []);
  const isNodesLoaded = isLoaded(nodes);

  const [qualifiedNodes, setQualifiedNodes] = React.useState([]);

  React.useEffect(() => {
    if (isNodesLoaded) {
      const filteredLabels = labels.filter(({ key }) => !!key);

      const labelFilteredNodes = [];
      loadedNodes.forEach((node) => {
        const nodeLabels = getLabels(node);
        if (
          nodeLabels &&
          filteredLabels.every((label) => withOperatorPredicate<T>(nodeLabels, label))
        ) {
          labelFilteredNodes.push(node);
        }
      });
      setQualifiedNodes(labelFilteredNodes);

      if (fields) {
        const filteredFields = fields.filter(({ key }) => !!key);
        const fieldFilteredNodes = [];
        loadedNodes.forEach((node) => {
          if (filteredFields.every((field) => withOperatorPredicate<T>(node, field))) {
            fieldFilteredNodes.push(node);
          }
        });
        setQualifiedNodes(_.intersection(labelFilteredNodes, fieldFilteredNodes));
      }
    }
  }, [labels, fields, loadedNodes, isNodesLoaded]);

  return qualifiedNodes;
};
