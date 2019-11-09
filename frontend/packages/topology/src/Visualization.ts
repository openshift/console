import { ComponentType } from 'react';
import { action, observable } from 'mobx';
import * as _ from 'lodash';
import {
  Controller,
  Graph,
  Edge,
  Node,
  ComponentFactory,
  GraphElement,
  ElementFactory,
  ElementModel,
  isEdge,
  isNode,
  Model,
  EventListener,
  ModelKind,
  LayoutFactory,
  Layout,
  isGraph,
  ADD_ELEMENT_EVENT,
  REMOVE_ELEMENT_EVENT,
} from './types';
import defaultElementFactory from './elements/defaultElementFactory';
import Stateful from './utils/Stateful';

export default class Visualization extends Stateful implements Controller {
  @observable.shallow
  elements: { [id: string]: GraphElement } = {};

  @observable.ref
  private graph?: Graph;

  private layoutFactories: LayoutFactory[] = [];

  private componentFactories: ComponentFactory[] = [];

  private elementFactories: ElementFactory[] = [defaultElementFactory];

  private eventListeners: { [type: string]: EventListener[] } = {};

  @observable.shallow
  private readonly store = {};

  private batching = false;

  private addedElements: GraphElement[] = [];

  private removedElements: GraphElement[] = [];

  getStore<S = {}>(): S {
    return this.store as S;
  }

  @action
  fromModel(model: Model): void {
    this.batching = true;
    // create elements
    if (model.graph) {
      this.graph = this.createElement<Graph>(ModelKind.graph, model.graph);
    }
    const validIds: string[] = [];

    const idToElement: { [id: string]: ElementModel } = {};

    model.nodes &&
      model.nodes.forEach((n) => {
        idToElement[n.id] = n;
        this.createElement<Node>(ModelKind.node, n);
        validIds.push(n.id);
      });

    model.edges &&
      model.edges.forEach((e) => {
        idToElement[e.id] = e;
        this.createElement<Edge>(ModelKind.edge, e);
        validIds.push(e.id);
      });

    // merge data
    if (model.graph && this.graph) {
      this.graph.setModel(model.graph);
    }

    const processed: { [id: string]: boolean } = {};

    // process bottom up
    const processElement = (element: ElementModel): void => {
      if (element.children) {
        element.children.forEach((id) => processElement(idToElement[id]));
      }
      if (!processed[element.id]) {
        processed[element.id] = true;
        this.elements[element.id].setModel(element);
      }
    };

    model.nodes && model.nodes.forEach(processElement);
    model.edges && model.edges.forEach(processElement);

    // remove all stale elements
    _.forIn(this.elements, (element) => {
      if (!isGraph(element) && !validIds.includes(element.getId())) {
        this.removeElement(element);
      }
    });

    if (this.graph) {
      this.parentOrphansToGraph(this.graph);
    }

    this.batching = false;

    // notify additions and removals
    // capture batching data locally just incase we re-enter here
    let removed: GraphElement[] | undefined;
    let added: GraphElement[] | undefined;

    if (this.removedElements.length) {
      removed = this.removedElements;
      this.removedElements = [];
    }
    if (this.addedElements.length) {
      added = this.addedElements;
      this.addedElements = [];
    }

    removed && this.fireEvent(REMOVE_ELEMENT_EVENT, removed);
    added && this.fireEvent(ADD_ELEMENT_EVENT, added);
  }

  getGraph(): Graph {
    if (!this.graph) {
      throw new Error('Graph has not been set.');
    }
    return this.graph;
  }

  @action
  setGraph(graph: Graph) {
    if (this.graph !== graph) {
      if (this.graph) {
        this.graph.setController(undefined);
      }
      this.graph = graph;
      graph.setController(this);
      // TODO clean up and populate registries
    }
  }

  getElements(): GraphElement[] {
    return _.values(this.elements);
  }

