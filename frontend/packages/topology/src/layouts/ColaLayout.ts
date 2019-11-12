import * as _ from 'lodash';
import * as webcola from 'webcola';
import * as d3 from 'd3';
import { action } from 'mobx';
import {
  ADD_ELEMENT_EVENT,
  Edge,
  Graph,
  GraphElement,
  isNode,
  Layout,
  Node,
  REMOVE_ELEMENT_EVENT,
} from '../types';
import { leafNodeElements, groupNodeElements, getElementPadding } from '../utils/element-utils';
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

  private nodeFixed: boolean = false;

  private indexx: number;

  private nodeParent: ColaGroup;

  constructor(node: Node, index: number) {
    this.node = node;
    this.indexx = index;
  }

  get element(): Node {
    return this.node;
  }

  get id(): string {
    return this.node.getId();
  }

  get index(): number {
    return this.indexx;
  }

  set index(index: number) {
    this.indexx = index;
  }

  get parent(): ColaGroup {
    return this.nodeParent;
  }

  set parent(parent: ColaGroup) {
    this.nodeParent = parent;
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

  get isFixed(): boolean {
    return this.nodeFixed;
  }

  set isFixed(fixed: boolean) {
    this.nodeFixed = fixed;
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
    return this.node.getBounds().width + getElementPadding(this.node) * 2;
  }

  get height(): number {
    return this.node.getBounds().height + getElementPadding(this.node) * 2;
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
    return Math.max(this.width, this.height) / 2;
  }
}

class ColaGroup implements webcola.Group {
  private readonly node: Node;

  private childNodes: ColaNode[];

  private childGroups: ColaGroup[];

  private indexx: number;

  private nodeParent: ColaGroup;

  constructor(node: Node, index: number) {
    this.node = node;
    this.indexx = index;
  }

  get element(): Node {
    return this.node;
  }

  get index(): number {
    return this.indexx;
  }

  set index(index: number) {
    this.indexx = index;
  }

  get id(): string {
    return this.node.getId();
  }

  get leaves(): ColaNode[] {
    return this.childNodes;
  }

  set leaves(leaves: ColaNode[]) {
    this.childNodes = leaves;
  }

  get groups(): ColaGroup[] {
    return this.childGroups;
  }

  set groups(groups: ColaGroup[]) {
    this.childGroups = groups;
  }

  get parent(): ColaGroup {
    return this.nodeParent;
  }

  set parent(parent: ColaGroup) {
    this.nodeParent = parent;
  }

  get padding() {
    return getElementPadding(this.node);
  }
}

class ColaLink implements webcola.Link<ColaNode | number> {
  private readonly edge: Edge;

  private linkSource: ColaNode;

  private linkTarget: ColaNode;

  constructor(edge: Edge, source: ColaNode, target: ColaNode) {
    this.edge = edge;
    this.linkSource = source;
    this.linkTarget = target;
  }

  get element(): Edge {
    return this.edge;
  }

  get source(): ColaNode {
    return this.linkSource;
  }

  set source(node: ColaNode) {
    this.linkSource = node;
  }

  get target(): ColaNode {
    return this.linkTarget;
  }

