/* eslint-disable react/no-multi-comp */
import * as React from 'react';
import * as d3 from 'd3';
import * as ReactDOM from 'react-dom';
import * as _ from 'lodash';
import SvgDefsProvider from '../svg/SvgDefsProvider';
import {
  ViewNode,
  ViewEdge,
  NodeProvider,
  EdgeProvider,
  NodeProps,
  TopologyDataMap,
  TopologyDataObject,
  GraphModel,
  Edge,
  ViewGroup,
  GroupProvider,
  GroupProps,
} from './topology-types';

const ZOOM_EXTENT: [number, number] = [0.25, 4];

interface State {
  zoomTransform?: {
    x: number;
    y: number;
    k: number;
  };
  nodesById: {
    [id: string]: ViewNode;
  };
  nodes: string[];
  edgesById: {
    [id: string]: ViewEdge;
  };
  edges: string[];
  groupsById: {
    [id: string]: ViewGroup;
  };
  groups: string[];
  graph?: GraphModel;
}

export interface D3ForceDirectedRendererProps {
  width: number;
  height: number;
  graph: GraphModel;
  topology: TopologyDataMap;
  nodeProvider: NodeProvider;
  edgeProvider: EdgeProvider;
  groupProvider: GroupProvider;
  nodeSize: number;
  selected?: string;
  onSelect?(string): void;
}

function getEdgeId(d: Edge): string {
  return d.id || `${d.source}_${d.target}`;
}

export default class D3ForceDirectedRenderer extends React.Component<
  D3ForceDirectedRendererProps,
  State
