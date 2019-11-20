import * as d3 from 'd3';
import * as _ from 'lodash';
import { action } from 'mobx';
import {
  Edge,
  Graph,
  Layout,
  Node,
  ADD_CHILD_EVENT,
  REMOVE_CHILD_EVENT,
  ElementChildEventListener,
} from '../types';
import {
  getElementPadding,
  getGroupPadding,
  groupNodeElements,
  leafNodeElements,
} from '../utils/element-utils';
import BaseEdge from '../elements/BaseEdge';
import {
  DRAG_NODE_START_EVENT,
  DRAG_NODE_END_EVENT,
  DragNodeEventListener,
  DRAG_MOVE_OPERATION,
  DragEvent,
} from '../behavior';

class D3Node implements d3.SimulationNodeDatum {
  private node: Node;

  private xx?: number;

  private yy?: number;

  private isFixed: boolean = false;

  constructor(node: Node) {
    this.node = node;
  }

  get element(): Node {
    return this.node;
  }

  get id(): string {
    return this.node.getId();
  }

  set fixed(fixed: boolean) {
    this.isFixed = fixed;
  }

  get fixed(): boolean {
    return this.isFixed;
  }

  get x(): number {
    return this.xx || this.node.getBounds().getCenter().x;
  }

  set x(x: number) {
    this.xx = x;
  }

  get y(): number {
    return this.yy || this.node.getBounds().getCenter().y;
  }

  set y(y: number) {
    this.yy = y;
  }

  get fx(): number | undefined {
    return this.isFixed ? this.node.getBounds().getCenter().x : undefined;
  }

  get fy(): number | undefined {
    return this.isFixed ? this.node.getBounds().getCenter().y : undefined;
  }

  setPosition(x: number, y: number) {
    this.node.setBounds(
      this.node
        .getBounds()
        .clone()
        .setCenter(x, y),
    );
  }

  update() {
    if (this.xx != null && this.yy != null) {
      this.node.setBounds(
        this.node
          .getBounds()
          .clone()
          .setCenter(this.xx, this.yy),
      );
    }
    this.xx = undefined;
    this.yy = undefined;
  }

  getRadius(): number {
    const { width, height } = this.node.getBounds();
    return Math.max(width, height) / 2 + getElementPadding(this.element);
  }
}

class D3Link implements d3.SimulationLinkDatum<D3Node> {
  private edge: Edge;

  private d3Source: D3Node;

  private d3Target: D3Node;

  public falseEdge: boolean;

  constructor(edge: Edge, falseEdge: boolean = false) {
    this.edge = edge;
    this.falseEdge = falseEdge;
  }

  get element(): Edge {
    return this.edge;
  }

  get source(): D3Node {
    return this.d3Source;
  }

  set source(node: D3Node) {
    this.d3Source = node;
  }

  get target(): D3Node {
    return this.d3Target;
  }

  set target(node: D3Node) {
    this.d3Target = node;
  }

  get id(): string {
    return this.edge.getId();
  }
}

type ForceLayoutOptions = {
  linkDistance: number;
  collideDistance: number;
  simulationSpeed: number;
  chargeStrength: number;
  layoutOnDrag: boolean;
};

const getD3Node = (nodes: D3Node[], node: Node): D3Node | undefined => {
  let d3Node = _.find(nodes, { id: node.getId() });
  if (!d3Node && _.size(node.getChildren())) {
    d3Node = _.find(nodes, { id: node.getChildren()[0].getId() });
  }
  return d3Node;
};

export default class ForceLayout implements Layout {
  private graph: Graph;

  private simulation: d3.Simulation<D3Node, undefined>;

  private forceLink: d3.ForceLink<D3Node, D3Link>;

  private options: ForceLayoutOptions;

  private scheduleHandle?: number;

  private scheduleRestart = false;

  private nodesMap: { [id: string]: D3Node } = {};

