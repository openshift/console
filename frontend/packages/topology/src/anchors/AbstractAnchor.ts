import Point from '../geom/Point';
import { Anchor, Node } from '../types';

export default abstract class AbstractAnchor<E extends Node = Node> implements Anchor<E> {
  private owner: Node;

  constructor(owner: Node) {
    this.owner = owner;
  }

  protected getOwner(): Node {
    return this.owner;
  }

  abstract getLocation(reference: Point): Point;

  getReferencePoint(): Point {
    return this.owner.getBounds().getCenter();
  }
}
