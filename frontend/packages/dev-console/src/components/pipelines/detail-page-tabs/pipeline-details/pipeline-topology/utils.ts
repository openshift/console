import { Point } from '@console/topology';

const leftRight = (p1: Point, p2: Point) => p1.x < p2.x;
const topDown = (p1: Point, p2: Point) => p1.y < p2.y;
const bottomUp = (p1: Point, p2: Point) => p1.y > p2.y;

const point = (p: Point) => `${p.x},${p.y}`;
const moveTo = (p: Point) => `M ${point(p)}`;
const lineTo = (p: Point) => `L ${point(p)}`;
const quadTo = (corner: Point, end: Point) => `Q ${point(corner)} ${point(end)}`;

const GAP = 15;

const curve = (fromPoint: Point, cornerPoint: Point, toPoint: Point): string => {
  const points = [];

  const topToBottom = topDown(fromPoint, toPoint);
  if (topToBottom) {
    const rightAndDown = leftRight(fromPoint, cornerPoint) && topDown(cornerPoint, toPoint);
    const downAndRight = topDown(fromPoint, cornerPoint) && leftRight(cornerPoint, toPoint);
    if (rightAndDown) {
      points.push(
        lineTo(cornerPoint.clone().translate(-GAP, 0)),
        quadTo(cornerPoint, cornerPoint.clone().translate(0, GAP)),
      );
    } else if (downAndRight) {
      points.push(
        lineTo(cornerPoint.clone().translate(0, -GAP)),
        quadTo(cornerPoint, cornerPoint.clone().translate(GAP, 0)),
      );
    }
  } else {
    const rightAndUp = leftRight(fromPoint, cornerPoint) && bottomUp(cornerPoint, toPoint);
    const upAndRight = bottomUp(fromPoint, cornerPoint) && leftRight(cornerPoint, toPoint);
    if (rightAndUp) {
      points.push(
        lineTo(cornerPoint.clone().translate(-GAP, 0)),
        quadTo(cornerPoint, cornerPoint.clone().translate(0, -GAP)),
      );
    } else if (upAndRight) {
      points.push(
        lineTo(cornerPoint.clone().translate(0, GAP)),
        quadTo(cornerPoint, cornerPoint.clone().translate(GAP, 0)),
      );
    }
  }

  return points.join(' ');
};

export const path = (start: Point, finish: Point) => {
  const linePoints = [];

  linePoints.push(moveTo(start));
  if (start.y !== finish.y) {
    // Different levels of ending points, bend to the level
    const midX = Math.floor(start.x + Math.abs(finish.x - start.x) / 2);
    const corner1 = new Point(midX, start.y);
    const corner2 = new Point(midX, finish.y);

    linePoints.push(curve(start, corner1, corner2));
    linePoints.push(curve(corner1, corner2, finish));
  }
  linePoints.push(lineTo(finish));

  return linePoints.join(' ');
};
