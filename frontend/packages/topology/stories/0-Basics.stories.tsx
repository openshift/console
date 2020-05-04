import * as React from 'react';
import { action } from 'mobx';
import { observer } from 'mobx-react';
import {
  Visualization,
  VisualizationSurface,
  Model,
  ModelKind,
  withDragNode,
  ComponentFactory,
  useAnchor,
  EllipseAnchor,
  RectAnchor,
  Node,
} from '../src';
import defaultComponentFactory from './components/defaultComponentFactory';
import DefaultNode from './components/DefaultNode';
import Dimensions from '../src/geom/Dimensions';

export default {
  title: 'Basic',
};

export const singleNode = () => {
  const vis = new Visualization();
  const model: Model = {
    graph: {
      id: 'g1',
      type: 'graph',
    },
    nodes: [
      {
        id: 'n1',
        type: 'node',
        x: 50,
        y: 50,
        width: 20,
        height: 20,
      },
    ],
  };
  vis.fromModel(model);
  vis.registerComponentFactory(defaultComponentFactory);
  return <VisualizationSurface visualization={vis} />;
};

export const singleEdge = () => {
  const vis = new Visualization();
  const model: Model = {
    graph: {
      id: 'g1',
      type: 'graph',
    },
    nodes: [
      {
        id: 'n1',
        type: 'node',
        x: 20,
        y: 20,
        width: 20,
        height: 20,
      },
      {
        id: 'n2',
        type: 'node',
        x: 200,
        y: 50,
        width: 100,
        height: 30,
      },
    ],
    edges: [
      {
        id: 'e1',
        type: 'edge',
        source: 'n1',
        target: 'n2',
        bendpoints: [
          [80, 30],
          [110, 10],
        ],
      },
    ],
  };
  vis.fromModel(model);
  vis.registerComponentFactory(defaultComponentFactory);
  return <VisualizationSurface visualization={vis} />;
};

export const multiEdge = () => {
  const vis = new Visualization();
  const model: Model = {
    graph: {
      id: 'g1',
      type: 'graph',
    },
    nodes: [
      {
        id: 'n1',
        type: 'node',
        x: 50,
        y: 50,
        width: 100,
        height: 100,
      },
      {
        id: 'n2',
        type: 'node',
        x: 400,
        y: 50,
        width: 100,
        height: 100,
      },
      {
        id: 'n3',
        type: 'node',
        x: 50,
        y: 200,
        width: 100,
        height: 100,
      },
      {
        id: 'n4',
        type: 'node',
        x: 400,
        y: 200,
        width: 100,
        height: 100,
      },
    ],
    edges: [
      {
        id: 'e1',
        type: 'multi-edge',
        source: 'n1',
        target: 'n2',
      },
      {
        id: 'e2',
        type: 'multi-edge',
        source: 'n1',
        target: 'n2',
      },
      {
        id: 'e3',
        type: 'multi-edge',
        source: 'n3',
        target: 'n4',
      },
      {
        id: 'e4',
        type: 'multi-edge',
        source: 'n3',
        target: 'n4',
      },
      {
        id: 'e5',
        type: 'multi-edge',
        source: 'n3',
        target: 'n4',
      },
      {
        id: 'e6',
        type: 'multi-edge',
        source: 'n3',
        target: 'n4',
      },
      {
        id: 'e7',
        type: 'multi-edge',
        source: 'n3',
        target: 'n4',
      },
    ],
  };
  vis.fromModel(model);
  vis.registerComponentFactory(defaultComponentFactory);
  vis.registerComponentFactory((kind) => {
    if (kind === ModelKind.node) {
      return withDragNode()(DefaultNode);
    }
    return undefined;
  });
  return <VisualizationSurface visualization={vis} />;
};

const groupStory = (groupType: string) => {
  const vis = new Visualization();
  const model: Model = {
    graph: {
      id: 'g1',
      type: 'graph',
    },
    nodes: [
      {
        id: 'gr1',
        type: groupType,
        group: true,
        children: ['n1', 'n2', 'n3'],
        style: {
          padding: 10,
        },
      },
      {
        id: 'n1',
        type: 'node',
        x: 50,
        y: 50,
        width: 30,
        height: 30,
      },
      {
        id: 'n2',
        type: 'node',
        x: 200,
        y: 20,
        width: 10,
        height: 10,
      },
      {
        id: 'n3',
        type: 'node',
        x: 150,
        y: 100,
        width: 20,
        height: 20,
      },
    ],
  };
  vis.fromModel(model);
  vis.registerComponentFactory(defaultComponentFactory);
  return <VisualizationSurface visualization={vis} />;
};

export const group = () => groupStory('group');
export const groupHull = () => groupStory('group-hull');

export const autoSizeNode = () => {
  const vis = new Visualization();
  const model: Model = {
    graph: {
      id: 'g1',
      type: 'graph',
    },
    nodes: [
      {
        id: 'n1',
        type: 'autoSize-rect',
        x: 50,
        y: 50,
      },

      {
        id: 'n2',
        type: 'autoSize-circle',
        x: 250,
        y: 200,
      },

      {
        id: 'n3',
        type: 'autoSize-rect',
        x: 300,
        y: 70,
      },
      {
        id: 'gr1',
        type: 'group',
        group: true,
        children: ['n1', 'n3'],
        style: {
          padding: 10,
        },
      },
    ],
    edges: [
      {
        id: 'e1',
        type: 'edge',
        source: 'n1',
        target: 'n2',
      },
      {
        id: 'e2',
        type: 'edge',
        source: 'gr1',
        target: 'n2',
      },
    ],
  };
  vis.fromModel(model);
  vis.registerComponentFactory(defaultComponentFactory);

  const CustomCircle: React.FC<{ element: Node }> = observer(({ element }) => {
    useAnchor(EllipseAnchor);
    React.useEffect(() => {
      // init height
      action(() => element.setDimensions(new Dimensions(40, 40)))();
    }, [element]);
    const r = element.getDimensions().width / 2;
    return (
      <circle
        cx={r}
        cy={r}
        r={r}
        fill="grey"
        strokeWidth={1}
        stroke="#333333"
        onClick={() => {
          const size = element.getDimensions().width === 40 ? 80 : 40;
          action(() => element.setDimensions(new Dimensions(size, size)))();
        }}
      />
    );
  });
  const CustomRect: React.FC = observer(() => {
    useAnchor(RectAnchor);
    return (
      <rect x={0} y={0} width={100} height={20} fill="grey" strokeWidth={1} stroke="#333333" />
    );
  });
  const customFactory: ComponentFactory = (kind, type) => {
    if (type === 'autoSize-circle') {
      return CustomCircle;
    }
    if (type === 'autoSize-rect') {
      return CustomRect;
    }
    return undefined;
  };
  vis.registerComponentFactory(customFactory);
  return <VisualizationSurface visualization={vis} />;
};
