import { AbstractAnchor, Point } from '@patternfly/react-topology';

export default class EventSinkTargetAnchor extends AbstractAnchor {
  getLocation(): Point {
    return this.getReferencePoint();
  }

  getReferencePoint(): Point {
    const bounds = this.owner.getBounds();
    return new Point(bounds.x, bounds.y + bounds.height / 2);
  }
}
