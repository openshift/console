import { observable, computed } from 'mobx';
import {
  Node,
  Anchor,
  NodeModel,
  ModelKind,
  isNode,
  AnchorEnd,
  GroupStyle,
  NodeShape,
  Edge,
} from '../types';
import CenterAnchor from '../anchors/CenterAnchor';
import Rect from '../geom/Rect';
import { Translatable } from '../geom/types';
import BaseElement from './BaseElement';

const createAnchorKey = (end: AnchorEnd = AnchorEnd.both, type: string = ''): string =>
  `${end}:${type}`;

export default class BaseNode<E extends NodeModel = NodeModel, D = any> extends BaseElement<E, D>
  implements Node<E, D> {
  @observable.shallow
  private anchors: { [type: string]: Anchor } = {
    [createAnchorKey()]: new CenterAnchor(this),
  };

  @observable.ref
  private bounds: Rect = new Rect();

  @computed
  private get nodes(): Node[] {
    return this.getChildren().filter(isNode);
  }

  @observable
  private group = false;

  @observable
  private shape: NodeShape | undefined;

  @computed
  private get groupBounds(): Rect {
    const children = this.getChildren().filter(isNode);
    if (!children.length) {
      return this.bounds;
    }

    let rect: Rect | undefined;
    children.forEach((c) => {
      if (isNode(c)) {
        const b = c.getBounds();
        if (!rect) {
          rect = b.clone();
        } else {
          rect.union(b);
        }
      }
    });

    if (!rect) {
      rect = new Rect();
    }

    const { padding } = this.getStyle<GroupStyle>();
    const result = rect.padding(padding);

    // ensure size is at least the size of the set bounds
    result.setSize(
      Math.max(result.width, this.bounds.width),
      Math.max(result.height, this.bounds.height),
    );

    return result;
  }

  @computed
  private get sourceEdges(): Edge[] {
    return this.getGraph()
      .getEdges()
      .filter((e) => e.getSource() === this);
  }

  @computed
  private get targetEdges(): Edge[] {
    return this.getGraph()
      .getEdges()
      .filter((e) => e.getTarget() === this);
  }

  getKind(): ModelKind {
    return ModelKind.node;
  }

  getBounds(): Rect {
    return this.group ? this.groupBounds : this.bounds;
  }

  setBounds(bounds: Rect): void {
    if (!this.bounds.equals(bounds)) {
      this.bounds = bounds;
    }
  }

  getAnchor(end?: AnchorEnd, type?: string): Anchor {
    let anchor = this.anchors[createAnchorKey(end, type)];
    if (!anchor && type) {
      anchor = this.anchors[createAnchorKey(end)];
    }
    if (!anchor && (end === AnchorEnd.source || end === AnchorEnd.target)) {
      anchor = this.anchors[createAnchorKey(AnchorEnd.both, type)];
      if (!anchor && type) {
        anchor = this.anchors[createAnchorKey(AnchorEnd.both)];
      }
    }
    return anchor;
  }

  setAnchor(anchor: Anchor, end?: AnchorEnd, type?: string): void {
    const key = createAnchorKey(end, type);
    if (anchor) {
      this.anchors[key] = anchor;
    } else {
      delete this.anchors[key];
    }
  }

  getNodes(): Node[] {
    return this.nodes;
  }

  isGroup(): boolean {
    return this.group;
  }

  getNodeShape(): NodeShape {
    return this.shape || (this.group ? NodeShape.rect : NodeShape.circle);
  }

  setNodeShape(shape: NodeShape): void {
    this.shape = shape;
  }

  getSourceEdges(): Edge[] {
    return this.sourceEdges;
  }

  getTargetEdges(): Edge[] {
    return this.targetEdges;
  }

  setModel(model: E): void {
    super.setModel(model);
    const bounds = this.getBounds();
    let r: Rect | undefined;

    // update width and height before position
    if ('width' in model && model.width != null) {
      if (!r) {
        r = bounds.clone();
      }
      r.width = model.width;
    }
    if ('height' in model && model.height != null) {
      if (!r) {
        r = bounds.clone();
      }
      r.height = model.height;
    }
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
    if ('group' in model) {
      this.group = !!model.group;
    }
    if ('shape' in model) {
      this.shape = model.shape;
    }
  }

  translateToParent(t: Translatable): void {
    if (!this.group) {
      const { x, y } = this.getBounds();
      t.translate(x, y);
    }
  }

  translateFromParent(t: Translatable): void {
    if (!this.group) {
      const { x, y } = this.getBounds();
      t.translate(-x, -y);
    }
  }
}
