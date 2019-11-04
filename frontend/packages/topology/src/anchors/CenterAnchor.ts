import Point from '../geom/Point';
import AbstractAnchor from './AbstractAnchor';

export default class CenterAnchor extends AbstractAnchor {
  getLocation(): Point {
    return this.getOwner()
      .getBounds()
      .getCenter();
  }
}
