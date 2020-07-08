import { AbstractAnchor, Point } from '@patternfly/react-topology';

export default class PubSubAnchor extends AbstractAnchor {
  getLocation(): Point {
    return this.getReferencePoint();
  }

  getReferencePoint(): Point {
    const bounds = this.owner.getBounds();
    return new Point(bounds.right(), bounds.y + bounds.height / 2);
  }
}
