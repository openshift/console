import * as React from 'react';
import { GraphElement, BaseEdge, isEdge, isNode } from '@patternfly/react-topology';
import {
  TYPE_HELM_RELEASE,
  TYPE_HELM_WORKLOAD,
} from '@console/helm-plugin/src/topology/components/const';
import {
  TYPE_EVENT_PUB_SUB_LINK,
  TYPE_EVENT_SOURCE_LINK,
  TYPE_REVISION_TRAFFIC,
  TYPE_KAFKA_CONNECTION_LINK,
  TYPE_EVENT_PUB_SUB,
} from '@console/knative-plugin/src/topology/const';
import { TYPE_VIRTUAL_MACHINE } from '@console/kubevirt-plugin/src/topology/components/const';
import { TYPE_MANAGED_KAFKA_CONNECTION } from '@console/rhoas-plugin/src/topology/components/const';
import { TYPE_APPLICATION_GROUP, TYPE_CONNECTS_TO, TYPE_SERVICE_BINDING } from '../../const';
import { TYPE_OPERATOR_BACKED_SERVICE } from '../../operators/components/const';
import ConnectedTopologyEdgePanel from './TopologyEdgePanel';
import TopologyResourcePanel from './TopologyResourcePanel';
import TopologySideBarContent from './TopologySideBarContent';

export const isSidebarRenderable = (selectedEntity: GraphElement): boolean => {
  if (isNode(selectedEntity) || isEdge(selectedEntity)) {
    return true;
  }
  return false;
};

export const SelectedEntityDetails: React.FC<{ selectedEntity: GraphElement }> = ({
  selectedEntity,
}) => {
  if (!selectedEntity) {
    return null;
  }

  if (isNode(selectedEntity)) {
    if (
      [
        TYPE_HELM_RELEASE,
        TYPE_MANAGED_KAFKA_CONNECTION,
        TYPE_HELM_WORKLOAD,
        TYPE_EVENT_PUB_SUB,
        TYPE_APPLICATION_GROUP,
        TYPE_OPERATOR_BACKED_SERVICE,
        TYPE_VIRTUAL_MACHINE,
      ].includes(selectedEntity.getType())
    ) {
      return <TopologySideBarContent element={selectedEntity} />;
    }

    return <TopologyResourcePanel element={selectedEntity} />;
  }

  if (isEdge(selectedEntity)) {
    if (
      [
        TYPE_REVISION_TRAFFIC,
        TYPE_EVENT_SOURCE_LINK,
        TYPE_KAFKA_CONNECTION_LINK,
        TYPE_SERVICE_BINDING,
        TYPE_EVENT_PUB_SUB_LINK,
        TYPE_CONNECTS_TO,
      ].includes(selectedEntity.getType())
    ) {
      return <TopologySideBarContent element={selectedEntity} />;
    }

    return <ConnectedTopologyEdgePanel edge={selectedEntity as BaseEdge} />;
  }
  return null;
};
