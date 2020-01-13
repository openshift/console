import Point from '../geom/Point';
import { getEllipseAnchorPoint } from '../utils/anchor-utils';
import AbstractAnchor from './AbstractAnchor';

export default class EllipseAnchor extends AbstractAnchor {
  getLocation(reference: Point): Point {
    const r = this.getOwner().getBounds();
    if (r.isEmpty()) {
      return r.getCenter();
    }

    return getEllipseAnchorPoint(
      r.getCenter(),
      r.width + this.offset,
      r.height + this.offset,
      reference,
    );
  }
}
