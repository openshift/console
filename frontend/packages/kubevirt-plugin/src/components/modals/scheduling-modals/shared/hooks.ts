import * as React from 'react';
import * as _ from 'lodash';
import { FirehoseResult } from '@console/internal/components/utils';
import { NodeKind } from '@console/internal/module/k8s';
import { getLabels, getNodeTaints } from '@console/shared';
import { getLoadedData, isLoaded } from '../../../../utils';
import { IDLabel } from '../../../LabelsList/types';

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
  nodes: FirehoseResult<NodeKind[]>,
  constraintType: NodeQualifierPropertyType,
  constraints: T[],
): NodeKind[] => {
  const loadedNodes = getLoadedData(nodes, []);
  const isNodesLoaded = isLoaded(nodes);

  const [qualifiedNodes, setQualifiedNodes] = React.useState([]);

  React.useEffect(() => {
    const filteredConstraints = constraints.filter(({ key }) => !!key);
    if (!_.isEmpty(filteredConstraints) && isNodesLoaded) {
      const filteredNodes = [];
      loadedNodes.forEach((node) => {
        if (constraintType === 'label') {
          const nodeLabels = getLabels(node);
          if (
            nodeLabels &&
            filteredConstraints.every((label) => withOperatorPredicate<T>(nodeLabels, label))
          ) {
            filteredNodes.push(node);
          }
        }
        if (
          constraintType === 'field' &&
          filteredConstraints.every((field) => withOperatorPredicate<T>(node, field))
        ) {
          filteredNodes.push(node);
        }

        if (constraintType === 'taint') {
          const nodeTaints = getNodeTaints(node);
          if (
            nodeTaints &&
            filteredConstraints.every(({ key, value, effect }) =>
              nodeTaints.some(
                (taint) =>
                  taint.key === key && (!value || taint.value === value) && taint.effect === effect,
              ),
            )
          ) {
            filteredNodes.push(node);
          }
        }
      });
      setQualifiedNodes(filteredNodes);
    }
  }, [constraintType, constraints, loadedNodes, isNodesLoaded]);

  return qualifiedNodes;
};

export type NodeQualifierPropertyType = 'label' | 'taint' | 'field';
