import { AbstractAnchor, getEllipseAnchorPoint, Node, Point } from '@console/topology';

export default class RevisionTrafficSourceAnchor extends AbstractAnchor {
  private radius: number;

  constructor(node: Node, radius: number) {
    super(node);
    this.radius = radius;
  }

  getLocation(reference: Point): Point {
    const bounds = this.owner.getBounds();
    // center point is top right corner
    const center = new Point(bounds.right(), bounds.y);
    if (this.radius) {
      // location is edge of decorator
      const size = this.radius * 2;
      return getEllipseAnchorPoint(center, size, size, reference);
    }

    // location is center of node
    return center;
  }

  getReferencePoint(): Point {
    const bounds = this.owner.getBounds();
    // reference point is top right corner of node
    return new Point(bounds.right(), bounds.y);
  }
}
