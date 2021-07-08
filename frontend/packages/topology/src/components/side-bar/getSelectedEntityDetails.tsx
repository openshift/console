import * as React from 'react';
import { GraphElement, BaseEdge, isEdge, isNode } from '@patternfly/react-topology';
import {
  TYPE_HELM_RELEASE,
  TYPE_HELM_WORKLOAD,
} from '@console/helm-plugin/src/topology/components/const';
import TopologyHelmWorkloadPanel from '@console/helm-plugin/src/topology/TopologyHelmWorkloadPanel';
import KnativeResourceOverviewPage from '@console/knative-plugin/src/components/overview/KnativeResourceOverviewPage';
import KnativeTopologyEdgePanel from '@console/knative-plugin/src/components/overview/KnativeTopologyEdgePanel';
import {
  TYPE_EVENT_PUB_SUB_LINK,
  TYPE_EVENT_SOURCE_LINK,
  TYPE_REVISION_TRAFFIC,
  TYPE_KAFKA_CONNECTION_LINK,
} from '@console/knative-plugin/src/topology/const';
import { TYPE_VIRTUAL_MACHINE } from '@console/kubevirt-plugin/src/topology/components/const';
import TopologyVmPanel from '@console/kubevirt-plugin/src/topology/TopologyVmPanel';
// import TopologyHelmReleasePanel from '@console/helm-plugin/src/topology/TopologyHelmReleasePanel';
import { TYPE_MANAGED_KAFKA_CONNECTION } from '@console/rhoas-plugin/src/topology/components/const';
import TopologyKafkaPanel from '@console/rhoas-plugin/src/topology/components/TopologyKafkaPanel';
import { TYPE_APPLICATION_GROUP, TYPE_SERVICE_BINDING } from '../../const';
import { OdcBaseEdge } from '../../elements';
import { TYPE_OPERATOR_BACKED_SERVICE } from '../../operators/components/const';
import { OperatorGroupData } from '../../operators/operator-topology-types';
import TopologyOperatorBackedPanel from '../../operators/TopologyOperatorBackedPanel';
import TopologyServiceBindingRequestPanel from '../../operators/TopologyServiceBindingRequestPanel';
import { TopologyDataObject } from '../../topology-types';
import TopologyApplicationPanel from '../application-panel/TopologyApplicationPanel';
import ConnectedTopologyEdgePanel from './TopologyEdgePanel';
import TopologyResourcePanel from './TopologyResourcePanel';
import TopologySideBarContent from './TopologySideBarContent';

export const getSelectedEntityDetails = (selectedEntity: GraphElement) => {
  if (!selectedEntity) {
    return null;
  }

  if (isNode(selectedEntity)) {
    if (selectedEntity.getType() === TYPE_APPLICATION_GROUP) {
      return (
        <TopologyApplicationPanel
          graphData={selectedEntity.getGraph().getData()}
          application={{
            id: selectedEntity.getId(),
            name: selectedEntity.getLabel(),
            resources: selectedEntity.getData().groupResources,
          }}
        />
      );
    }
    if (selectedEntity.getType() === TYPE_HELM_RELEASE) {
      return <TopologySideBarContent element={selectedEntity} />;
    }
    if (selectedEntity.getType() === TYPE_MANAGED_KAFKA_CONNECTION) {
      return <TopologyKafkaPanel item={selectedEntity} />;
    }
    if (selectedEntity.getType() === TYPE_HELM_WORKLOAD) {
      return <TopologyHelmWorkloadPanel item={selectedEntity.getData() as TopologyDataObject} />;
    }
    if (selectedEntity.getType() === TYPE_OPERATOR_BACKED_SERVICE) {
      return (
        <TopologyOperatorBackedPanel
          item={selectedEntity.getData() as TopologyDataObject<OperatorGroupData>}
        />
      );
    }
    if (selectedEntity.getType() === TYPE_VIRTUAL_MACHINE) {
      return <TopologyVmPanel vmNode={selectedEntity} />;
    }
    return <TopologyResourcePanel item={selectedEntity.getData() as TopologyDataObject} />;
  }

  if (isEdge(selectedEntity)) {
    if (selectedEntity.getType() === TYPE_EVENT_PUB_SUB_LINK) {
      const itemResources = selectedEntity.getData();
      return <KnativeResourceOverviewPage item={itemResources.resources} />;
    }
    if (
      [TYPE_REVISION_TRAFFIC, TYPE_EVENT_SOURCE_LINK, TYPE_KAFKA_CONNECTION_LINK].includes(
        selectedEntity.getType(),
      )
    ) {
      return <KnativeTopologyEdgePanel edge={selectedEntity as BaseEdge} />;
    }
    if (selectedEntity.getType() === TYPE_SERVICE_BINDING) {
      return <TopologyServiceBindingRequestPanel edge={selectedEntity as OdcBaseEdge} />;
    }
    return <ConnectedTopologyEdgePanel edge={selectedEntity as BaseEdge} />;
  }
  return null;
};
