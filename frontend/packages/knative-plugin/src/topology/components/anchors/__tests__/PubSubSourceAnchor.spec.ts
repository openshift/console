import { Node, Point, Rect, Anchor } from '@patternfly/react-topology';
import PubSubSourceAnchor from '../PubSubSourceAnchor';

function createMockNode(bounds: Rect): Node {
  return ({
    getBounds: () => bounds,
  } as any) as Node;
}

describe('PubSubSourceAnchor', () => {
  it('should return the middle right as the reference point', () => {
    const anchor = new PubSubSourceAnchor(createMockNode(new Rect(50, 30, 80, 40)), 0);
    expect(anchor.getReferencePoint()).toEqual({ x: 130, y: 50 });
  });

  it('should return the middle right as the anchor location', () => {
    // downcast to Anchor because subclass omits param in function
    const anchor: Anchor = new PubSubSourceAnchor(createMockNode(new Rect(10, 20, 130, 140)), 0);
    expect(anchor.getLocation(new Point(50, 60))).toEqual({ x: 140, y: 90 });
  });
});
