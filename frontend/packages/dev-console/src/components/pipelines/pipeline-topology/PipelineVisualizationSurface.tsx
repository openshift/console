import * as React from 'react';
import { Model, Visualization, VisualizationSurface } from '@console/topology';
import { LayoutCallback } from '@console/topology/src/layouts/DagreLayout';
import { componentFactory, layoutFactory } from './factories';
import { DROP_SHADOW_SPACING, NODE_WIDTH, NODE_HEIGHT } from './const';

type PipelineVisualizationSurfaceProps = {
  model: Model;
};

const PipelineVisualizationSurface: React.FC<PipelineVisualizationSurfaceProps> = ({ model }) => {
  const [vis, setVis] = React.useState(null);
  const [maxSize, setMaxSize] = React.useState(null);

  const onLayoutUpdate: LayoutCallback = React.useCallback(
    (nodes) => {
      const nodeBounds = nodes.map((node) => node.getBounds());
      const maxX = nodeBounds.map((bounds) => bounds.x).reduce((x1, x2) => Math.max(x1, x2), 0);
      const maxY = nodeBounds.map((bounds) => bounds.y).reduce((y1, y2) => Math.max(y1, y2), 0);

      setMaxSize({
        // Nodes are rendered from the top-left
        height: maxY + NODE_HEIGHT + DROP_SHADOW_SPACING,
        width: maxX + NODE_WIDTH,
      });
    },
    [setMaxSize],
  );

  React.useEffect(() => {
    if (vis === null) {
      const visualization = new Visualization();
      visualization.registerLayoutFactory(layoutFactory(onLayoutUpdate));
      visualization.registerComponentFactory(componentFactory);
      visualization.fromModel(model);
      setVis(visualization);
    } else {
      vis.fromModel(model);
    }
  }, [vis, model, onLayoutUpdate]);

  if (!vis) return null;

  return (
    <div style={{ height: maxSize?.height, width: maxSize?.width }}>
      <VisualizationSurface visualization={vis} />
    </div>
  );
};

export default PipelineVisualizationSurface;
