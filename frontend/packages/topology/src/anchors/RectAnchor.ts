import Point from '../geom/Point';
import { getRectAnchorPoint } from '../utils/anchor-utils';
import AbstractAnchor from './AbstractAnchor';

export default class RectAnchor extends AbstractAnchor {
  getLocation(reference: Point): Point {
    const r = this.getOwner().getBounds();
    const center = r.getCenter();
    if (r.isEmpty()) {
      return center;
    }

    return getRectAnchorPoint(center, r.width, r.height, reference);
  }
}
