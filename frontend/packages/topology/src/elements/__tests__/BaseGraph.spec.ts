import Rect from '../../geom/Rect';
import Point from '../../geom/Point';
import { ModelKind, Graph } from '../../types';
import BaseGraph from '../BaseGraph';

describe('BaseGraph', () => {
  let graph: Graph;

  beforeEach(() => {
    graph = new BaseGraph();
  });

  it('should have a graph kind', () => {
    expect(graph.getKind()).toBe(ModelKind.graph);
  });

  it('should update bounds', () => {
    expect(graph.getBounds()).toEqual({ x: 0, y: 0, width: 0, height: 0 });
    const r = new Rect(10, 20, 30, 40);
    graph.setBounds(r);
    expect(graph.getBounds()).toEqual({ x: 10, y: 20, width: 30, height: 40 });
  });

  it('should update scale', () => {
    expect(graph.getScale()).toBe(1);
    graph.setScale(4.5);
    expect(graph.getScale()).toBe(4.5);
  });

  it('should reset position and scale', () => {
    graph.setBounds(new Rect(10, 20, 30, 40));
    graph.setScale(2);
    graph.reset();
    expect(graph.getScale()).toBe(1);
    expect(graph.getBounds()).toEqual({ x: 0, y: 0, width: 30, height: 40 });
  });

  it('should scaleBy the given multiple around the specified location', () => {
    graph.setBounds(new Rect(0, 0, 100, 100));
    graph.scaleBy(0.5);
    expect(graph.getScale()).toBe(0.5);
    expect(graph.getBounds()).toEqual({ x: 25, y: 25, width: 100, height: 100 });
    graph.scaleBy(2);
    expect(graph.getBounds()).toEqual({ x: 0, y: 0, width: 100, height: 100 });
    graph.scaleBy(0.5, new Point(100, 100));
    expect(graph.getBounds()).toEqual({ x: 50, y: 50, width: 100, height: 100 });
  });
});
