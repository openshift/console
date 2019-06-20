import * as React from 'react';
import {
  ExpandIcon,
  ExpandArrowsAltIcon,
  SearchPlusIcon,
  SearchMinusIcon,
} from '@patternfly/react-icons';
import { nodeProvider, edgeProvider, groupProvider } from './shape-providers';
import Graph from './Graph';
import GraphToolbar from './GraphToolbar';
import { GraphApi, TopologyDataModel } from './topology-types';
import TopologySideBar from './TopologySideBar';
import GraphToolbarButton from './GraphToolbarButton';

type State = {
  selected?: string;
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

  renderToolbar = (graphApi: GraphApi) => (
    <GraphToolbar>
      <GraphToolbarButton label="Zoom In" onClick={graphApi.zoomIn}>
        <SearchPlusIcon />
      </GraphToolbarButton>
      <GraphToolbarButton label="Zoom Out" onClick={graphApi.zoomOut}>
        <SearchMinusIcon />
      </GraphToolbarButton>
      <GraphToolbarButton label="Fit to Screen" onClick={graphApi.zoomFit}>
        <ExpandArrowsAltIcon />
      </GraphToolbarButton>
      <GraphToolbarButton label="Reset Layout" onClick={graphApi.resetLayout}>
        <ExpandIcon />
      </GraphToolbarButton>
    </GraphToolbar>
  );

  render() {
    const {
      data: { graph, topology },
    } = this.props;
    const { selected } = this.state;
    return (
      <React.Fragment>
        <Graph
          graph={graph}
          topology={topology}
          nodeProvider={nodeProvider}
          edgeProvider={edgeProvider}
          groupProvider={groupProvider}
          selected={selected}
          onSelect={this.onSelect}
        >
          {this.renderToolbar}
        </Graph>
        <TopologySideBar
          item={selected ? topology[selected] : null}
          show={!!selected}
          onClose={this.onSidebarClose}
        />
      </React.Fragment>
    );
  }
}
