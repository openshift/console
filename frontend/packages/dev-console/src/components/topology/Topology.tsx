import * as React from 'react';
import { action } from 'mobx';
import {
  ComponentFactory,
  Visualization,
  VisualizationSurface,
  GraphElement,
  isNode,
  BaseEdge,
  VisualizationProvider,
  Model,
  BOTTOM_LAYER,
  GROUPS_LAYER,
  DEFAULT_LAYER,
  TOP_LAYER,
  SelectionEventListener,
  SELECTION_EVENT,
} from '@patternfly/react-topology';
import { useQueryParams } from '@console/shared';
import { useExtensions } from '@console/plugin-sdk';
import { isTopologyComponentFactory, TopologyComponentFactory } from '../../extensions/topology';
import { SHOW_GROUPING_HINT_EVENT, ShowGroupingHintEventListener } from './topology-types';
import { COLA_LAYOUT, layoutFactory } from './layouts/layoutFactory';
import { componentFactory } from './components';
import { odcElementFactory } from './elements';
import TopologyControlBar from './TopologyControlBar';

import './Topology.scss';

interface TopologyGraphViewProps {
  visualizationReady: boolean;
  visualization: Visualization;
  selectedId?: string;
  dragHint?: string;
}

const TopologyGraphView: React.FC<TopologyGraphViewProps> = React.memo(
  ({ visualizationReady, visualization, selectedId, dragHint }) => {
    if (!visualizationReady) {
      return null;
    }
    return (
      <div className="odc-topology-graph-view">
        <VisualizationProvider controller={visualization}>
          <VisualizationSurface state={{ selectedIds: [selectedId] }} />
          {dragHint && (
            <div className="odc-topology__hint-container">
              <div className="odc-topology__hint-background">{dragHint}</div>
            </div>
          )}
          <TopologyControlBar visualization={visualization} />
        </VisualizationProvider>
      </div>
    );
  },
);

const TOPOLOGY_GRAPH_ID = 'odc-topology-graph';
const graphModel: Model = {
  graph: {
    id: TOPOLOGY_GRAPH_ID,
    type: 'graph',
    layout: COLA_LAYOUT,
    layers: [BOTTOM_LAYER, GROUPS_LAYER, 'groups2', DEFAULT_LAYER, TOP_LAYER],
  },
};

interface TopologyProps {
  model: Model;
  application: string;
  namespace: string;
  onSelect: (entity?: GraphElement) => void;
  setVisualization: (vis: Visualization) => void;
}

const Topology: React.FC<TopologyProps> = ({ model, application, onSelect, setVisualization }) => {
  const applicationRef = React.useRef<string>(null);
  const [visualizationReady, setVisualizationReady] = React.useState<boolean>(false);
  const [dragHint, setDragHint] = React.useState<string>('');
  const queryParams = useQueryParams();
  const selectedId = queryParams.get('selectId');
  const [componentFactories, setComponentFactories] = React.useState<ComponentFactory[]>([]);
  const componentFactoryExtensions = useExtensions<TopologyComponentFactory>(
    isTopologyComponentFactory,
  );
  const componentFactoriesPromises = React.useMemo(
    () => componentFactoryExtensions.map((factory) => factory.properties.getFactory()),
    [componentFactoryExtensions],
  );
  const createVisualization = () => {
    const newVisualization = new Visualization();
    newVisualization.registerElementFactory(odcElementFactory);
    newVisualization.registerLayoutFactory(layoutFactory);
    newVisualization.fromModel(graphModel);
    newVisualization.addEventListener<SelectionEventListener>(SELECTION_EVENT, (ids: string[]) => {
      const selectedEntity = ids[0] ? newVisualization.getElementById(ids[0]) : null;
      onSelect(selectedEntity);
    });
    setVisualization(newVisualization);
    return newVisualization;
  };

  const visualizationRef = React.useRef<Visualization>();
  if (!visualizationRef.current) {
    visualizationRef.current = createVisualization();
  }
  const visualization = visualizationRef.current;

  React.useEffect(() => {
    if (model && visualizationReady) {
      visualization.fromModel(model);
      const selectedItem = selectedId ? visualization.getElementById(selectedId) : null;
      if (!selectedItem || !selectedItem.isVisible()) {
        onSelect();
      } else {
        onSelect(selectedItem);
      }
    }
    // Do not update on selectedId change
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [model, visualization, visualizationReady]);

  React.useEffect(() => {
    Promise.all(componentFactoriesPromises)
      .then((res) => {
        setComponentFactories(res);
      })
      .catch(() => {});
  }, [componentFactoriesPromises]);

  React.useEffect(() => {
    if (componentFactoriesPromises.length && !componentFactories.length) {
      return;
    }

    visualization.registerComponentFactory(componentFactory);
    componentFactories.forEach((factory) => {
      visualization.registerComponentFactory(factory);
    });

    visualization.addEventListener<ShowGroupingHintEventListener>(
      SHOW_GROUPING_HINT_EVENT,
      (element, hint) => {
        setDragHint(hint);
      },
    );
    setVisualizationReady(true);
  }, [visualization, componentFactoriesPromises, componentFactories]);

  React.useEffect(() => {
    if (!applicationRef.current) {
      applicationRef.current = application;
      return;
    }
    if (application !== applicationRef.current) {
      applicationRef.current = application;
      if (visualization) {
        visualization.getGraph().reset();
        visualization.getGraph().layout();
      }
    }
  }, [application, visualization]);

  React.useEffect(() => {
    let resizeTimeout = null;
    if (visualization) {
      if (selectedId) {
        const selectedEntity = visualization.getElementById(selectedId);
        if (selectedEntity) {
          const visibleEntity = isNode(selectedEntity)
            ? selectedEntity
            : (selectedEntity as BaseEdge).getSource();
          resizeTimeout = setTimeout(
            action(() => {
              visualization
                .getGraph()
                .panIntoView(visibleEntity, { offset: 20, minimumVisible: 40 });
              resizeTimeout = null;
            }),
            500,
          );
        }
      }
    }
    return () => {
      if (resizeTimeout) {
        clearTimeout(resizeTimeout);
      }
    };
  }, [selectedId, visualization]);

  return (
    <TopologyGraphView
      visualizationReady={visualizationReady}
      visualization={visualization}
      dragHint={dragHint}
      selectedId={selectedId}
    />
  );
};

export default React.memo(Topology);
