export function createSvgIdUrl(id: string): string {
  return `url(${`${window.location.pathname}${window.location.search}`}#${id})`;
}

export type Point = [number, number];
export type HullPaddingGetter = (point: Point) => number;

// Returns the vector 'v' scaled by 'scale'.
function vecScale(scale: number, v: Point): Point {
  return [scale * v[0], scale * v[1]];
}

// Returns the sum of two vectors, or a combination of a point and a vector.
function vecSum(pv1: Point, pv2: Point): Point {
  return [pv1[0] + pv2[0], pv1[1] + pv2[1]];
}

// Returns the unit normal to the line segment from p0 to p1.
function unitNormal(p0: Point, p1: Point): Point {
  const n = [p0[1] - p1[1], p1[0] - p0[0]];
  const nLength = Math.sqrt(n[0] * n[0] + n[1] * n[1]);
  return [n[0] / nLength, n[1] / nLength];
}

// Returns the path for a rounded hull around a single point (a circle).
function roundedHull1(polyPoints: Point[], hp: HullPaddingGetter): string {
  const padding = hp(polyPoints[0]);
  const p1 = [polyPoints[0][0], polyPoints[0][1] - padding];
  const p2 = [polyPoints[0][0], polyPoints[0][1] + padding];

  return `M ${p1} A ${padding},${padding},0,0,0,${p2} A ${padding},${padding},0,0,0,${p1}`;
}

// Returns the path for a rounded hull around two points (a "capsule" shape).
function roundedHull2(polyPoints: Point[], hp: HullPaddingGetter): string {
  const offsetVector1 = vecScale(hp(polyPoints[0]), unitNormal(polyPoints[0], polyPoints[1]));
  const invOffsetVector1 = vecScale(-1, offsetVector1);

  const offsetVector2 = vecScale(hp(polyPoints[1]), unitNormal(polyPoints[0], polyPoints[1]));
  const invOffsetVector2 = vecScale(-1, offsetVector2);

  const p0 = vecSum(polyPoints[0], offsetVector1);
  const p1 = vecSum(polyPoints[1], offsetVector2);
  const p2 = vecSum(polyPoints[1], invOffsetVector2);
  const p3 = vecSum(polyPoints[0], invOffsetVector1);

  return `M ${p0} L ${p1} A ${hp(polyPoints[1])},${hp(polyPoints[1])},0,0,0,${p2} L ${p3} A ${hp(
    polyPoints[0],
  )},${hp(polyPoints[0])},0,0,0,${p0}`;
}

// Returns the SVG path data string representing the polygon, expanded and rounded.
export function hullPath(polyPoints: Point[], hullPadding: number | HullPaddingGetter = 0): string {
  const hp = typeof hullPadding === 'number' ? () => hullPadding : hullPadding;

  // Handle special cases
  if (!polyPoints || polyPoints.length < 1) {
    return '';
  }
  if (polyPoints.length === 1) {
    return roundedHull1(polyPoints, hp);
  }
  if (polyPoints.length === 2) {
    return roundedHull2(polyPoints, hp);
  }

  const segments: Point[][] = new Array(polyPoints.length);

  // Calculate each offset (outwards) segment of the convex hull.
  for (let segmentIndex = 0; segmentIndex < segments.length; ++segmentIndex) {
    const p0 =
      segmentIndex === 0 ? polyPoints[polyPoints.length - 1] : polyPoints[segmentIndex - 1];
    const p1 = polyPoints[segmentIndex];

    // Compute the offset vector for the line segment, with length = hullPadding.
    // const offset = vecScale(hullPadding, unitNormal(p0, p1));
    segments[segmentIndex] = [
      vecSum(p0, vecScale(hp(p0), unitNormal(p0, p1))),
      vecSum(p1, vecScale(hp(p1), unitNormal(p0, p1))),
    ];
  }

  return segments
    .map((segment, index) => {
      const p0 = index === 0 ? polyPoints[polyPoints.length - 1] : polyPoints[index - 1];
      const p1 = polyPoints[index];
      return `${index === 0 ? `M ${segments[segments.length - 1][1]} ` : ''}A ${hp(p0)},${hp(
        p1,
      )},0,0,0,${segment[0]} L ${segment[1]}`;
    })
    .join(' ');
}
