import type { FC } from 'react';
import { useState, useRef, useCallback, useEffect } from 'react';
import type { Model, Node, Controller, ComponentFactory } from '@patternfly/react-topology';
import {
  GRAPH_LAYOUT_END_EVENT,
  Visualization,
  VisualizationSurface,
  VisualizationProvider,
  action,
  createTopologyControlButtons,
  defaultControlButtonsOptions,
  TopologyControlBar,
  TopologyView,
  GRAPH_POSITION_CHANGE_EVENT,
} from '@patternfly/react-topology';
import MeasureBounds from './measure';
import { layoutFactory, getLayoutData } from './reducer';
import type { PipelineLayout } from './types';
import {
  DROP_SHADOW_SPACING,
  GRAPH_MAX_HEIGHT_PERCENT,
  GRAPH_MIN_WIDTH,
  TOOLBAR_HEIGHT,
  NODE_HEIGHT,
} from './types';

type PipelineVisualizationSurfaceProps = {
  model: Model;
  componentFactory: ComponentFactory;
  showControlBar?: boolean;
  noScrollbar?: boolean;
};

const PipelineVisualizationSurface: FC<PipelineVisualizationSurfaceProps> = ({
  model,
  componentFactory,
  showControlBar = false,
  noScrollbar = false,
}) => {
  const [vis, setVis] = useState<Controller>(null);
  const [maxSize, setMaxSize] = useState(null);
  const [width, setWidth] = useState(null);
  const storedGraphModel = useRef(null);

  const layout: PipelineLayout = model.graph.layout as PipelineLayout;

  const onLayoutUpdate = useCallback(
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

  useEffect(() => {
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

  useEffect(() => {
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
    <MeasureBounds
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
    </MeasureBounds>
  );
};

export default PipelineVisualizationSurface;