> {
  private $svg: d3.Selection<SVGSVGElement, null, null, undefined>;

  private zoom: d3.ZoomBehavior<Element, {}>;

  private simulation: d3.Simulation<{}, undefined>;

  private zoomGroup = React.createRef<SVGGElement>();

  private dragCount: number = 0;

  constructor(props) {
    super(props);
    this.state = {
      nodesById: {},
      nodes: [],
      edgesById: {},
      edges: [],
      groupsById: {},
      groups: [],
    };

    this.simulation = d3
      .forceSimulation()
      .force('collide', d3.forceCollide().radius(props.nodeSize))
      .force('charge', d3.forceManyBody())
      .force('center', d3.forceCenter(props.width / 2, props.height / 2));
  }

  static getDerivedStateFromProps(
    nextProps: D3ForceDirectedRendererProps,
    prevState: State,
  ): State {
    if (nextProps.graph === prevState.graph) {
      // do not re-compute state if graph has not changed
      return prevState;
    }

    const { nodes, edges, groups, nodesById, edgesById, groupsById } = prevState;

    // Not the most efficient checks but ensures that if the nodes and edges are the same,
    // then we re-use the old state.
    // If nodes or edges change, re-create the state but re-use the old positions of the nodes.

    let newNodesById = nodesById;
    let newNodes = nextProps.graph.nodes.map((d) => d.id);
    if (_.isEqual(newNodes, nodes)) {
      newNodes = nodes;
    } else {
      newNodesById = nextProps.graph.nodes.reduce(
        (acc, d) => {
          acc[d.id] = {
            x: nextProps.width / 2,
            y: nextProps.height / 2,
            ...nodesById[d.id],
            id: d.id,
            type: d.type,
            size: nextProps.nodeSize,
            name: d.name,
          };
          return acc;
        },
        {} as any,
      );
    }

    let newEdgesById = edgesById;
    let newEdges = nextProps.graph.edges.map((d) => getEdgeId(d));
    if (newNodes === nodes && _.isEqual(newEdges, edges)) {
      newEdges = edges;
    } else {
      newEdgesById = nextProps.graph.edges.reduce(
        (acc, d) => {
          const id = getEdgeId(d);
          acc[id] = {
            ...edgesById[id],
            id,
            type: d.type,
            source: newNodesById[d.source],
            target: newNodesById[d.target],
          };
          return acc;
        },
        {} as any,
      );
    }

    let newGroupsById = groupsById;
    let newGroups = nextProps.graph.groups.map((d) => d.id);
    if (newNodes === nodes && _.isEqual(newGroups, groups)) {
      newGroups = groups;
    } else {
      newGroupsById = nextProps.graph.groups.reduce(
        (acc, d) => {
          acc[d.id] = {
            ...groupsById[d.id],
            id: d.id,
            type: d.type,
            nodes: d.nodes.map((nodeId) => newNodesById[nodeId]),
            name: d.name,
          };
          return acc;
        },
        {} as any,
      );
    }

    return {
      ...prevState,
      graph: nextProps.graph,
      nodesById: newNodesById,
      nodes: newNodes,
      edgesById: newEdgesById,
      edges: newEdges,
      groupsById: newGroupsById,
      groups: newGroups,
    };
  }

  componentDidMount() {
    this.zoom = d3
      .zoom()
      .scaleExtent(ZOOM_EXTENT)
      .on('zoom', this.onZoom);
    this.zoom(this.$svg);

    this.simulation
      .nodes(this.state.nodes.map((d) => this.state.nodesById[d]))
      .force(
        'link',
        d3
          .forceLink([
            ...this.state.edges.map((d) => this.state.edgesById[d]),
            ...this.createGroupLinks(),
          ])
          .id((d: ViewNode) => d.id),
      )
      .on('tick', () => this.forceUpdate())
      .restart();
  }

  componentDidUpdate(prevProps: D3ForceDirectedRendererProps, prevState: State) {
    let restart = false;
    if (prevProps.width !== this.props.width || prevProps.height !== this.props.height) {
      this.simulation.force('center', d3.forceCenter(this.props.width / 2, this.props.height / 2));
      restart = true;
    }
    if (
      prevState.nodes !== this.state.nodes ||
      prevState.edges !== this.state.edges ||
      prevState.groups !== this.state.groups
    ) {
      this.simulation
        .nodes(this.state.nodes.map((d) => this.state.nodesById[d]))
        .force(
          'link',
          d3
            .forceLink([
              ...this.state.edges.map((d) => this.state.edgesById[d]),
              ...this.createGroupLinks(),
            ])
            .id((d: ViewNode) => d.id),
        )
        .alpha(0.2);
      restart = true;
    }
    if (restart) {
      this.simulation.restart();
    }
  }

  componentWillUnmount() {
    this.simulation.stop();
  }

  private refSvg = (node: SVGSVGElement) => {
    this.$svg = d3.select(node);
  };

  private onZoom = () => {
    this.setState({ zoomTransform: d3.event.transform });
  };

  private onNodeEnter = ($node: NodeSelection) => {
    $node.call(
      d3
        .drag<SVGGElement, ViewNode>()
        .on('start', (d) => this.onNodeDragStart(d))
        .on('drag', (d) => this.onNodeDragged(d))
        .on('end', (d) => this.onNodeDragEnd(d))
        .filter(() => this.state.nodes.length > 1),
    );
  };

  private onNodeDragStart = (d: ViewNode) => {
    d3.event.sourceEvent.stopPropagation();
    if (this.dragCount) {
      this.dragCount++;
    }
    d.fx = d.x;
    d.fy = d.y;
  };

  private onNodeDragged = (d: ViewNode) => {
    if (!this.dragCount && (Math.abs(d.fx - d3.event.x) > 5 || Math.abs(d.fy - d3.event.y) > 5)) {
      this.dragCount++;
      this.simulation.alphaTarget(0.1).restart();
    }
    if (this.dragCount) {
      d.fx = d3.event.x;
      d.fy = d3.event.y;
    }
  };

  private onNodeDragEnd = (d: ViewNode) => {
    if (this.dragCount) {
      --this.dragCount;
      if (!this.dragCount && !d3.event.active) {
        this.simulation.alphaTarget(0);
      }
    }
    d.fx = null;
    d.fy = null;
  };

  private onGroupEnter = ($group: GroupSelection) => {
    $group.call(
      d3
        .drag<SVGGElement, ViewGroup>()
        .on('start', (d) => this.onGroupDragStart(d))
        .on('drag', (d) => this.onGroupDragged(d))
        .on('end', (d) => this.onGroupDragEnd(d))
        .filter(
          () =>
            this.state.groups.length > 1 ||
            this.state.groupsById[this.state.groups[0]].nodes.length !== this.state.nodes.length,
        ),
    );
  };

  private onGroupDragStart = (d: ViewGroup) => {
    if (!d3.event.active) {
      this.simulation.alphaTarget(0.1).restart();
    }
    d.nodes.forEach((gd) => {
      gd.fx = gd.x;
      gd.fy = gd.y;
    });
  };

  private onGroupDragged = (d: ViewGroup) => {
    d.nodes.forEach((gd) => {
      gd.fx += d3.event.dx;
      gd.fy += d3.event.dy;
    });
  };

  private onGroupDragEnd = (d: ViewGroup) => {
    if (!d3.event.active) {
      this.simulation.alphaTarget(0);
    }
    d.nodes.forEach((gd) => {
      gd.fx = null;
      gd.fy = null;
    });
  };

  private deselect = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (this.props.selected) {
      this.props.onSelect(null);
    }
  };

  public api() {
    // eslint-disable-next-line @typescript-eslint/no-this-alias
    const self = this;
    const api = {
      zoomIn() {
        self.zoom.scaleBy(self.$svg, 4 / 3);
      },
      zoomOut() {
        self.zoom.scaleBy(self.$svg, 0.75);
      },
      zoomFit() {
        const { width: fullWidth, height: fullHeight } = self.props;
        const bounds = self.zoomGroup.current.getBBox();
        const { width, height } = bounds;
        const midX = bounds.x + width / 2;
        const midY = bounds.y + height / 2;
        if (width === 0 || height === 0) {
          return;
        }

        // set the max scale to be the current zoom level or 1 if not defined
        const maxScale = self.state.zoomTransform ? Math.max(self.state.zoomTransform.k, 1) : 1;

        // set scale such that there is a 10% padding
        const scale = Math.min(0.9 / Math.max(width / fullWidth, height / fullHeight), maxScale);

        // translate to center
        const translate = [fullWidth / 2 - midX * scale, fullHeight / 2 - midY * scale];
        const t = d3.zoomIdentity.translate(translate[0], translate[1]).scale(scale);

        // update the min scaling value such that the user can zoom out to the new scale in case
        // it is smaller than the default zoom out scale
        self.zoom.scaleExtent([Math.min(scale, ZOOM_EXTENT[0]), ZOOM_EXTENT[1]]);

        self.zoom.transform(self.$svg, t);
      },
      zoomReset() {
        self.zoom.scaleExtent(ZOOM_EXTENT);
        self.zoom.transform(self.$svg, d3.zoomIdentity);
      },
      resetLayout() {
        const { width, height } = self.props;
        const midX = width / 2;
        const midY = height / 2;
        // reset node positions
        self.state.nodes.forEach((id) => {
          const node = self.state.nodesById[id];
          node.x = midX;
          node.y = midY;
        });
        // reset zoom
        api.zoomReset();
        // run layout
        self.simulation.alpha(1);
        self.simulation.restart();
      },
    };
    return api;
  }

  private createGroupLinks(): any[] {
    const { groups, groupsById } = this.state;
    const groupLinks = [];
    // link each node within a group together to form group clusters
    groups.forEach((g) => {
      const { nodes } = groupsById[g];
      for (let i = 0; i < nodes.length; i++) {
        for (let j = i + 1; j < nodes.length; j++) {
          groupLinks.push({
            source: nodes[i],
            target: nodes[j],
          });
        }
      }
    });
    return groupLinks;
  }

  render() {
    const {
      width,
      height,
      nodeProvider,
      edgeProvider,
      groupProvider,
      selected,
      onSelect,
      topology,
    } = this.props;
    const { nodes, edges, nodesById, edgesById, groups, groupsById, zoomTransform } = this.state;
    return (
      <svg height={height} width={width} ref={this.refSvg} onClick={this.deselect}>
        <SvgDefsProvider>
          <g transform={zoomTransform && zoomTransform.toString()} ref={this.zoomGroup}>
            <g>
              {groups.map((groupId) => {
                const viewGroup = groupsById[groupId];
                const Component = groupProvider(viewGroup.type);
                return (
                  <GroupWrapper
                    component={Component}
                    {...viewGroup}
                    key={groupId}
                    onEnter={this.onGroupEnter}
                    view={viewGroup}
                  />
                );
              })}
            </g>
            <g>
              {edges.map((edgeId) => {
                const data = topology[edgeId];
                const viewEdge = edgesById[edgeId];
                const Component = edgeProvider(viewEdge.type);
                return <Component {...viewEdge} key={edgeId} data={data} />;
              })}
            </g>
            <g>
              {nodes.map((nodeId) => {
                const data = topology[nodeId];
                const viewNode = nodesById[nodeId];
                const Component = nodeProvider(viewNode.type);
                return (
                  <ViewWrapper
                    component={Component}
                    {...viewNode}
                    view={viewNode}
                    data={data}
                    key={nodeId}
                    selected={nodeId === selected}
                    onSelect={onSelect ? () => onSelect(nodeId) : null}
                    onEnter={this.onNodeEnter}
                  />
                );
              })}
            </g>
          </g>
        </SvgDefsProvider>
      </svg>
    );
  }
}

