import Point from '../geom/Point';
import { Anchor, Node } from '../types';

export default abstract class AbstractAnchor<E extends Node = Node> implements Anchor {
  private owner: E;

  protected offset = 0;

  constructor(owner: E, offset: number = 0) {
    this.owner = owner;
    this.offset = offset;
  }

  protected getOwner(): E {
    return this.owner;
  }

  abstract getLocation(reference: Point): Point;

  getReferencePoint(): Point {
    return this.owner.getBounds().getCenter();
  }
}
