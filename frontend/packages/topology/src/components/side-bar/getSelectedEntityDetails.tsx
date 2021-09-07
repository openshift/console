import * as React from 'react';
import { GraphElement, BaseEdge, isEdge, isNode } from '@patternfly/react-topology';
import {
  TYPE_HELM_RELEASE,
  TYPE_HELM_WORKLOAD,
} from '@console/helm-plugin/src/topology/components/const';
import KnativeTopologyEdgePanel from '@console/knative-plugin/src/components/overview/KnativeTopologyEdgePanel';
import {
  TYPE_EVENT_PUB_SUB_LINK,
  TYPE_EVENT_SOURCE_LINK,
  TYPE_REVISION_TRAFFIC,
  TYPE_KAFKA_CONNECTION_LINK,
  TYPE_EVENT_PUB_SUB,
} from '@console/knative-plugin/src/topology/const';
import { TYPE_VIRTUAL_MACHINE } from '@console/kubevirt-plugin/src/topology/components/const';
import { TYPE_MANAGED_KAFKA_CONNECTION } from '@console/rhoas-plugin/src/topology/components/const';
import { TYPE_APPLICATION_GROUP, TYPE_SERVICE_BINDING } from '../../const';
import { TYPE_OPERATOR_BACKED_SERVICE } from '../../operators/components/const';
import { OperatorGroupData } from '../../operators/operator-topology-types';
import TopologyOperatorBackedPanel from '../../operators/TopologyOperatorBackedPanel';
import { TopologyDataObject } from '../../topology-types';
import ConnectedTopologyEdgePanel from './TopologyEdgePanel';
import TopologyResourcePanel from './TopologyResourcePanel';
import TopologySideBarContent from './TopologySideBarContent';

export const getSelectedEntityDetails = (selectedEntity: GraphElement) => {
  if (!selectedEntity) {
    return null;
  }

  if (isNode(selectedEntity)) {
    if (selectedEntity.getType() === TYPE_APPLICATION_GROUP) {
      return <TopologySideBarContent element={selectedEntity} />;
    }
    if (selectedEntity.getType() === TYPE_HELM_RELEASE) {
      return <TopologySideBarContent element={selectedEntity} />;
    }
    if (selectedEntity.getType() === TYPE_MANAGED_KAFKA_CONNECTION) {
      return <TopologySideBarContent element={selectedEntity} />;
    }
    if (selectedEntity.getType() === TYPE_HELM_WORKLOAD) {
      return <TopologySideBarContent element={selectedEntity} />;
    }
    if (selectedEntity.getType() === TYPE_OPERATOR_BACKED_SERVICE) {
      return (
        <TopologyOperatorBackedPanel
          item={selectedEntity.getData() as TopologyDataObject<OperatorGroupData>}
        />
      );
    }
    if (selectedEntity.getType() === TYPE_VIRTUAL_MACHINE) {
      return <TopologySideBarContent element={selectedEntity} />;
    }

    if (selectedEntity.getType() === TYPE_EVENT_PUB_SUB) {
      return <TopologySideBarContent element={selectedEntity} />;
    }
    return <TopologyResourcePanel element={selectedEntity} />;
  }

  if (isEdge(selectedEntity)) {
    if (selectedEntity.getType() === TYPE_EVENT_PUB_SUB_LINK) {
      return <TopologySideBarContent element={selectedEntity} />;
    }
    if (
      [TYPE_REVISION_TRAFFIC, TYPE_EVENT_SOURCE_LINK, TYPE_KAFKA_CONNECTION_LINK].includes(
        selectedEntity.getType(),
      )
    ) {
      return <KnativeTopologyEdgePanel edge={selectedEntity as BaseEdge} />;
    }
    if (selectedEntity.getType() === TYPE_SERVICE_BINDING) {
      return <TopologySideBarContent element={selectedEntity} />;
    }
    return <ConnectedTopologyEdgePanel edge={selectedEntity as BaseEdge} />;
  }
  return null;
};
