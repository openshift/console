import * as React from 'react';
import { DrawerPanelContent } from '@patternfly/react-core';
import {
  GraphElement,
  BaseEdge,
  isEdge,
  isNode,
  observer,
  TopologySideBar as PFTopologySideBar,
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
import TopologyHelmReleasePanel from '@console/helm-plugin/src/topology/TopologyHelmReleasePanel';
import {
  TYPE_HELM_RELEASE,
  TYPE_HELM_WORKLOAD,
} from '@console/helm-plugin/src/topology/components/const';
import { TopologyDataObject } from '../../topology-types';
import {
  TOPOLOGY_SIDE_PANEL_SIZE_LOCAL_STORAGE_KEY,
  TOPOLOGY_SIDE_PANEL_SIZE_STORAGE_KEY,
  TYPE_APPLICATION_GROUP,
  TYPE_SERVICE_BINDING,
} from '../../const';
import { OdcBaseEdge } from '../../elements';
import ConnectedTopologyEdgePanel from './TopologyEdgePanel';
import TopologyApplicationPanel from '../application-panel/TopologyApplicationPanel';
import { TYPE_OPERATOR_BACKED_SERVICE } from '../../operators/components/const';
import { OperatorGroupData } from '../../operators/operator-topology-types';
import TopologyServiceBindingRequestPanel from '../../operators/TopologyServiceBindingRequestPanel';
import TopologyOperatorBackedPanel from '../../operators/TopologyOperatorBackedPanel';
import TopologyResourcePanel from './TopologyResourcePanel';
import TopologyHelmWorkloadPanel from '@console/helm-plugin/src/topology/TopologyHelmWorkloadPanel';
import { useUserSettingsCompatibility } from '@console/shared/src';

const DEFAULT_SIDE_PANEL_SIZE = 550;

export type TopologySideBarProps = {
  onClose: () => void;
  selectedEntity: GraphElement;
};

export type SelectedItemDetailsProps = {
  selectedEntity: GraphElement;
};

export const SelectedItemDetails: React.FC<SelectedItemDetailsProps> = observer(
  ({ selectedEntity }) => {
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

const TopologySideBar: React.FC<TopologySideBarProps> = ({ selectedEntity, onClose }) => {
  const [
    topologySidePanelSize,
    setTopologySidePanelSize,
    isTopologySidePanelSizeLoaded,
  ] = useUserSettingsCompatibility<number>(
    TOPOLOGY_SIDE_PANEL_SIZE_STORAGE_KEY,
    TOPOLOGY_SIDE_PANEL_SIZE_LOCAL_STORAGE_KEY,
    DEFAULT_SIDE_PANEL_SIZE,
  );
  const handlePanelResize = React.useCallback(
    (width: number) => {
      setTopologySidePanelSize(width);
    },
    [setTopologySidePanelSize],
  );

  return (
    <DrawerPanelContent
      isResizable
      defaultSize={`${
        isTopologySidePanelSizeLoaded ? topologySidePanelSize : DEFAULT_SIDE_PANEL_SIZE
      }px`}
      minSize="400px"
      onResize={handlePanelResize}
    >
      <PFTopologySideBar>
        <div className="co-sidebar-dismiss clearfix">
          <CloseButton onClick={onClose} data-test-id="sidebar-close-button" />
        </div>
        <SelectedItemDetails selectedEntity={selectedEntity} />
      </PFTopologySideBar>
    </DrawerPanelContent>
  );
};

export default TopologySideBar;
