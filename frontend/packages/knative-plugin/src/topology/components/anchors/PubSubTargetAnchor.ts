import { AbstractAnchor, Point } from '@console/topology';
import { EVENT_MARKER_RADIUS } from '../../const';

export default class PubSubAnchor extends AbstractAnchor {
  getLocation(): Point {
    return this.getReferencePoint();
  }

  getReferencePoint(): Point {
    const bounds = this.owner.getBounds();
    return new Point(bounds.x - EVENT_MARKER_RADIUS, bounds.y + bounds.height / 2);
  }
}
