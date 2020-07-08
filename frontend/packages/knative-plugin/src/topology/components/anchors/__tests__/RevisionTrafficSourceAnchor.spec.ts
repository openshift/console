import { Node, Point, Rect } from '@patternfly/react-topology';
import RevisionTrafficSourceAnchor from '../RevisionTrafficSourceAnchor';

function createMockNode(bounds: Rect): Node {
  return ({
    getBounds: () => bounds,
  } as any) as Node;
}

describe('RevisionTrafficSourceAnchor', () => {
  it('should return the top right corner as reference point', () => {
    const anchor = new RevisionTrafficSourceAnchor(createMockNode(new Rect(50, 30, 80, 40)), 0);
    expect(anchor.getReferencePoint()).toEqual({ x: 130, y: 30 });
  });

  it('should return a radius based anchor location', () => {
    const anchor = new RevisionTrafficSourceAnchor(createMockNode(new Rect(10, 20, 130, 140)), 10);
    const loc = anchor.getLocation(new Point(50, 60));
    expect(loc.x).toBeCloseTo(130.86);
    expect(loc.y).toBeCloseTo(24.06);
  });

  it('should return the top right corner as anchor location', () => {
    const anchor = new RevisionTrafficSourceAnchor(createMockNode(new Rect(10, 20, 130, 140)), 0);
    expect(anchor.getLocation(new Point(50, 60))).toEqual({ x: 140, y: 20 });
  });
});
