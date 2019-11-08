import { Node, Point, Rect } from '@console/topology';
import RevisionTrafficTargetAnchor from '../RevisionTrafficTargetAnchor';

function createMockNode(bounds: Rect): Node {
  return ({
    getBounds: () => bounds,
  } as any) as Node;
}

describe('RevisionTrafficTargetAnchor', () => {
  it('should return the center of decorator as reference point', () => {
    const anchor = new RevisionTrafficTargetAnchor(createMockNode(new Rect(50, 30, 80, 40)), 10);
    expect(anchor.getReferencePoint()).toEqual({ x: 123, y: 37 });
  });

  it('should return the center of node as reference point', () => {
    const anchor = new RevisionTrafficTargetAnchor(createMockNode(new Rect(50, 30, 80, 40)), 0);
    expect(anchor.getReferencePoint()).toEqual({ x: 90, y: 50 });
  });

  it('should return a decorator radius based anchor location', () => {
    const anchor = new RevisionTrafficTargetAnchor(createMockNode(new Rect(10, 20, 130, 140)), 10);
    const loc = anchor.getLocation(new Point(50, 60));
    expect(loc.x).toBeCloseTo(123.71);
    expect(loc.y).toBeCloseTo(30.69);
  });

  it('should return the outer edge as anchor location', () => {
    const anchor = new RevisionTrafficTargetAnchor(createMockNode(new Rect(10, 20, 130, 140)), 0);
    const loc = anchor.getLocation(new Point(50, 60));
    expect(loc.x).toBeCloseTo(31.59);
    expect(loc.y).toBeCloseTo(37.9);
  });
});
