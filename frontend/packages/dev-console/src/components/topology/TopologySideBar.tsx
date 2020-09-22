import * as React from 'react';
import {
  GraphElement,
  BaseEdge,
  isEdge,
  isNode,
  observer,
  TopologySideBar as PFTopologySideBar,
  Visualization,
} from '@patternfly/react-topology';
import { CloseButton } from '@console/internal/components/utils';
import { TYPE_VIRTUAL_MACHINE } from '@console/kubevirt-plugin/src/topology/components/const';
import TopologyVmPanel from '@console/kubevirt-plugin/src/topology/TopologyVmPanel';
import {
  TYPE_EVENT_PUB_SUB_LINK,
  TYPE_EVENT_SOURCE_LINK,
  TYPE_REVISION_TRAFFIC,
} from '@console/knative-plugin/src/topology/const';
import KnativeResourceOverviewPage from '@console/knative-plugin/src/components/overview/KnativeResourceOverviewPage';
import KnativeTopologyEdgePanel from '@console/knative-plugin/src/components/overview/KnativeTopologyEdgePanel';
import { TopologyDataObject } from './topology-types';
import { TYPE_APPLICATION_GROUP, TYPE_SERVICE_BINDING } from './components';
import { OdcBaseEdge } from './elements';
import ConnectedTopologyEdgePanel from './TopologyEdgePanel';
import TopologyApplicationPanel from './application-panel/TopologyApplicationPanel';
import { TYPE_HELM_RELEASE, TYPE_HELM_WORKLOAD } from './helm/components/const';
import TopologyHelmReleasePanel from './helm/TopologyHelmReleasePanel';
import TopologyHelmWorkloadPanel from './helm/TopologyHelmWorkloadPanel';
import { TYPE_OPERATOR_BACKED_SERVICE } from './operators/components/const';
import { OperatorGroupData } from './operators/operator-topology-types';
import TopologyServiceBindingRequestPanel from './operators/TopologyServiceBindingRequestPanel';
import TopologyOperatorBackedPanel from './operators/TopologyOperatorBackedPanel';
import TopologyResourcePanel from './TopologyResourcePanel';

export type TopologySideBarProps = {
  show: boolean;
  onClose: () => void;
};

export const TopologySideBar: React.FC<TopologySideBarProps> = ({ children, show, onClose }) => (
  <PFTopologySideBar show={show}>
    <div className="co-sidebar-dismiss clearfix">
      <CloseButton onClick={onClose} data-test-id="sidebar-close-button" />
    </div>
    {children}
  </PFTopologySideBar>
);

export type SelectedItemDetailsProps = {
  selectedEntity: GraphElement;
  visualization: Visualization;
};

export const SelectedItemDetails: React.FC<SelectedItemDetailsProps> = observer(
  ({ selectedEntity, visualization }) => {
    if (isNode(selectedEntity)) {
      if (selectedEntity.getType() === TYPE_APPLICATION_GROUP) {
        return (
          <TopologyApplicationPanel
            graphData={visualization.getGraph().getData()}
            application={{
              id: selectedEntity.getId(),
              name: selectedEntity.getLabel(),
              resources: selectedEntity.getData().groupResources,
            }}
          />
        );
      }
      // TODO: Use Plugins
      if (selectedEntity.getType() === TYPE_HELM_RELEASE) {
        return <TopologyHelmReleasePanel helmRelease={selectedEntity} />;
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
      if ([TYPE_REVISION_TRAFFIC, TYPE_EVENT_SOURCE_LINK].includes(selectedEntity.getType())) {
        return <KnativeTopologyEdgePanel edge={selectedEntity as BaseEdge} />;
      }
      if (selectedEntity.getType() === TYPE_SERVICE_BINDING) {
        return <TopologyServiceBindingRequestPanel edge={selectedEntity as OdcBaseEdge} />;
      }
      return <ConnectedTopologyEdgePanel edge={selectedEntity as BaseEdge} />;
    }
    return null;
  },
);

export const getTopologySideBar = (
  visualization: Visualization,
  selectedEntity: GraphElement,
  onClose: () => void,
): { sidebar: React.ReactElement; shown: boolean } => {
  const selectedItemDetails = () => {
    if (isNode(selectedEntity)) {
      if (selectedEntity.getType() === TYPE_APPLICATION_GROUP) {
        return (
          <TopologyApplicationPanel
            graphData={visualization.getGraph().getData()}
            application={{
              id: selectedEntity.getId(),
              name: selectedEntity.getLabel(),
              resources: selectedEntity.getData().groupResources,
            }}
          />
        );
      }
      // TODO: Use Plugins
      if (selectedEntity.getType() === TYPE_HELM_RELEASE) {
        return <TopologyHelmReleasePanel helmRelease={selectedEntity} />;
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
      if ([TYPE_REVISION_TRAFFIC, TYPE_EVENT_SOURCE_LINK].includes(selectedEntity.getType())) {
        return <KnativeTopologyEdgePanel edge={selectedEntity as BaseEdge} />;
      }
      if (selectedEntity.getType() === TYPE_SERVICE_BINDING) {
        return <TopologyServiceBindingRequestPanel edge={selectedEntity as OdcBaseEdge} />;
      }
      return <ConnectedTopologyEdgePanel edge={selectedEntity as BaseEdge} />;
    }
    return null;
  };

  const details = selectedEntity ? selectedItemDetails() : null;
  return {
    sidebar: (
      <TopologySideBar show={!!details} onClose={onClose}>
        {selectedEntity ? (
          <SelectedItemDetails selectedEntity={selectedEntity} visualization={visualization} />
        ) : null}
      </TopologySideBar>
    ),
    shown: !!details,
  };
};
