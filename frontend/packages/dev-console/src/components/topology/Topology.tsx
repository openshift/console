import * as React from 'react';
import { connect } from 'react-redux';
import { action } from 'mobx';
import { debounce } from '@patternfly/react-core';
import {
  ComponentFactory,
  Visualization,
  VisualizationSurface,
  GraphElement,
  isNode,
  BaseEdge,
  VisualizationProvider,
  Model,
  GraphModel,
  NodeModel,
  BOTTOM_LAYER,
  GROUPS_LAYER,
  DEFAULT_LAYER,
  TOP_LAYER,
  SelectionEventListener,
  SELECTION_EVENT,
  NODE_POSITIONED_EVENT,
  GRAPH_POSITION_CHANGE_EVENT,
} from '@patternfly/react-topology';
import { STORAGE_PREFIX, useQueryParams } from '@console/shared';
import { useExtensions } from '@console/plugin-sdk';
import { RootState } from '@console/internal/redux';
import { isTopologyComponentFactory, TopologyComponentFactory } from '../../extensions/topology';
import { SHOW_GROUPING_HINT_EVENT, ShowGroupingHintEventListener } from './topology-types';
import { getTopologyGraphModel, setTopologyGraphModel } from './redux/action';
import { COLA_LAYOUT, layoutFactory } from './layouts/layoutFactory';
import { componentFactory } from './components';
import { odcElementFactory } from './elements';
import TopologyControlBar from './TopologyControlBar';

import './Topology.scss';

const TOPOLOGY_LAYOUT_LOCAL_STORAGE_KEY = `${STORAGE_PREFIX}/topology-layout`;
const STORED_NODE_LAYOUT_FIELDS = ['id', 'x', 'y', 'collapsed', 'visible', 'style', 'shape'];

type StoredLayout = {
  nodes: NodeModel[];
  layout: string;
};

const getStoredLayouts = (): { [namespace: string]: StoredLayout } => {
  const storedLayoutsString = localStorage.getItem(TOPOLOGY_LAYOUT_LOCAL_STORAGE_KEY);
  try {
    return JSON.parse(storedLayoutsString) || {};
  } catch (e) {
    return {};
  }
};

const getTopologyLayout = (namespace: string): StoredLayout => getStoredLayouts()[namespace];

const setTopologyLayout = (namespace: string, nodes: NodeModel[], layout: string) => {
  const currentStore = getStoredLayouts();
  currentStore[namespace] = {
    nodes: nodes?.map((n) =>
      Object.keys(n).reduce((acc, key) => {
        if (STORED_NODE_LAYOUT_FIELDS.includes(key)) {
          acc[key] = n[key];
        }
        return acc;
      }, {} as NodeModel),
    ),
    layout,
  };
  localStorage.setItem(TOPOLOGY_LAYOUT_LOCAL_STORAGE_KEY, JSON.stringify(currentStore));
};

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

interface StateProps {
  getStoredGraphModel: (namespace: string) => GraphModel;
}

interface DispatchProps {
  onGraphModelChange: (namespace: string, model: GraphModel) => void;
}

interface TopologyProps {
  model: Model;
  application: string;
  namespace: string;
  onSelect: (entity?: GraphElement) => void;
  setVisualization: (vis: Visualization) => void;
}

const Topology: React.FC<TopologyProps & StateProps & DispatchProps> = ({
  model,
  application,
  namespace,
  onSelect,
  setVisualization,
  onGraphModelChange,
  getStoredGraphModel,
}) => {
  const applicationRef = React.useRef<string>(null);
  const [visualizationReady, setVisualizationReady] = React.useState<boolean>(false);
  const [dragHint, setDragHint] = React.useState<string>('');
  const storedLayoutApplied = React.useRef<boolean>(false);
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
    const storedLayout = getTopologyLayout(namespace);
    const newVisualization = new Visualization();
    newVisualization.registerElementFactory(odcElementFactory);
    newVisualization.registerLayoutFactory(layoutFactory);

    const onCurrentGraphModelChange = debounce(() => {
      const visModel = newVisualization.toModel();
      const saveGraphModel = {
        id: visModel.graph.id,
        type: visModel.graph.type,
        x: visModel.graph.x,
        y: visModel.graph.y,
        scale: visModel.graph.scale,
        scaleExtent: visModel.graph.scaleExtent,
      };
      onGraphModelChange(namespace, saveGraphModel);
    }, 200);

    const onVisualizationLayoutChange = debounce(() => {
      const visModel = newVisualization.toModel();
      setTopologyLayout(namespace, visModel.nodes, visModel.graph.layout);
    }, 200);

    newVisualization.addEventListener(NODE_POSITIONED_EVENT, onVisualizationLayoutChange);
    newVisualization.addEventListener(GRAPH_POSITION_CHANGE_EVENT, onCurrentGraphModelChange);

    if (storedLayout) {
      graphModel.graph.layout = storedLayout.layout;
    }
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
      if (!storedLayoutApplied.current) {
        const storedGraphModel = getStoredGraphModel(namespace);
        if (storedGraphModel) {
          model.graph = {
            ...graphModel.graph,
            x: storedGraphModel.x,
            y: storedGraphModel.y,
            scale: storedGraphModel.scale,
            scaleExtent: storedGraphModel.scaleExtent,
          };
        }
        const storedLayout = getTopologyLayout(namespace);
        if (storedLayout) {
          model.nodes.forEach((n) => {
            const storedNode = storedLayout.nodes.find((sn) => sn.id === n.id);
            if (storedNode) {
              Object.keys(storedNode).forEach((key) => {
                n[key] = storedNode[key];
              });
            }
          });
        }
        storedLayoutApplied.current = true;
      }
      visualization.fromModel(model);
      const selectedItem = selectedId ? visualization.getElementById(selectedId) : null;
      if (!selectedItem || !selectedItem.isVisible()) {
        onSelect();
      } else {
        onSelect(selectedItem);
      }
    }
    // Do not update on selectedId change or stored layout change
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

const TopologyStateToProps = (state: RootState): StateProps => {
  return {
    getStoredGraphModel: (namespace: string) => getTopologyGraphModel(state, namespace),
  };
};

const TopologyDispatchToProps = (dispatch): DispatchProps => ({
  onGraphModelChange: (namespace: string, model: GraphModel) => {
    dispatch(setTopologyGraphModel(namespace, model));
  },
});

export default connect<StateProps, DispatchProps, TopologyProps>(
  TopologyStateToProps,
  TopologyDispatchToProps,
)(React.memo(Topology));
