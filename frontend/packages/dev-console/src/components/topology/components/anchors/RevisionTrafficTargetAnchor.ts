import { AbstractAnchor, getEllipseAnchorPoint, Node, Point } from '@console/topology';

export default class RevisionTrafficTargetAnchor extends AbstractAnchor {
  private radius: number;

  private offset: number;

  constructor(node: Node, radius: number) {
    super(node);
    this.radius = radius;
    // TODO align sizing with WorkloadNode
    this.offset = radius * 0.7;
  }

  getLocation(reference: Point): Point {
    const bounds = this.getOwner().getBounds();
    if (this.radius) {
      // location is edge of decorator
      const center = new Point(bounds.right() - this.offset, bounds.y + this.offset);
      const size = this.radius * 2;
      return getEllipseAnchorPoint(center, size, size, reference);
    }

    // location is edge of outer node
    return getEllipseAnchorPoint(bounds.getCenter(), bounds.width, bounds.height, reference);
  }

  getReferencePoint(): Point {
    const bounds = this.getOwner().getBounds();
    if (this.radius) {
      // reference point is center of decorator
      return new Point(bounds.right() - this.offset, bounds.y + this.offset);
    }
    // reference point is center of node
    return bounds.getCenter();
  }
}