  set target(node: ColaNode) {
    this.linkTarget = node;
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
  collideDistance: number;
  simulationSpeed: number;
  chargeStrength: number;
  layoutOnDrag: boolean;
  maxTicks: number;
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

  private tickCount = 0;

  constructor(graph: Graph, options?: Partial<ColaLayoutOptions>) {
    this.graph = graph;
    this.options = {
      ...{
        linkDistance: 1,
        collideDistance: 10,
        simulationSpeed: 10,
        chargeStrength: -30,
        layoutOnDrag: true,
        maxTicks: 200,
      },
      ...options,
    };

    if (this.options.layoutOnDrag) {
      graph
        .getController()
        .addEventListener<DragNodeEventListener>(DRAG_NODE_START_EVENT, this.handleDragStart)
        .addEventListener<DragNodeEventListener>(DRAG_NODE_END_EVENT, this.handleDragEnd);
    }

    this.d3Cola = webcola.d3adaptor(d3);
    this.d3Cola.handleDisconnected(true);
    this.d3Cola.avoidOverlaps(true);
    this.d3Cola.linkDistance(this.options.linkDistance);
    this.d3Cola.on('tick', () => {
      if (this.tickCount++ % this.options.simulationSpeed === 0) {
        action(() => this.nodes.forEach((d) => d.update()))();
      }
      if (this.options.maxTicks >= 0 && this.tickCount > this.options.maxTicks) {
        this.d3Cola.alpha(0);
      }
    });
    this.d3Cola.on('end', () => {
      action(() => {
        this.nodes.forEach((d) => d.update());
        this.useForceSimulation();
      })();
    });

    this.setupForceSimulation();
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

  handleDragStart = (element: Node, event: DragEvent, operation: string) => {
    if (operation !== DRAG_MOVE_OPERATION) {
      this.simulation.stop();
      return;
    }

    // Set the alpha to 0 to halt any ticks that may be occurring
    this.d3Cola.alpha(0);

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
    this.graph.getController().addEventListener(ADD_ELEMENT_EVENT, this.handleAddedElements);
    this.graph.getController().addEventListener(REMOVE_ELEMENT_EVENT, this.scheduleLayout);
  }

  private stopListening(): void {
    clearTimeout(this.scheduleHandle);
    this.graph.getController().removeEventListener(ADD_ELEMENT_EVENT, this.handleAddedElements);
    this.graph.getController().removeEventListener(REMOVE_ELEMENT_EVENT, this.scheduleLayout);
  }

  private handleAddedElements = (elements: GraphElement[]): void => {
    const cx = this.graph.getBounds().width / 2;
    const cy = this.graph.getBounds().height / 2;
    elements.filter(isNode).forEach((node) =>
      node.setBounds(
        node
          .getBounds()
          .clone()
          .setCenter(cx, cy),
      ),
    );
    this.scheduleRestart = true;
    this.scheduleLayout();
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

  private setupForceSimulation(): void {
    this.simulation = d3.forceSimulation<ColaNode>();
    this.simulation.force(
      'collide',
      d3.forceCollide<ColaNode>().radius((d) => d.getRadius() + this.options.collideDistance),
    );
    this.simulation.force('charge', d3.forceManyBody().strength(this.options.chargeStrength));
    this.simulation.alpha(0);

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
    this.forceLink = d3.forceLink<ColaNode, ColaLink>().id((e) => e.id);
  }

  private useForceSimulation(): void {
    this.forceLink.distance((e) => {
      return Math.sqrt((e.source.x - e.target.x) ** 2 + (e.source.y - e.target.y) ** 2);
    });
    this.simulation.nodes([...this.nodes]);
    this.forceLink.links([]);
    this.forceLink.links([...this.edges, ...getFauxEdges(this.groups, this.nodes)]);
  }

  private haltForceSimulation(): void {
    this.simulation.alpha(0);
    this.simulation.nodes([]);
    this.forceLink.links([]);
  }

  @action
  private runLayout(initialRun: boolean, restart = true): void {
    const leafNodes = leafNodeElements(this.graph.getNodes());

    if (!initialRun) {
      if (leafNodes.length === this.nodes.length) {
        const sa = leafNodes.sort((a, b) => a.getId().localeCompare(b.getId()));
        const sb = this.nodes.sort((a, b) => a.id.localeCompare(b.id));
        let isDifferent = false;
        for (let i = 0; i < sa.length; i++) {
          if (sa[i] !== sb[i].element) {
            isDifferent = true;
            break;
          }
        }
        // no change in nodes
        if (!isDifferent) {
          return;
        }
      }

      // check for node additions
      const diff = _.differenceWith(
        leafNodes,
        this.nodes,
        (node, colaNode) => node === colaNode.element,
      );

      if (diff.length > 0) {
        // position new nodes at center
        const cx = this.graph.getBounds().width / 2;
        const cy = this.graph.getBounds().height / 2;
        diff.forEach((node) =>
          node.setBounds(
            node
              .getBounds()
              .clone()
              .setCenter(cx, cy),
          ),
        );
      }
    }

    // create datum
    let nodeIndex = 0;
    const groups = groupNodeElements(this.graph.getNodes());
    this.nodes = leafNodes.map((n) => new ColaNode(n, nodeIndex++));
    this.edges = [];
    this.graph.getEdges().forEach((e) => {
      const source = getColaNode(this.nodes, e.getSource());
      const target = getColaNode(this.nodes, e.getTarget());
      if (source && target) {
        this.edges.push(new ColaLink(e, source, target));
      }
    });

    // remove bend points
    this.edges.forEach((e) => {
      if (e.element.getBendpoints().length > 0) {
        e.element.setBendpoints([]);
      }
    });

    this.groups = groups.map((group: Node) => new ColaGroup(group, nodeIndex++));
    this.groups.forEach((groupNode: ColaGroup) => {
      const leaves: ColaNode[] = [];
      const leafElements = groupNode.element.getChildren().filter((node: Node) => !node.isGroup());
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

    if (initialRun) {
      // force center
      const cx = this.graph.getBounds().width / 2;
      const cy = this.graph.getBounds().height / 2;
      _.forEach(this.nodes, (node: ColaNode) => {
        node.setPosition(cx, cy);
      });
      this.d3Cola.alpha(1);
    } else if (restart && this.d3Cola.alpha() < 0.2) {
      this.d3Cola.alpha(0.2);
    }

    this.d3Cola.size([this.graph.getBounds().width, this.graph.getBounds().height]);
    this.d3Cola.nodes(this.nodes);
    this.d3Cola.links([...this.edges, ...getFauxEdges(this.groups, this.nodes)]);
    this.d3Cola.groups(this.groups);
    this.d3Cola.constraints(this.getConstraints(this.nodes, this.groups, this.edges));

    // Reset the force simulation
    this.haltForceSimulation();

    if (initialRun || restart) {
      // start
      this.d3Cola.start(200, 50, 150, 50);
    }
  }
}

export { ColaLayout, ColaNode, ColaGroup, ColaLink, ColaLayoutOptions };
