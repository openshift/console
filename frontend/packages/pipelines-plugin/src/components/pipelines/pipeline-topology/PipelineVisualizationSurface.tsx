import * as React from 'react';
import {
  GRAPH_LAYOUT_END_EVENT,
  Model,
  Node,
  Visualization,
  VisualizationSurface,
  VisualizationProvider,
} from '@patternfly/react-topology';
import { DROP_SHADOW_SPACING, NODE_HEIGHT, PipelineLayout } from './const';
import { componentFactory, layoutFactory } from './factories';
import { getLayoutData } from './utils';

type PipelineVisualizationSurfaceProps = {
  model: Model;
};

const PipelineVisualizationSurface: React.FC<PipelineVisualizationSurfaceProps> = ({ model }) => {
  const [vis, setVis] = React.useState(null);
  const [maxSize, setMaxSize] = React.useState(null);

  const layout: PipelineLayout = model.graph.layout as PipelineLayout;

  const onLayoutUpdate = React.useCallback(
    (nodes: Node[]) => {
      const nodeBounds = nodes.map((node) => node.getBounds());
      const maxWidth = Math.floor(
        nodeBounds.map((bounds) => bounds.width).reduce((w1, w2) => Math.max(w1, w2), 0),
      );
      const maxHeight = Math.floor(
        nodeBounds.map((bounds) => bounds.height).reduce((h1, h2) => Math.max(h1, h2), 0),
      );
      const maxObject = nodeBounds.find((nb) => nb.height === maxHeight);

      const maxX = Math.floor(
        nodeBounds.map((bounds) => bounds.x).reduce((x1, x2) => Math.max(x1, x2), 0),
      );
      const maxY = Math.floor(
        nodeBounds.map((bounds) => bounds.y).reduce((y1, y2) => Math.max(y1, y2), 0),
      );

      let horizontalMargin = 0;
      let verticalMargin = 0;
      if (layout) {
        horizontalMargin = getLayoutData(layout).marginx || 0;
        verticalMargin = getLayoutData(layout).marginy || 0;
      }
      const finallyTaskHeight = maxObject.y + maxHeight + DROP_SHADOW_SPACING + verticalMargin * 2;
      const regularTaskHeight = maxY + NODE_HEIGHT + DROP_SHADOW_SPACING + verticalMargin * 2;

      setMaxSize({
        height: Math.max(finallyTaskHeight, regularTaskHeight),
        width: maxX + maxWidth + DROP_SHADOW_SPACING + horizontalMargin * 2,
      });
    },
    [setMaxSize, layout],
  );

  React.useEffect(() => {
    if (vis === null) {
      const visualization = new Visualization();
      visualization.registerLayoutFactory(layoutFactory);
      visualization.registerComponentFactory(componentFactory);
      visualization.fromModel(model);
      visualization.addEventListener(GRAPH_LAYOUT_END_EVENT, () => {
        onLayoutUpdate(visualization.getGraph().getNodes());
      });
      setVis(visualization);
    } else {
      vis.fromModel(model);
      vis.getGraph().layout();
    }
  }, [vis, model, onLayoutUpdate]);

  if (!vis) return null;

  return (
    <div style={{ height: maxSize?.height, width: maxSize?.width }}>
      <VisualizationProvider controller={vis}>
        <VisualizationSurface />
      </VisualizationProvider>
    </div>
  );
};

export default PipelineVisualizationSurface;
