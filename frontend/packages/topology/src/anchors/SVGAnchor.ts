import { observable } from 'mobx';
import Point from '../geom/Point';
import {
  getEllipseAnchorPoint,
  getPathAnchorPoint,
  getPolygonAnchorPoint,
  getRectAnchorPoint,
} from '../utils/anchor-utils';
import AbstractAnchor from './AbstractAnchor';

export default class SVGAnchor extends AbstractAnchor {
  @observable.ref
  private svgElement?: SVGElement;

  setSVGElement(svgElement: SVGElement) {
    this.svgElement = svgElement;
  }

  getCircleLocation(circle: SVGCircleElement, reference: Point): Point {
    const center: Point = new Point(circle.cx.baseVal.value, circle.cy.baseVal.value);
    this.getOwner().translateToParent(center);
    const diameter = circle.r.baseVal.value * 2 + this.offset;

    return getEllipseAnchorPoint(center, diameter, diameter, reference);
  }

  getEllipseLocation(ellipse: SVGEllipseElement, reference: Point): Point {
    const center: Point = new Point(ellipse.cx.baseVal.value, ellipse.cy.baseVal.value);
    this.getOwner().translateToParent(center);
    const width = ellipse.rx.baseVal.value * 2 + this.offset;
    const height = ellipse.ry.baseVal.value * 2 + this.offset;

    return getEllipseAnchorPoint(center, width, height, reference);
  }

  getRectLocation(rect: SVGRectElement, reference: Point): Point {
    const width = rect.width.baseVal.value;
    const height = rect.height.baseVal.value;

    const center: Point = new Point(
      rect.x.baseVal.value + width / 2,
      rect.y.baseVal.value + height / 2,
    );
    this.getOwner().translateToParent(center);

    return getRectAnchorPoint(center, width + this.offset, height + this.offset, reference);
  }

  getPathLocation(path: SVGPathElement, reference: Point): Point {
    const translatedRef = reference.clone();
    this.getOwner().translateFromParent(translatedRef);
    const anchorPoint = getPathAnchorPoint(path, translatedRef);
    this.getOwner().translateToParent(anchorPoint);
    return anchorPoint;
  }

  getPolygonLocation(polygon: SVGPolygonElement, reference: Point): Point {
    const translatedRef = reference.clone();
    this.getOwner().translateFromParent(translatedRef);
    const anchorPoint = getPolygonAnchorPoint(polygon, translatedRef);
    this.getOwner().translateToParent(anchorPoint);
    return anchorPoint;
  }

  getLocation(reference: Point): Point {
    if (this.svgElement instanceof SVGCircleElement) {
      return this.getCircleLocation(this.svgElement, reference);
    }

    if (this.svgElement instanceof SVGEllipseElement) {
      return this.getEllipseLocation(this.svgElement, reference);
    }

    if (this.svgElement instanceof SVGRectElement) {
      return this.getRectLocation(this.svgElement, reference);
    }

    if (this.svgElement instanceof SVGPathElement) {
      return this.getPathLocation(this.svgElement, reference);
    }

    if (this.svgElement instanceof SVGPolygonElement) {
      return this.getPolygonLocation(this.svgElement, reference);
    }

    return this.getOwner()
      .getBounds()
      .getCenter();
  }

  getReferencePoint(): Point {
    if (
      this.svgElement instanceof SVGCircleElement ||
      this.svgElement instanceof SVGEllipseElement ||
      this.svgElement instanceof SVGRectElement ||
      this.svgElement instanceof SVGPathElement ||
      this.svgElement instanceof SVGPolygonElement
    ) {
      const bbox = this.svgElement.getBBox();
      const ref = new Point(bbox.x + bbox.width / 2, bbox.y + bbox.height / 2);

      // this touches the bounds for non-groups
      this.getOwner().translateToParent(ref);

      // touch the bounds to force a re-render in case this anchor is for a group
      this.getOwner().getBounds();

      return ref;
    }

    return super.getReferencePoint();
  }
}