type NodeSelection = d3.Selection<Element, ViewNode, null, undefined>;

type ViewWrapperProps = NodeProps & {
  component: React.ComponentType<NodeProps>;
  onEnter(NodeSelection): void;
  view: ViewNode;
  data: TopologyDataObject;
};

class ViewWrapper extends React.Component<ViewWrapperProps> {
  private $node: NodeSelection;

  componentDidMount() {
    // eslint-disable-next-line react/no-find-dom-node
    this.$node = d3.select(ReactDOM.findDOMNode(this) as Element).datum(this.props.view);
    this.props.onEnter && this.props.onEnter(this.$node);
  }

  componentDidUpdate(prevProps: ViewWrapperProps) {
    if (prevProps.view !== this.props.view) {
      // we need to update the data so that d3 apis get the correct new node
      this.$node.datum(this.props.view);
    }
  }

  render() {
    const { component: Component, onEnter, view, ...other } = this.props;
    return <Component {...other} />;
  }
}

type GroupSelection = d3.Selection<Element, ViewGroup, null, undefined>;

type GroupWrapperProps = GroupProps & {
  component: React.ComponentType<GroupProps>;
  onEnter(GroupSelection): void;
  view: ViewGroup;
};

class GroupWrapper extends React.Component<GroupWrapperProps> {
  private $group: GroupSelection;

  componentDidMount() {
    // eslint-disable-next-line react/no-find-dom-node
    this.$group = d3.select(ReactDOM.findDOMNode(this) as Element).datum(this.props.view);
    this.props.onEnter && this.props.onEnter(this.$group);
  }

  componentDidUpdate(prevProps: GroupWrapperProps) {
    if (prevProps.view !== this.props.view) {
      // we need to update the data so that d3 apis get the correct new group
      this.$group.datum(this.props.view);
    }
  }

  render() {
    const { component: Component, onEnter, view, ...other } = this.props;
    return <Component {...other} />;
  }
}
