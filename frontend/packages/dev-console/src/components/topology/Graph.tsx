import * as React from 'react';
import ReactMeasure from 'react-measure';
import * as _ from 'lodash';
import Renderer from './D3ForceDirectedRenderer';
import {
  GraphApi,
  EdgeProvider,
  NodeProvider,
  GraphModel,
  TopologyDataMap,
  GroupProvider,
} from './topology-types';
import './Graph.scss';

interface State {
  dimensions?: {
    width: number;
    height: number;
  };
  graphApi?: GraphApi;
}

export interface GraphProps {
  nodeProvider: NodeProvider;
  edgeProvider: EdgeProvider;
  groupProvider: GroupProvider;
  graph: GraphModel;
  topology: TopologyDataMap;
  children?(GraphApi): React.ReactNode;
  selected?: string;
  onSelect?(string): void;
}

export default class Graph extends React.Component<GraphProps, State> {
  constructor(props) {
    super(props);
    this.state = {};
  }

  componentWillUnmount() {
    this.onMeasure.cancel();
  }

  onMeasure = _.debounce((contentRect) => {
    this.setState({
      dimensions: {
        width: contentRect.client.width,
        height: contentRect.client.height,
      },
    });
  }, 100);

  captureApiRef = (r) => {
    this.setState({ graphApi: r ? r.api() : null });
  };

  renderMeasure = ({ measureRef }) => {
    const {
      children,
      graph,
      nodeProvider,
      edgeProvider,
      groupProvider,
      onSelect,
      selected,
      topology,
    } = this.props;
    const { dimensions, graphApi } = this.state;
    return (
      <div ref={measureRef} className="odc-graph">
        {dimensions && (
          <Renderer
            nodeSize={104}
            height={dimensions.height}
            width={dimensions.width}
            graph={graph}
            topology={topology}
            nodeProvider={nodeProvider}
            edgeProvider={edgeProvider}
            groupProvider={groupProvider}
            ref={this.captureApiRef}
            onSelect={onSelect}
            selected={selected}
          />
        )}
        {children && graphApi && children(graphApi)}
      </div>
    );
  };

  render() {
    return (
      <ReactMeasure client onResize={this.onMeasure}>
        {this.renderMeasure}
      </ReactMeasure>
    );
  }
}
