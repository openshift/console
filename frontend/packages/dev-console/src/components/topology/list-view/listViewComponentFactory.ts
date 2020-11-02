/* eslint-disable import/no-cycle */
import * as React from 'react';
import { Node } from '@patternfly/react-topology';
import { knativeListViewNodeComponentFactory } from '@console/knative-plugin/src/topology/listView/knativeListViewComponentFactory';
import { kubevirtListViewNodeComponentFactory } from '@console/kubevirt-plugin/src/topology/listView/kubevirtListViewComponentFactory';
import { TYPE_WORKLOAD } from '../components/const';
import { TopologyListViewNode } from './TopologyListViewNode';
import { TYPE_OPERATOR_BACKED_SERVICE } from '../operators/components/const';
import { OperatorGroupListViewNode } from '../operators/listView/OperatorGroupListViewNode';
import { TYPE_HELM_RELEASE } from '../helm/components/const';
import { HelmReleaseListViewNode } from '../helm/listView/HelmReleaseListViewNode';

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
