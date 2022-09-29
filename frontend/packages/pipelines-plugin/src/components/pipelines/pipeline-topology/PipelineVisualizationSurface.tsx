import * as React from 'react';
import {
  GRAPH_LAYOUT_END_EVENT,
  Model,
  Node,
  Visualization,
  VisualizationSurface,
  VisualizationProvider,
  action,
  createTopologyControlButtons,
  defaultControlButtonsOptions,
  TopologyControlBar,
  TopologyView,
  Controller,
  GRAPH_POSITION_CHANGE_EVENT,
  ComponentFactory,
} from '@patternfly/react-topology';
import Measure from 'react-measure';
import {
  DROP_SHADOW_SPACING,
  NODE_HEIGHT,
  TOOLBAR_HEIGHT,
  GRAPH_MIN_WIDTH,
  PipelineLayout,
  GRAPH_MAX_HEIGHT_PERCENT,
} from './const';
import { layoutFactory } from './factories';
import { getLayoutData } from './utils';

type PipelineVisualizationSurfaceProps = {
  model: Model;
  componentFactory: ComponentFactory;
  showControlBar?: boolean;
  noScrollbar?: boolean;
};

const PipelineVisualizationSurface: React.FC<PipelineVisualizationSurfaceProps> = ({
  model,
  componentFactory,
  showControlBar = false,
  noScrollbar = false,
}) => {
  const [vis, setVis] = React.useState<Controller>(null);
  const [maxSize, setMaxSize] = React.useState(null);
  const [width, setWidth] = React.useState(null);
  const storedGraphModel = React.useRef(null);

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
        height: Math.max(finallyTaskHeight, regularTaskHeight) + TOOLBAR_HEIGHT,
        width: Math.max(
          maxX + maxWidth + DROP_SHADOW_SPACING + horizontalMargin * 2,
          GRAPH_MIN_WIDTH,
        ),
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
      visualization.addEventListener(GRAPH_POSITION_CHANGE_EVENT, () => {
        storedGraphModel.current = visualization.getGraph().toModel();
      });
      visualization.addEventListener(GRAPH_LAYOUT_END_EVENT, () => {
        onLayoutUpdate(visualization.getGraph().getNodes());
      });
      setVis(visualization);
    } else {
      const graph = storedGraphModel.current;
      if (graph) {
        model.graph = graph;
      }
      vis.fromModel(model);
      vis.getGraph().layout();
    }
  }, [vis, model, onLayoutUpdate, componentFactory]);

  React.useEffect(() => {
    if (model && vis) {
      const graph = storedGraphModel.current;
      if (graph) {
        model.graph = graph;
      }
      vis.fromModel(model);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [model, vis]);

  if (!vis) return null;

  const controlBar = (controller) => (
    <TopologyControlBar
      controlButtons={createTopologyControlButtons({
        ...defaultControlButtonsOptions,
        zoomInCallback: action(() => {
          controller.getGraph().scaleBy(4 / 3);
        }),
        zoomOutCallback: action(() => {
          controller.getGraph().scaleBy(0.75);
        }),
        fitToScreenCallback: action(() => {
          controller.getGraph().fit(80);
        }),
        resetViewCallback: action(() => {
          controller.getGraph().reset();
          controller.getGraph().layout();
        }),
        legend: false,
      })}
    />
  );

  return (
    <Measure
      bounds
      onResize={(contentRect) => {
        setWidth(contentRect.bounds?.width);
      }}
    >
      {({ measureRef }) => (
        <div ref={measureRef}>
          <div
            style={{
              height: noScrollbar
                ? maxSize?.height
                : Math.min((GRAPH_MAX_HEIGHT_PERCENT / 100) * window.innerHeight, maxSize?.height),
              width: noScrollbar ? maxSize?.width : Math.min(maxSize?.width, width),
            }}
          >
            <VisualizationProvider controller={vis}>
              {showControlBar ? (
                <TopologyView controlBar={controlBar(vis)}>
                  <VisualizationSurface />
                </TopologyView>
              ) : (
                <VisualizationSurface />
              )}
            </VisualizationProvider>
          </div>
        </div>
      )}
    </Measure>
  );
};

export default PipelineVisualizationSurface;
