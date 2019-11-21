import * as _ from 'lodash';
import * as webcola from 'webcola';
import * as d3 from 'd3';
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
import { leafNodeElements, groupNodeElements, getGroupPadding } from '../utils/element-utils';
import {
  DRAG_MOVE_OPERATION,
  DRAG_NODE_END_EVENT,
  DRAG_NODE_START_EVENT,
  DragEvent,
  DragNodeEventListener,
} from '../behavior';
import { BaseEdge } from '../elements';

class ColaNode implements webcola.Node {
  private readonly node: Node;

  private xx?: number;

  private yy?: number;

  public readonly distance: number;

  // isFixed is used locally for Force simulation during drag events
  public isFixed: boolean = false;

  public index: number;

  public parent: ColaGroup;

  // fixed is used by Cola during node additions: 1 for fixed
  public fixed: number = 0;

  constructor(node: Node, index: number, distance: number) {
    this.node = node;
    this.index = index;
    this.distance = distance;
  }

  get element(): Node {
    return this.node;
  }

  get id(): string {
    return this.node.getId();
  }

  get x(): number {
    return this.xx || this.node.getBounds().getCenter().x;
  }

  set x(x: number) {
    if (!Number.isNaN(x)) {
      this.xx = x;
    }
  }

  get y(): number {
    return this.yy || this.node.getBounds().getCenter().y;
  }

