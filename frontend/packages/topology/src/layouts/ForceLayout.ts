import * as d3 from 'd3';
import * as _ from 'lodash';
import { action } from 'mobx';
import {
  Edge,
  GraphElement,
  Graph,
  Layout,
  Node,
  GroupStyle,
  isGraph,
  isNode,
  ADD_ELEMENT_EVENT,
  REMOVE_ELEMENT_EVENT,
} from '../types';
import { groupNodeElements, leafNodeElements } from '../utils/element-utils';
import BaseEdge from '../elements/BaseEdge';
import {
  DRAG_NODE_START_EVENT,
  DRAG_NODE_END_EVENT,
  DragNodeEventListener,
  DRAG_MOVE_OPERATION,
  DragEvent,
} from '../behavior';

function getGroupPadding(element: GraphElement, padding = 0): number {
  if (isGraph(element)) {
    return padding;
  }
  let newPadding = padding;
  if (isNode(element) && element.isGroup()) {
    newPadding += +(element.getStyle<GroupStyle>().padding as number);
  }
  if (element.getParent()) {
    return getGroupPadding(element.getParent(), newPadding);
  }
  return newPadding;
}

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
    return Math.max(width, height) / 2;
  }
}

class D3Link implements d3.SimulationLinkDatum<D3Node> {
  private edge: Edge;

  private d3Source: D3Node;

  private d3Target: D3Node;

  constructor(edge: Edge) {
    this.edge = edge;
  }

  get element(): Edge {
    return this.edge;
  }

  get source(): D3Node | string {
    return this.d3Source || this.edge.getSource().getId();
  }

  set source(node: D3Node | string) {
    if (node instanceof D3Node) {
      this.d3Source = node;
    }
  }

  get target(): D3Node | string {
    return this.d3Target || this.edge.getTarget().getId();
  }

  set target(node: D3Node | string) {
    if (node instanceof D3Node) {
      this.d3Target = node;
    }
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

export default class ForceLayout implements Layout {
  private graph: Graph;

  private simulation: d3.Simulation<D3Node, undefined>;

  private forceLink: d3.ForceLink<D3Node, D3Link>;

  private options: ForceLayoutOptions;

  private scheduleHandle?: number;

  private scheduleRestart = false;

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
      .distance((d) => {
        let distance =
          this.options.linkDistance +
          (d.source as D3Node).getRadius() +
          (d.target as D3Node).getRadius();

        if ((d.source as D3Node).element.getParent() !== (d.target as D3Node).element.getParent()) {
          // find the group padding
          distance += getGroupPadding((d.source as D3Node).element.getParent());
          distance += getGroupPadding((d.target as D3Node).element.getParent());
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

  @action
  private runLayout(initialRun: boolean, restart = true): void {
    const leafNodes = leafNodeElements(this.graph.getNodes());

    // create datum
    const groups = groupNodeElements(this.graph.getNodes());
    const nodes = leafNodes.map((n) => new D3Node(n));
    const edges = this.graph
      .getEdges()
      .filter(
        (e) =>
          nodes.find((n) => n.id === e.getSource().getId()) &&
          nodes.find((n) => n.id === e.getTarget().getId()),
      )
      .map((e) => new D3Link(e));

    // remove bendpoinits
    edges.forEach((e) => {
      if (e.element.getBendpoints().length > 0) {
        e.element.setBendpoints([]);
      }
    });

    // Create faux edges for the grouped nodes to form group clusters
    groups.forEach((group: Node) => {
      const groupNodes = group.getNodes().filter((node: Node) => !_.size(node.getNodes()));
      for (let i = 0; i < groupNodes.length; i++) {
        for (let j = i + 1; j < groupNodes.length; j++) {
          const fauxEdge = new BaseEdge();
          fauxEdge.setSource(groupNodes[i]);
          fauxEdge.setTarget(groupNodes[j]);
          fauxEdge.setController(groupNodes[i].getController());
          edges.push(new D3Link(fauxEdge));
        }
      }
    });

    if (initialRun) {
      // force center
      const cx = this.graph.getBounds().width / 2;
      const cy = this.graph.getBounds().height / 2;

      _.forEach(nodes, (node: D3Node) => {
        node.setPosition(cx, cy);
      });
      this.simulation.force('center', d3.forceCenter(cx, cy));
      this.simulation.alpha(1);
    } else if (restart && this.simulation.alpha() < 0.2) {
      this.simulation.alpha(0.2);
    }

    // first remove the links so that the layout doesn't error
    this.forceLink.links([]);
    // next set the new nodes
    this.simulation.nodes(nodes);
    // fonally set the new links
    this.forceLink.links(edges);
    if (initialRun || restart) {
      // start
      this.simulation.restart();
    }
  }
}