  addElement(element: GraphElement): void {
    if (this.elements[element.getId()]) {
      throw new Error(`Duplicate element for ID '${element.getId()}`);
    }
    element.setController(this);
    this.elements[element.getId()] = element;

    if (this.batching) {
      this.addedElements.push(element);
    } else {
      this.fireEvent(ADD_ELEMENT_EVENT, [element]);
    }
  }

  removeElement(element: GraphElement): void {
    if (this.elements[element.getId()]) {
      element.remove();
      // unparent all of the element's children such that they can be reparented
      element
        .getChildren()
        .slice()
        .forEach((child) => child.remove());
      element.setController(undefined);
      delete this.elements[element.getId()];

      if (this.batching) {
        this.removedElements.push(element);
      } else {
        this.fireEvent(REMOVE_ELEMENT_EVENT, [element]);
      }
    }
  }

  getElementById(id: string): GraphElement | undefined {
    return this.elements[id];
  }

  getNodeById(id: string): Node | undefined {
    const node = this.elements[id];
    if (node && isNode(node)) {
      return node;
    }
    return undefined;
  }

  getEdgeById(id: string): Edge | undefined {
    const edge = this.elements[id];
    if (edge && isEdge(edge)) {
      return edge;
    }
    return undefined;
  }

  getComponent(kind: ModelKind, type: string): ComponentType<{ element: GraphElement }> {
    for (const factory of this.componentFactories) {
      const component = factory(kind, type);
      if (component) {
        return component;
      }
    }
    throw new Error(`Could not find component for: Kind '${kind}', Type '${type}'`);
  }

  registerLayoutFactory(factory: LayoutFactory) {
    this.layoutFactories.unshift(factory);
  }

  getLayout(type: string): Layout | undefined {
    for (const factory of this.layoutFactories) {
      const layout = factory(type, this.getGraph());
      if (layout) {
        return layout;
      }
    }
    throw new Error(`Could not find layout for type: ${type}`);
  }

  registerComponentFactory(factory: ComponentFactory) {
    this.componentFactories.unshift(factory);
  }

  registerElementFactory(factory: ElementFactory): void {
    this.elementFactories.unshift(factory);
  }

  addEventListener<L extends EventListener = EventListener>(type: string, listener: L): Controller {
    if (!this.eventListeners[type]) {
      this.eventListeners[type] = [listener];
    } else {
      this.eventListeners[type].push(listener);
    }
    return this;
  }

  removeEventListener(type: string, listener: EventListener): Controller {
    if (!this.eventListeners[type]) {
      return this;
    }
    const listeners = this.eventListeners[type];
    const l: EventListener[] = [];
    for (let i = 0, { length } = listeners; i < length; i++) {
      if (listeners[i] !== listener) {
        l.push(listeners[i]);
      }
    }
    if (l.length) {
      this.eventListeners[type] = l;
    } else {
      delete this.eventListeners[type];
    }
    return this;
  }

  fireEvent(type: string, ...args: any): void {
    const listeners = this.eventListeners[type];
    if (listeners) {
      for (let i = 0, { length } = listeners; i < length; i++) {
        listeners[i](...args);
      }
    }
  }

  private createElement<E extends GraphElement>(kind: ModelKind, elementModel: ElementModel): E {
    const existingElement = this.elements[elementModel.id];
    if (existingElement) {
      return existingElement as E;
    }
    for (const factory of this.elementFactories) {
      const element = factory(kind, elementModel.type);
      if (element) {
        this.initElement(element, elementModel);
        // cast to return type
        return element as E;
      }
    }
    throw new Error(`Could not create element for: ${JSON.stringify(elementModel)}`);
  }

  private initElement(element: GraphElement, model: ElementModel): void {
    // set require fields
    element.setId(model.id);
    element.setType(model.type);
    element.setController(this);
    this.addElement(element);
  }

  private parentOrphansToGraph(graph: Graph): void {
    this.getElements().forEach((element: GraphElement) => {
      if (element !== this.graph && !element.hasParent()) {
        graph.appendChild(element);
      }
    });
  }
}
