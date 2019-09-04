import * as React from 'react';
import { TopologyView } from '@patternfly/react-topology';
import { nodeProvider, edgeProvider, groupProvider } from './shape-providers';
import Graph from './Graph';
import { GraphApi, TopologyDataModel, TopologyDataObject } from './topology-types';
import {
  createTopologyResourceConnection,
  updateTopologyResourceApplication,
} from './topology-utils';
import TopologyControlBar from './TopologyControlBar';
import TopologySideBar from './TopologySideBar';

type State = {
  selected?: string;
  graphApi?: GraphApi;
};

export interface TopologyProps {
  data: TopologyDataModel;
}

export default class Topology extends React.Component<TopologyProps, State> {
  constructor(props) {
    super(props);
    this.state = {};
  }

  static getDerivedStateFromProps(nextProps: TopologyProps, prevState: State): State {
    const { selected } = prevState;
    if (selected && !nextProps.data.topology[selected]) {
      return { selected: null };
    }
    return prevState;
  }

  onSelect = (nodeId: string) => {
    this.setState(({ selected }) => {
      return { selected: !nodeId || selected === nodeId ? null : nodeId };
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
    } = this.props;
    const sourceItem: TopologyDataObject = topology[sourceNodeId];
    const targetItem: TopologyDataObject = topology[targetNodeId];
    const replaceTargetItem: TopologyDataObject =
      replaceTargetNodeId && topology[replaceTargetNodeId];

    return createTopologyResourceConnection(sourceItem, targetItem, replaceTargetItem);
  };

  onSidebarClose = () => {
    this.setState({ selected: null });
  };

  graphApiRef = (api: GraphApi) => {
    this.setState({ graphApi: api });
  };

  render() {
    const {
      data: { graph, topology },
    } = this.props;
    const { selected, graphApi } = this.state;

    const topologySideBar = (
      <TopologySideBar
        item={selected ? topology[selected] : null}
        show={!!selected}
        onClose={this.onSidebarClose}
      />
    );

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
          selected={selected}
          onSelect={this.onSelect}
          onUpdateNodeGroup={this.onUpdateNodeGroup}
          onCreateConnection={this.onCreateConnection}
          graphApiRef={this.graphApiRef}
        />
      </TopologyView>
    );
  }
}
