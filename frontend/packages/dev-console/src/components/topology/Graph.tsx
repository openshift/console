import * as React from 'react';
import ReactMeasure from 'react-measure';
import * as _ from 'lodash';
import Renderer from './D3ForceDirectedRenderer';
import {
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
}

export interface GraphProps {
  nodeProvider: NodeProvider;
  edgeProvider: EdgeProvider;
  groupProvider: GroupProvider;
  graph: GraphModel;
  topology: TopologyDataMap;
  selected?: string;
  onSelect?(string): void;
  graphApiRef?(GraphApi): void;
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
    const { graphApiRef } = this.props;
    graphApiRef && graphApiRef(r ? r.api() : null);
  };

  renderMeasure = ({ measureRef }) => {
    const {
      graph,
      nodeProvider,
      edgeProvider,
      groupProvider,
      onSelect,
      selected,
      topology,
    } = this.props;
    const { dimensions } = this.state;
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
