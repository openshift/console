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
  ActionProvider,
  ContextMenuProvider,
  GraphElementType,
} from './topology-types';
import './Graph.scss';
import { GraphContextMenu } from './GraphContextMenu';

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
  actionProvider: ActionProvider;
  graph: GraphModel;
  topology: TopologyDataMap;
  selected?: string;
  selectedType?: string;
  onSelect?(type: GraphElementType, id: string): void;
  onUpdateNodeGroup?(nodeId: string, targetGroup: string): Promise<any>;
  onCreateConnection?(
    sourceNodeId: string,
    targetNodeId: string,
    replaceTargetNodeId?: string,
  ): Promise<any>;
  onRemoveConnection(sourceNodeId: string, targetNodeId: string, edgeType: string): void;
  graphApiRef?(GraphApi): void;
}

export default class Graph extends React.Component<GraphProps, State> {
  private contextMenuRef: ContextMenuProvider;

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

  setContextMenuRef = (r) => {
    this.contextMenuRef = r;
  };

  renderMeasure = ({ measureRef }) => {
    const {
      graph,
      nodeProvider,
      edgeProvider,
      groupProvider,
      actionProvider,
      onSelect,
      onUpdateNodeGroup,
      onCreateConnection,
      onRemoveConnection,
      selected,
      selectedType,
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
            onUpdateNodeGroup={onUpdateNodeGroup}
            onCreateConnection={onCreateConnection}
            onRemoveConnection={onRemoveConnection}
            selected={selected}
            contextMenu={this.contextMenuRef}
            selectedType={selectedType}
          />
        )}
        <GraphContextMenu ref={this.setContextMenuRef} actionProvider={actionProvider} />
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
