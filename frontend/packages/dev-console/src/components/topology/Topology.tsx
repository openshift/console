import * as React from 'react';
import * as _ from 'lodash';
import { TopologyView } from '@patternfly/react-topology';
import { confirmModal, errorModal } from '@console/internal/components/modals';
import { edgeProvider, groupProvider, nodeProvider } from './shape-providers';
import Graph from './Graph';
import {
  GraphApi,
  GraphElementType,
  TopologyDataModel,
  TopologyDataObject,
} from './topology-types';
import {
  createTopologyResourceConnection,
  removeTopologyResourceConnection,
  updateTopologyResourceApplication,
} from './topology-utils';
import TopologyControlBar from './TopologyControlBar';
import TopologySideBar from './TopologySideBar';
import { ActionProviders } from './actions-providers';
import TopologyApplicationPanel from './TopologyApplicationPanel';
import TopologyResourcePanel from './TopologyResourcePanel';

type State = {
  selected?: string;
  selectedType?: GraphElementType;
  graphApi?: GraphApi;
};

export interface TopologyProps {
  data: TopologyDataModel;
  serviceBinding: boolean;
}

const getSelectedItem = (
  topologyData: TopologyDataModel,
  selectedType: GraphElementType,
  selectedId: string,
) => {
  let selectedItem;

  switch (selectedType) {
    case GraphElementType.node:
      selectedItem = topologyData.topology[selectedId];
      break;
    case GraphElementType.group:
      selectedItem = _.find(topologyData.graph.groups, { id: selectedId });
      break;
    default:
      selectedItem = null;
  }

  return selectedItem;
};

export default class Topology extends React.Component<TopologyProps, State> {
  constructor(props) {
    super(props);
    this.state = {};
  }

  static getDerivedStateFromProps(nextProps: TopologyProps, prevState: State): State {
    const { selected, selectedType } = prevState;

    if (selected && selectedType) {
      const selectedItem = getSelectedItem(nextProps.data, selectedType, selected);
      if (!selectedItem) {
        return { selected: null, selectedType: null };
      }
    }

    return prevState;
  }

  onSelect = (type: GraphElementType, id: string) => {
    this.setState(({ selected, selectedType }) => {
      if (!id || !type || (selected === id && selectedType === type)) {
        return { selected: null, type: null };
      }
      return { selected: id, selectedType: type };
    });
  };

  onUpdateNodeGroup = (nodeId: string, targetGroup: string): Promise<any> => {
    const {
      data: { topology },
    } = this.props;
    const item: TopologyDataObject = topology[nodeId];

    return updateTopologyResourceApplication(item, targetGroup);
  };

  onCreateConnection = (
    sourceNodeId: string,
    targetNodeId: string,
    replaceTargetNodeId: string = null,
  ): Promise<any> => {
    const {
      data: { topology },
      serviceBinding,
    } = this.props;
    const sourceItem: TopologyDataObject = topology[sourceNodeId];
    const targetItem: TopologyDataObject = topology[targetNodeId];
    const replaceTargetItem: TopologyDataObject =
      replaceTargetNodeId && topology[replaceTargetNodeId];

    return createTopologyResourceConnection(
      sourceItem,
      targetItem,
      replaceTargetItem,
      serviceBinding,
    );
  };

  onRemoveConnection = (sourceNodeId: string, targetNodeId: string, edgeType: string): void => {
    const {
      data: {
        topology,
        graph: { edges },
      },
    } = this.props;
    const sourceItem: TopologyDataObject = topology[sourceNodeId];
    const targetItem: TopologyDataObject = topology[targetNodeId];
    const sbr = _.get(
      _.find(edges, (edge) => {
        return edge.id === `${sourceNodeId}_${targetNodeId}`;
      }),
      'data.sbr',
    );

    const message = (
      <>
        Are you sure you want to remove the connection from <strong>{sourceItem.name}</strong> to{' '}
        <strong>{targetItem.name}</strong>?
      </>
    );

    confirmModal({
      title: 'Delete Connection',
      message,
      btnText: 'Remove',
      executeFn: () => {
        return removeTopologyResourceConnection(sourceItem, targetItem, sbr, edgeType).catch(
          (err) => {
            const error = err.message;
            errorModal({ error });
          },
        );
      },
    });
  };

  onSidebarClose = () => {
    this.setState({ selected: null });
  };

  graphApiRef = (api: GraphApi) => {
    this.setState({ graphApi: api });
  };

  renderSelectedItemDetails() {
    const { data } = this.props;
    const { selected, selectedType } = this.state;
    const selectedItem = getSelectedItem(data, selectedType, selected);

    if (!selectedItem) {
      return null;
    }

    switch (selectedType) {
      case GraphElementType.node:
        return <TopologyResourcePanel item={selectedItem as TopologyDataObject} />;
      case GraphElementType.group:
        return (
          <TopologyApplicationPanel
            application={{
              id: selectedItem.id,
              name: selectedItem.name,
              resources: _.map(selectedItem.nodes, (nodeId: string) => data.topology[nodeId]),
            }}
          />
        );
      default:
        return null;
    }
  }

  render() {
    const {
      data: { graph, topology },
    } = this.props;
    const { selected, selectedType, graphApi } = this.state;

    const topologySideBar = (
      <TopologySideBar show={!!selected} onClose={this.onSidebarClose}>
        {this.renderSelectedItemDetails()}
      </TopologySideBar>
    );

    const actionProvider = new ActionProviders(topology);

    return (
      <TopologyView
        controlBar={<TopologyControlBar graphApi={graphApi} />}
        sideBar={topologySideBar}
        sideBarOpen={!!selected}
      >
        <Graph
          graph={graph}
          topology={topology}
          nodeProvider={nodeProvider}
          edgeProvider={edgeProvider}
          groupProvider={groupProvider}
          actionProvider={actionProvider.getActions}
          selected={selected}
          selectedType={selectedType}
          onSelect={this.onSelect}
          onUpdateNodeGroup={this.onUpdateNodeGroup}
          onCreateConnection={this.onCreateConnection}
          onRemoveConnection={this.onRemoveConnection}
          graphApiRef={this.graphApiRef}
        />
      </TopologyView>
    );
  }
}
