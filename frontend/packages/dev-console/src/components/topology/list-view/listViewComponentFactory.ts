/* eslint-disable import/no-cycle */
import * as React from 'react';
import { Node } from '@patternfly/react-topology';
import { TYPE_KNATIVE_SERVICE, TYPE_SINK_URI } from '@console/knative-plugin/src/topology/const';
import { KnativeServiceListViewNode } from '@console/knative-plugin/src/topology/listView/KnativeServiceListViewNode';
import { SinkUriListViewNode } from '@console/knative-plugin/src/topology/listView/SinkUriListViewNode';
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
  switch (type) {
    case TYPE_WORKLOAD:
      return TopologyListViewNode;
    case TYPE_OPERATOR_BACKED_SERVICE:
      return OperatorGroupListViewNode;
    case TYPE_HELM_RELEASE:
      return HelmReleaseListViewNode;
    case TYPE_KNATIVE_SERVICE:
      return KnativeServiceListViewNode;
    case TYPE_SINK_URI:
      return SinkUriListViewNode;
    default:
      return TopologyListViewNode;
  }
};