  constructor(graph: Graph, options?: Partial<ForceLayoutOptions>) {
    this.graph = graph;
    this.options = {
      ...{
        linkDistance: 30,
        collideDistance: 10,
        simulationSpeed: 10,
        chargeStrength: -30,
        layoutOnDrag: true,
      },
      ...options,
    };

    if (this.options.layoutOnDrag) {
      graph
        .getController()
        .addEventListener<DragNodeEventListener>(DRAG_NODE_START_EVENT, this.handleDragStart)
        .addEventListener<DragNodeEventListener>(DRAG_NODE_END_EVENT, this.handleDragEnd);
    }

    this.forceLink = d3
      .forceLink<D3Node, D3Link>()
      .id((e) => e.id)
      .distance((e) => {
        let distance = this.options.linkDistance + e.source.getRadius() + e.target.getRadius();

        if (!e.falseEdge && e.source.element.getParent() !== e.target.element.getParent()) {
          // find the group padding
          distance += getGroupPadding(e.source.element.getParent());
          distance += getGroupPadding(e.target.element.getParent());
        }

        return distance;
      });
    this.simulation = d3
      .forceSimulation<D3Node>()
      .force(
        'collide',
        d3.forceCollide<D3Node>().radius((d) => d.getRadius() + this.options.collideDistance),
      )
      .force('charge', d3.forceManyBody().strength(this.options.chargeStrength))
      .force('link', this.forceLink)
      .on(
        'tick',
        action(() => {
          // speed up the simulation
          for (let i = 0; i < this.options.simulationSpeed; i++) {
            this.simulation.tick();
          }
          this.simulation.nodes().forEach((d) => d.update());
        }),
      );
  }

  destroy(): void {
    if (this.options.layoutOnDrag) {
      this.graph
        .getController()
        .removeEventListener(DRAG_NODE_START_EVENT, this.handleDragStart)
        .removeEventListener(DRAG_NODE_END_EVENT, this.handleDragEnd);
    }
    this.stopListening();
  }

  getGroupNodes = (group: Node): D3Node[] => {
    return leafNodeElements(group).reduce((nodes: D3Node[], nextNode: Node) => {
      const d3Node = this.simulation.nodes().find((node: D3Node) => node.id === nextNode.getId());
      if (d3Node) {
        nodes.push(d3Node);
      }
      return nodes;
    }, []);
  };

  handleDragStart = (element: Node, event: DragEvent, operation: string) => {
    if (operation !== DRAG_MOVE_OPERATION) {
      this.simulation.stop();
      return;
    }
    const id = element.getId();
    let found = false;
    const dragNode: D3Node | undefined = this.simulation
      .nodes()
      .find((node: D3Node) => node.id === id);
    if (dragNode) {
      dragNode.fixed = true;
      found = true;
    }
    if (!found) {
      const dragGroup: Node | undefined = groupNodeElements(this.graph.getNodes()).find(
        (group: Node) => group.getId() === id,
      );
      if (dragGroup) {
        const groupNodes = this.getGroupNodes(dragGroup);
        groupNodes.forEach((node: D3Node) => {
          node.fixed = true;
        });
        found = true;
      }
    }
    if (found) {
      this.simulation.alphaTarget(0.1).restart();
    }
  };

  handleDragEnd = (element: Node, event: DragEvent, operation: string) => {
    if (operation !== DRAG_MOVE_OPERATION) {
      this.simulation.restart();
      return;
    }
    const id = element.getId();
    this.simulation.alphaTarget(0);
    const dragNode: D3Node | undefined = this.simulation
      .nodes()
      .find((node: D3Node) => node.id === id);
    if (dragNode) {
      dragNode.fixed = false;
    } else {
      const dragGroup: Node | undefined = groupNodeElements(this.graph.getNodes()).find(
        (group: Node) => group.getId() === id,
      );
      if (dragGroup) {
        const groupNodes = this.getGroupNodes(dragGroup);
        groupNodes.forEach((node: D3Node) => {
          node.fixed = false;
        });
      }
    }
  };

