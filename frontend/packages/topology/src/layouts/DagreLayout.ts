import * as dagre from 'dagre';
import * as _ from 'lodash';
import { Edge, GraphElement, Graph, Layout, Node } from '../types';
import Point from '../geom/Point';
import { leafNodeElements } from '../utils/element-utils';

class DagreNode {
  private node: Node;

  constructor(node: Node) {
    this.node = node;
  }

  getId(): string {
    return this.node.getId();
  }

  getData(): any {
    return this.node.getData();
  }

  get element(): Node {
    return this.node;
  }

  get x(): number {
    return this.node.getBounds().getCenter().x;
  }

  set x(value: number) {
    this.node.setBounds(
      this.node.getBounds().setCenter(value, this.node.getBounds().getCenter().y),
    );
  }

  get y(): number {
    return this.node.getBounds().getCenter().y;
  }

  set y(value: number) {
    this.node.setBounds(
      this.node
        .getBounds()
        .clone()
        .setCenter(this.node.getBounds().getCenter().x, value),
    );
  }
}

class DagreEdge {
  public points: any[];

  private edge: Edge;

  constructor(edge: Edge) {
    this.edge = edge;
  }

  get element(): Edge {
    return this.edge;
  }

  get source(): string {
    return this.edge.getSource().getId();
  }

  get target(): string {
    return this.edge.getTarget().getId();
  }
}

export default class DagreLayout implements Layout {
  // eslint-disable-next-line @typescript-eslint/ban-ts-ignore
  // @ts-ignore
  private graph: Graph; // Usage is TBD

  constructor(graph: Graph) {
    this.graph = graph;
  }

  destroy(): void {}

  layout = () => {
    const nodes: DagreNode[] = leafNodeElements(this.graph.getNodes()).map(
      (node: GraphElement) => new DagreNode(node as Node),
    );
    const edges: DagreEdge[] = this.graph.getEdges().map((edge: Edge) => {
      edge.setBendpoints([]);
      return new DagreEdge(edge as Edge);
    });

    const graph = new dagre.graphlib.Graph({ compound: true });
    graph.setGraph({
      marginx: 0,
      marginy: 0,
      nodesep: 20,
      ranker: 'tight-tree',
    });

    _.forEach(nodes, (node) => {
      graph.setNode(node.getId(), node);
      graph.setParent(node.getId(), node.getData().group);
    });

    _.forEach(edges, (dagreEdge: DagreEdge) => {
      graph.setEdge(dagreEdge.source, dagreEdge.target, dagreEdge);
    });

    dagre.layout(graph);

    _.forEach(edges, (edge: DagreEdge) => {
      if (edge.points && edge.points.length > 2) {
        edge.element.setBendpoints(
          edge.points.slice(1, -1).map((point: any) => new Point(point.x, point.y)),
        );
      }
    });
  };
}
