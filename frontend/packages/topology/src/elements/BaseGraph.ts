import { computed, observable } from 'mobx';
import Rect from '../geom/Rect';
import Point from '../geom/Point';
import { Graph, Edge, Node, GraphModel, ModelKind, isNode, isEdge, Layout } from '../types';
import BaseElement from './BaseElement';

export default class BaseGraph<E extends GraphModel = GraphModel, D = any> extends BaseElement<E, D>
  implements Graph<E, D> {
  @observable
  private scale: number = 1;

  @observable
  private layoutType?: string;

  @observable.ref
  private bounds: Rect = new Rect();

  private currentLayout?: Layout;

  isDetached(): boolean {
    return !this.getController();
  }

  @computed
  private get edges(): Edge[] {
    return this.getChildren().filter(isEdge);
  }

  @computed
  private get nodes(): Node[] {
    return this.getChildren().filter(isNode);
  }

  getKind(): ModelKind {
    return ModelKind.graph;
  }

  getBounds(): Rect {
    return this.bounds;
  }

  setBounds(bounds: Rect): void {
    if (!this.bounds.equals(bounds)) {
      this.bounds = bounds;
    }
  }

  getNodes(): Node[] {
    return this.nodes;
  }

  getEdges(): Edge[] {
    return this.edges;
  }

  getLayout(): string | undefined {
    return this.layoutType;
  }

  setLayout(layout: string | undefined): void {
    if (layout === this.layoutType) {
      return;
    }

    if (this.currentLayout) {
      this.currentLayout.destroy();
    }

    this.layoutType = layout;
    this.currentLayout = layout ? this.getController().getLayout(layout) : undefined;
  }

  layout(): void {
    if (this.currentLayout) {
      this.currentLayout.layout();
    }
  }

  getScale(): number {
    return this.scale;
  }

  setScale(scale: number): void {
    this.scale = scale;
  }

  reset(): void {
    this.scale = 1;
    this.getBounds().setLocation(0, 0);
  }

  scaleBy(scale: number, location?: Point): void {
    const b = this.getBounds();
    let { x, y } = b;
    const c = location || b.getCenter().translate(-x, -y);
    x = (c.x - x) / this.scale;
    y = (c.y - y) / this.scale;
    this.scale *= scale;
    x = c.x - x * this.scale;
    y = c.y - y * this.scale;
    this.setBounds(b.clone().setLocation(x, y));
  }

  fit(padding = 0): void {
    let rect: Rect | undefined;
    this.getNodes().forEach((c) => {
      const b = c.getBounds();
      if (!rect) {
        rect = b.clone();
      } else {
        rect.union(b);
      }
    });
    if (!rect) {
      return;
    }

    const { width, height } = rect;

    if (width === 0 || height === 0) {
      return;
    }

    const { width: fullWidth, height: fullHeight } = this.getBounds();
    const midX = rect.x + width / 2;
    const midY = rect.y + height / 2;

    // set the max scale to be the current zoom level or 1
    const maxScale = Math.max(this.getScale(), 1);

    // compute the scale
    const scale = Math.min(
      1 /
        Math.max(
          width / Math.max(1, fullWidth - padding),
          height / Math.max(1, fullHeight - padding),
        ),
      maxScale,
    );

    // translate to center
    const tx = fullWidth / 2 - midX * scale;
    const ty = fullHeight / 2 - midY * scale;

    // TODO should scale and bound be kept in a single geom Transform object instead of separately?
    this.setScale(scale);
    this.setBounds(
      this.getBounds()
        .clone()
        .setLocation(tx, ty),
    );
  }

  panIntoView = (nodeElement: Node, { offset = 0, minimumVisible = 0 }): void => {
    if (!nodeElement) {
      return;
    }
    const { x: viewX, y: viewY, width: viewWidth, height: viewHeight } = this.getBounds();
    const boundingBox = nodeElement
      .getBounds()
      .clone()
      .scale(this.scale)
      .translate(viewX, viewY);
    const { x, y, width, height } = boundingBox;
    let move = false;
    const panOffset = offset * this.scale;
    const minVisibleSize = minimumVisible * this.scale;

    const newLocation = {
      x: viewX,
      y: viewY,
    };

    if (x + width - minVisibleSize < 0) {
      newLocation.x -= x - panOffset;
      move = true;
    }
    if (x + minVisibleSize > viewWidth) {
      newLocation.x -= x + width - viewWidth + panOffset;
      move = true;
    }
    if (y + height - minVisibleSize < 0) {
      newLocation.y -= y - panOffset;
      move = true;
    }
    if (y + minVisibleSize > viewHeight) {
      newLocation.y -= y + height - viewHeight + panOffset;
      move = true;
    }

    if (move) {
      this.setBounds(new Rect(newLocation.x, newLocation.y, viewWidth, viewHeight));
    }
  };

  setModel(model: E): void {
    super.setModel(model);

    if ('layout' in model) {
      this.setLayout(model.layout);
    }
    if ('scale' in model && typeof model.scale === 'number') {
      this.scale = +model.scale;
    }
    const bounds = this.getBounds();
    let r: Rect | undefined;
    if ('x' in model && model.x != null) {
      if (!r) {
        r = bounds.clone();
      }
      r.x = model.x;
    }
    if ('y' in model && model.y != null) {
      if (!r) {
        r = bounds.clone();
      }
      r.y = model.y;
    }
    if (r) {
      this.setBounds(r);
    }
  }

  translateToAbsolute(): void {
    // do nothing
  }

  translateFromAbsolute(): void {
    // do nothing
  }
}