  layout = () => {
    this.stopListening();

    this.runLayout(true);

    this.startListening();
  };

  private startListening(): void {
    this.graph.getController().addEventListener(ADD_CHILD_EVENT, this.handleChildAdded);
    this.graph.getController().addEventListener(REMOVE_CHILD_EVENT, this.scheduleLayout);
  }

  private stopListening(): void {
    clearTimeout(this.scheduleHandle);
    this.graph.getController().removeEventListener(ADD_CHILD_EVENT, this.handleChildAdded);
    this.graph.getController().removeEventListener(REMOVE_CHILD_EVENT, this.scheduleLayout);
  }

  private handleChildAdded: ElementChildEventListener = ({ child }): void => {
    if (!this.nodesMap[child.getId()]) {
      this.scheduleRestart = true;
      this.scheduleLayout();
    }
  };

  private scheduleLayout = (): void => {
    if (!this.scheduleHandle) {
      this.scheduleHandle = window.setTimeout(() => {
        delete this.scheduleHandle;
        this.runLayout(false, this.scheduleRestart);
        this.scheduleRestart = false;
      }, 0);
    }
  };

  @action
  private runLayout(initialRun: boolean, restart = true): void {
    const leafNodes = leafNodeElements(this.graph.getNodes());

    // create datum
    const groups = groupNodeElements(this.graph.getNodes());
    const nodes = leafNodes.map((n) => new D3Node(n));
    const edges: D3Link[] = [];
    this.graph.getEdges().forEach((e) => {
      const link = new D3Link(e);
      const source = getD3Node(nodes, e.getSource());
      const target = getD3Node(nodes, e.getTarget());
      if (source && target) {
        link.source = source;
        link.target = target;
        edges.push(link);
      }
    });

    // remove bend points
    edges.forEach((e) => {
      if (e.element.getBendpoints().length > 0) {
        e.element.setBendpoints([]);
      }
    });

    // Create faux edges for the grouped nodes to form group clusters
    groups.forEach((group: Node) => {
      const groupNodes = group.getNodes();
      for (let i = 0; i < groupNodes.length; i++) {
        for (let j = i + 1; j < groupNodes.length; j++) {
          const fauxEdge = new BaseEdge();
          const source = getD3Node(nodes, groupNodes[i]);
          const target = getD3Node(nodes, groupNodes[j]);
          if (source && target) {
            const link = new D3Link(fauxEdge, true);
            fauxEdge.setSource(source.element);
            fauxEdge.setTarget(target.element);
            fauxEdge.setController(target.element.getController());
            link.source = source;
            link.target = target;
            edges.push(link);
          }
        }
      }
    });

    if (initialRun) {
      // initialize all node positions
      const cx = this.graph.getBounds().width / 2;
      const cy = this.graph.getBounds().height / 2;
      nodes.forEach((node) => {
        node.setPosition(cx, cy);
      });

      // force center
      this.simulation.force('center', d3.forceCenter(cx, cy));
      this.simulation.alpha(1);
    } else if (restart) {
      // initialize new node positions
      const cx = this.graph.getBounds().width / 2;
      const cy = this.graph.getBounds().height / 2;
      nodes.forEach((node) => {
        if (!this.nodesMap[node.element.getId()]) {
          node.setPosition(cx, cy);
        }
      });

      if (this.simulation.alpha() < 0.2) {
        this.simulation.alpha(0.2);
      }
    }

    // re-create the nodes map
    this.nodesMap = nodes.reduce((acc, n) => (acc[n.element.getId()] = n && acc), {});

    // first remove the links so that the layout doesn't error
    this.forceLink.links([]);
    // next set the new nodes
    this.simulation.nodes(nodes);
    // finally set the new links
    this.forceLink.links(edges);
    if (initialRun || restart) {
      // start
      this.simulation.restart();
    }
  }
}