  set y(y: number) {
    if (!Number.isNaN(y)) {
      this.yy = y;
    }
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

  get width(): number {
    return this.node.getBounds().width + this.distance * 2;
  }

  get height(): number {
    return this.node.getBounds().height + this.distance * 2;
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

  get radius(): number {
    return Math.max(this.node.getBounds().width, this.node.getBounds().height) / 2;
  }

  get collisionRadius(): number {
    return Math.max(this.width, this.height) / 2;
  }
}

class ColaGroup implements webcola.Group {
  private readonly node: Node;

  public leaves: ColaNode[];

  public groups: ColaGroup[];

  public index: number;

  public parent: ColaGroup;

  public padding: number;

  constructor(node: Node, index: number, padding: number) {
    this.node = node;
    this.padding = padding;
  }

  get element(): Node {
    return this.node;
  }

  get id(): string {
    return this.node.getId();
  }
}

class ColaLink implements webcola.Link<ColaNode | number> {
  private readonly edge: Edge;

  public source: ColaNode;

  public target: ColaNode;

  public name: string;

  constructor(edge: Edge, source: ColaNode, target: ColaNode) {
    this.edge = edge;
    this.source = source;
    this.target = target;
    this.name = `${source.element.getLabel()} -> ${target.element.getLabel()}`;
  }

  get element(): Edge {
    return this.edge;
  }

  get id(): string {
    return this.edge.getId();
  }
}

const getColaNode = (nodes: ColaNode[], node: Node): ColaNode | undefined => {
  let colaNode = _.find(nodes, { id: node.getId() });
  if (!colaNode && _.size(node.getChildren())) {
    colaNode = _.find(nodes, { id: node.getChildren()[0].getId() });
  }
  return colaNode;
};

const getFauxEdges = (groups: ColaGroup[], nodes: ColaNode[]): ColaLink[] => {
  const fauxEdges: ColaLink[] = [];
  groups.forEach((group: ColaGroup) => {
    const groupNodes = group.element.getNodes();
    for (let i = 0; i < groupNodes.length; i++) {
      for (let j = i + 1; j < groupNodes.length; j++) {
        const fauxEdge = new BaseEdge();
        const source = getColaNode(nodes, groupNodes[i]);
        const target = getColaNode(nodes, groupNodes[j]);
        if (source && target) {
          const link = new ColaLink(fauxEdge, source, target);
          fauxEdge.setController(target.element.getController());
          fauxEdges.push(link);
        }
      }
    }
  });

  return fauxEdges;
};

type ColaLayoutOptions = {
  linkDistance: number;
  nodeDistance: number;
  groupDistance: number;
  collideDistance: number;
  simulationSpeed: number;
  chargeStrength: number;
  layoutOnDrag: boolean;
  maxTicks: number;
  initialUnconstrainedIterations: number;
  initialUserConstraintIterations: number;
  initialAllConstraintsIterations: number;
  gridSnapIterations: number;
};

class ColaLayout implements Layout {
  private graph: Graph;

  private d3Cola: any;

  private forceLink: d3.ForceLink<ColaNode, ColaLink>;

  private simulation: any;

  private options: ColaLayoutOptions;

  private scheduleHandle?: number;

  private scheduleRestart = false;

  private nodes: ColaNode[] = [];

  private edges: ColaLink[] = [];

  private groups: ColaGroup[] = [];

  private nodesMap: { [id: string]: ColaNode } = {};

  private tickCount = 0;

  constructor(graph: Graph, options?: Partial<ColaLayoutOptions>) {
    this.graph = graph;
    this.options = {
      ...{
        linkDistance: 30,
        nodeDistance: 0,
        groupDistance: 0,
        collideDistance: 0,
        simulationSpeed: 10,
        chargeStrength: 0,
        layoutOnDrag: true,
        maxTicks: 200,
        initialUnconstrainedIterations: 200,
        initialUserConstraintIterations: 50,
        initialAllConstraintsIterations: 150,
        gridSnapIterations: 50,
      },
      ...options,
    };

    graph
      .getController()
      .addEventListener<DragNodeEventListener>(DRAG_NODE_START_EVENT, this.handleDragStart)
      .addEventListener<DragNodeEventListener>(DRAG_NODE_END_EVENT, this.handleDragEnd);

    this.d3Cola = webcola.d3adaptor(d3);
    this.d3Cola.handleDisconnected(true);
    this.d3Cola.avoidOverlaps(true);
    this.d3Cola.linkDistance(this.getLinkDistance);
    this.d3Cola.on('tick', () => {
      if (this.tickCount++ % this.options.simulationSpeed === 0) {
        action(() => this.nodes.forEach((d) => d.update()))();
      }
      if (this.options.maxTicks >= 0 && this.tickCount > this.options.maxTicks) {
        this.d3Cola.stop();
      }
    });
    this.d3Cola.on('end', () => {
      action(() => {
        this.nodes.forEach((d) => {
          d.update();
          d.fixed = 0;
        });
        if (this.options.layoutOnDrag) {
          this.useForceSimulation();
        }
      })();
    });

    this.setupForceSimulation();
  }

  destroy(): void {
    this.graph
      .getController()
      .removeEventListener(DRAG_NODE_START_EVENT, this.handleDragStart)
      .removeEventListener(DRAG_NODE_END_EVENT, this.handleDragEnd);

    this.stopListening();

    this.d3Cola.alpha(0);
    this.simulation.alpha(0);
  }

  handleDragStart = (element: Node, event: DragEvent, operation: string) => {
    // Set the alpha to 0 to halt any ticks that may be occurring
    this.d3Cola.alpha(0);

    if (!this.options.layoutOnDrag) {
      return;
    }

    if (operation !== DRAG_MOVE_OPERATION) {
      this.simulation.stop();
      return;
    }

    const id = element.getId();
    let found = false;
    const dragNode: ColaNode | undefined = this.nodes.find((node: ColaNode) => node.id === id);
    if (dragNode) {
      dragNode.isFixed = true;
      found = true;
    }
    if (!found) {
      const dragGroup: ColaGroup | undefined = this.groups.find(
        (group: ColaGroup) => group.id === id,
      );
      if (dragGroup) {
        const groupNodes = dragGroup.leaves;
        groupNodes.forEach((node: ColaNode) => {
          node.isFixed = true;
        });
        found = true;
      }
    }

    if (found) {
      this.simulation.alphaTarget(0.1).restart();
    }
  };

  handleDragEnd = (element: Node, event: DragEvent, operation: string) => {
    if (!this.options.layoutOnDrag) {
      return;
    }

    if (operation !== DRAG_MOVE_OPERATION) {
      this.simulation.restart();
      return;
    }

    const id = element.getId();
    const dragNode: ColaNode | undefined = this.nodes.find((node: ColaNode) => node.id === id);
    if (dragNode) {
      dragNode.isFixed = false;
    } else {
      const dragGroup: ColaGroup | undefined = this.groups.find(
        (group: ColaGroup) => group.id === id,
      );
      if (dragGroup) {
        const groupNodes = dragGroup.leaves;
        groupNodes.forEach((node: ColaNode) => {
          node.isFixed = false;
        });
      }
    }
    this.simulation.alphaTarget(0);
  };

  layout = () => {
    this.stopListening();

    this.runLayout(true);

    this.startListening();
  };

  private startListening(): void {
    this.graph.getController().addEventListener(ADD_CHILD_EVENT, this.handleChildAdded);
    this.graph.getController().addEventListener(REMOVE_CHILD_EVENT, this.handleChildRemoved);
  }

  private stopListening(): void {
    clearTimeout(this.scheduleHandle);
    this.graph.getController().removeEventListener(ADD_CHILD_EVENT, this.handleChildAdded);
    this.graph.getController().removeEventListener(REMOVE_CHILD_EVENT, this.handleChildRemoved);
  }

  private handleChildAdded: ElementChildEventListener = ({ child }): void => {
    if (!this.nodesMap[child.getId()]) {
      this.scheduleRestart = true;
      this.scheduleLayout();
    }
  };

  private handleChildRemoved: ElementChildEventListener = ({ child }): void => {
    if (this.nodesMap[child.getId()]) {
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

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  protected getConstraints(nodes: ColaNode[], groups: ColaGroup[], edges: ColaLink[]): any[] {
    return [];
  }

  protected getLinkDistance = (link: ColaLink): number => {
    let distance = this.options.linkDistance + link.source.radius + link.target.radius;
    if (link.source.element.getParent() !== link.target.element.getParent()) {
      distance += getGroupPadding(link.source.element.getParent());
      distance += getGroupPadding(link.target.element.getParent());
    }
    return distance;
  };

  protected getNodeDistance = (link: ColaLink): number => {
    return Math.sqrt((link.source.x - link.target.x) ** 2 + (link.source.y - link.target.y) ** 2);
  };

  private setupForceSimulation(): void {
    this.simulation = d3.forceSimulation<ColaNode>();
    this.simulation.force(
      'collide',
      d3.forceCollide<ColaNode>().radius((d) => d.collisionRadius + this.options.collideDistance),
    );
    this.simulation.force('charge', d3.forceManyBody().strength(this.options.chargeStrength));
    this.simulation.alpha(0);
    this.forceLink = d3.forceLink<ColaNode, ColaLink>().id((e) => e.id);

    this.simulation.force('link', this.forceLink);
    this.simulation.on(
      'tick',
      action(() => {
        // speed up the simulation
        for (let i = 0; i < this.options.simulationSpeed; i++) {
          this.simulation.tick();
        }
        this.simulation.nodes().forEach((d: ColaNode) => d.update());
      }),
    );
  }

  private useForceSimulation(): void {
    this.forceLink.distance(this.getNodeDistance);

    this.simulation.nodes([...this.nodes]);
    this.forceLink.links([...this.edges]);
  }

  private haltForceSimulation(): void {
    this.simulation.alpha(0);
    this.simulation.nodes([]);
    this.forceLink.links([]);
  }

  @action
  private runLayout(initialRun: boolean, restart = true): void {
    const leafNodes = leafNodeElements(this.graph.getNodes());

    // create datum
    let nodeIndex = 0;
    this.nodes = leafNodes.map((n) => new ColaNode(n, nodeIndex++, this.options.nodeDistance));
    this.edges = [];
    this.graph.getEdges().forEach((e) => {
      const source = getColaNode(this.nodes, e.getSource());
      const target = getColaNode(this.nodes, e.getTarget());
      if (source && target) {
        // remove any bendpoints
        if (e.getBendpoints().length > 0) {
          e.setBendpoints([]);
        }
        this.edges.push(new ColaLink(e, source, target));
      }
    });
    const groups = groupNodeElements(this.graph.getNodes());

    // Turn empty groups into nodes
    groups.forEach((group: Node) => {
      if (group.getChildren().length === 0) {
        this.nodes.push(new ColaNode(group, nodeIndex++, this.options.nodeDistance));
      }
    });

    // Create groups only for those with children
    this.groups = groups
      .filter((g) => g.getChildren().length > 0)
      .map((group: Node) => new ColaGroup(group, nodeIndex++, this.options.groupDistance));

    this.groups.forEach((groupNode: ColaGroup) => {
      const leaves: ColaNode[] = [];
      const leafElements = groupNode.element
        .getChildren()
        .filter((node: Node) => !node.isGroup() || node.getChildren().length === 0);
      leafElements.forEach((leaf: Node) => {
        const colaLeaf = this.nodes.find((n) => n.id === leaf.getId());
        if (colaLeaf) {
          leaves.push(colaLeaf);
          colaLeaf.parent = groupNode;
        }
      });
      groupNode.leaves = leaves;
      const childGroups: ColaGroup[] = [];
      const groupElements = groupNode.element.getChildren().filter((node: Node) => node.isGroup());
      groupElements.forEach((group: Node) => {
        const colaGroup = this.groups.find((g) => g.id === group.getId());
        if (colaGroup) {
          childGroups.push(colaGroup);
          colaGroup.parent = groupNode;
        }
      });
      groupNode.groups = childGroups;
    });

    this.d3Cola.size([this.graph.getBounds().width, this.graph.getBounds().height]);

    const newNodes: ColaNode[] = initialRun
      ? this.nodes
      : this.nodes.filter((node) => !this.nodesMap[node.element.getId()]);
    const addingNodes = restart && newNodes.length > 0;

    // initialize new node positions
    const cx = this.graph.getBounds().width / 2;
    const cy = this.graph.getBounds().height / 2;
    newNodes.forEach((node: ColaNode) => {
      node.setPosition(cx, cy);
    });

    // re-create the nodes map
    this.nodesMap = this.nodes.reduce((acc, n) => (acc[n.element.getId()] = n && acc), {});

    // Get any custom constraints
    this.d3Cola.constraints(this.getConstraints(this.nodes, this.groups, this.edges));

    // Add faux edges to keep grouped items together
    this.edges.push(...getFauxEdges(this.groups, this.nodes));

    this.d3Cola.nodes(this.nodes);
    this.d3Cola.links(this.edges);
    this.d3Cola.groups(this.groups);

    if (addingNodes) {
      // Set existing nodes to be fixed
      this.nodes
        .filter((n) => !newNodes.includes(n))
        .forEach((n) => {
          n.fixed = 1;
        });
    }

    if (initialRun || addingNodes) {
      // Reset the force simulation
      this.haltForceSimulation();

      // start the layout
      this.d3Cola.alpha(0.2);
      this.d3Cola.start(
        addingNodes ? 0 : this.options.initialUnconstrainedIterations,
        addingNodes ? 0 : this.options.initialUserConstraintIterations,
        addingNodes ? 0 : this.options.initialAllConstraintsIterations,
        addingNodes ? 0 : this.options.gridSnapIterations,
        true,
        !addingNodes,
      );
    } else if (restart && this.options.layoutOnDrag) {
      this.useForceSimulation();
      this.simulation.alpha(0.2);
    }
  }
}

export { ColaLayout, ColaNode, ColaGroup, ColaLink, ColaLayoutOptions };
