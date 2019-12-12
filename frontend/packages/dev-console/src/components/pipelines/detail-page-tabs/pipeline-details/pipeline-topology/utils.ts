import { Point } from '@console/topology';
import { PipelineNodeModel } from './types';

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

const makeNode = (name: string, data: {}, overrides: {} = {}) => ({
  id: name,
  data,
  height: 35,
  width: 120,
  type: 'node',
  ...overrides,
});

export const fixParallelToParallelNodes = (nodes) => {
  const multipleRunBeforeMap = nodes.reduce((acc, node, idx) => {
    const runAfters = node.data.task.runAfter;
    if (runAfters && runAfters.length > 1) {
      const id = [...runAfters]
        .sort((a, b) => a.localeCompare(b))
        .reduce((str, ref) => `${str}|${ref}`);
      if (!Array.isArray(acc[id])) {
        acc[id] = [];
      }
      acc[id].push({
        node,
        runAfters,
        atIndex: idx,
      });
    }
    return acc;
  }, {});
  const p2pList = Object.values(multipleRunBeforeMap).filter((data: []) => data.length > 1);

  if (p2pList.length === 0) {
    // No parallel to parallel
    return nodes;
  }
  const newNodes = [];
  p2pList.forEach((p2p: any) => {
    const { runAfters } = p2p[0];

    const names = p2p.map((p2pData: any) => p2pData.node.id);

    const tempName = `parallel-${names.join('-')}`;
    newNodes.push(
      makeNode(
        tempName,
        {
          task: {
            name: tempName,
            runAfter: runAfters,
          },
        },
        { type: 'nodeSpacer' },
      ),
    );

    nodes.forEach((node) => {
      if (names.includes(node.id)) {
        const { task } = node.data;
        newNodes.push(
          makeNode(node.id, {
            ...node.data,
            task: {
              ...task,
              runAfter: [tempName],
            },
          }),
        );
      } else {
        newNodes.push(node);
      }
    });
  });

  return newNodes;
};

export const tasksToNodes = (taskList, pipeline, pipelineRun): PipelineNodeModel[] => {
  const nodeList = taskList.map((task) =>
    makeNode(task.name, {
      task,
      pipeline,
      pipelineRun,
    }),
  );

  return fixParallelToParallelNodes(nodeList);
};
