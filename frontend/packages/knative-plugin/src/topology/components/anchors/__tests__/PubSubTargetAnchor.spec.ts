import { Node, Point, Rect, Anchor } from '@patternfly/react-topology';
import PubSubTargetAnchor from '../PubSubTargetAnchor';
import { EVENT_MARKER_RADIUS } from '../../../const';

function createMockNode(bounds: Rect): Node {
  return ({
    getBounds: () => bounds,
  } as any) as Node;
}

describe('PubSubTargetAnchor', () => {
  it('should return the middle left as the reference point', () => {
    const anchor = new PubSubTargetAnchor(createMockNode(new Rect(50, 30, 80, 40)), 0);
    expect(anchor.getReferencePoint()).toEqual({ x: 50 - EVENT_MARKER_RADIUS, y: 50 });
  });

  it('should return the middle left as the anchor location', () => {
    // downcast to Anchor because subclass omits param in function
    const anchor: Anchor = new PubSubTargetAnchor(createMockNode(new Rect(10, 20, 130, 140)), 0);
    expect(anchor.getLocation(new Point(50, 60))).toEqual({ x: 10 - EVENT_MARKER_RADIUS, y: 90 });
  });
});
