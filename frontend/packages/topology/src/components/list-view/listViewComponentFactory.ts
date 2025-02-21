/* eslint-disable import/no-cycle */
import * as React from 'react';
import { Node } from '@patternfly/react-topology';
import { TYPE_HELM_RELEASE } from '@console/helm-plugin/src/topology/components/const';
import HelmReleaseListViewNode from '@console/helm-plugin/src/topology/listView/HelmReleaseListViewNode';
import { knativeListViewNodeComponentFactory } from '@console/knative-plugin/src/topology/listView/knativeListViewComponentFactory';
import { kubevirtListViewNodeComponentFactory } from '@console/kubevirt-plugin/src/topology/listView/kubevirtListViewComponentFactory';
import { TYPE_WORKLOAD } from '../../const';
import { TYPE_OPERATOR_BACKED_SERVICE } from '../../operators/components/const';
import OperatorGroupListViewNode from '../../operators/listView/OperatorGroupListViewNode';
import TopologyListViewNode from './TopologyListViewNode';

export const listViewNodeComponentFactory = (
  type,
):
  | React.ComponentType<{
      item: Node;
      selectedIds: string[];
      onSelect: (ids: string[]) => void;
    }>
  | undefined => {
  // TODO: Move to plugins
  const knativeComponent = knativeListViewNodeComponentFactory(type);
  if (knativeComponent) {
    return knativeComponent;
  }
  const kubevirtComponent = kubevirtListViewNodeComponentFactory(type);
  if (kubevirtComponent) {
    return kubevirtComponent;
  }

  switch (type) {
    case TYPE_WORKLOAD:
      return TopologyListViewNode;
    case TYPE_OPERATOR_BACKED_SERVICE:
      return OperatorGroupListViewNode;
    case TYPE_HELM_RELEASE:
      return HelmReleaseListViewNode;
    default:
      return TopologyListViewNode;
  }
};
