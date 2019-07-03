import * as React from 'react';
import { TopologyView } from '@patternfly/react-topology';

import { nodeProvider, edgeProvider, groupProvider } from './shape-providers';
import Graph from './Graph';
import { GraphApi, TopologyDataModel } from './topology-types';
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
          graphApiRef={this.graphApiRef}
        />
      </TopologyView>
    );
  }
}
