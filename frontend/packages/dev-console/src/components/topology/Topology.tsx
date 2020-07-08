import * as React from 'react';
import * as classNames from 'classnames';
import { action } from 'mobx';
import { connect } from 'react-redux';
import { Button, PageHeaderToolsItem, Tooltip, Stack, StackItem } from '@patternfly/react-core';
import { TopologyIcon } from '@patternfly/react-icons';
import {
  TopologyControlBar,
  createTopologyControlButtons,
  defaultControlButtonsOptions,
  ComponentFactory,
  Visualization,
  VisualizationSurface,
  isNode,
  isEdge,
  BaseEdge,
  Model,
  SELECTION_EVENT,
  SelectionEventListener,
  GROUPS_LAYER,
  TOP_LAYER,
  BOTTOM_LAYER,
  DEFAULT_LAYER,
  VisualizationProvider,
} from '@patternfly/react-topology';
import { useExtensions } from '@console/plugin-sdk';
import {
  isTopologyComponentFactory,
  TopologyComponentFactory,
  isTopologyCreateConnector,
  TopologyCreateConnector,
  isTopologyDisplayFilter,
  TopologyDisplayFilters,
} from '../../extensions/topology';

import { RootState } from '@console/internal/redux';
import { getActiveApplication } from '@console/internal/reducers/ui';
import { selectOverviewDetailsTab } from '@console/internal/actions/ui';
import { getEventSourceStatus } from '@console/knative-plugin/src/topology/knative-topology-utils';
import { TYPE_EVENT_PUB_SUB_LINK } from '@console/knative-plugin/src/topology/const';
import KnativeResourceOverviewPage from '@console/knative-plugin/src/components/overview/KnativeResourceOverviewPage';
import {
  getQueryArgument,
  setQueryArgument,
  removeQueryArgument,
} from '@console/internal/components/utils';
import { TYPE_VIRTUAL_MACHINE } from '@console/kubevirt-plugin/src/topology/components/const';
import TopologyVmPanel from '@console/kubevirt-plugin/src/topology/TopologyVmPanel';
import { useAddToProjectAccess } from '../../utils/useAddToProjectAccess';
import TopologySideBar from './TopologySideBar';
import {
  GraphData,
  TopologyDataObject,
  SHOW_GROUPING_HINT_EVENT,
  ShowGroupingHintEventListener,
  TopologyApplyDisplayOptions,
  DisplayFilters,
  CreateConnectionGetter,
} from './topology-types';
import TopologyResourcePanel from './TopologyResourcePanel';
import TopologyApplicationPanel from './application-panel/TopologyApplicationPanel';
import ConnectedTopologyEdgePanel from './TopologyEdgePanel';
import { layoutFactory, COLA_LAYOUT, COLA_FORCE_LAYOUT } from './layouts/layoutFactory';
import { TYPE_APPLICATION_GROUP, componentFactory } from './components';
import TopologyFilterBar from './filters/TopologyFilterBar';
import {
  getTopologySearchQuery,
  TOPOLOGY_SEARCH_FILTER_KEY,
  useDisplayFilters,
  useAppliedDisplayFilters,
} from './filters';
import TopologyHelmReleasePanel from './helm/TopologyHelmReleasePanel';
import { TYPE_HELM_RELEASE, TYPE_HELM_WORKLOAD } from './helm/components/const';
import { TYPE_OPERATOR_BACKED_SERVICE } from './operators/components/const';
import TopologyHelmWorkloadPanel from './helm/TopologyHelmWorkloadPanel';
import { updateModelFromFilters } from './data-transforms';
import { setSupportedTopologyFilters, setTopologyFilters } from './redux/action';

export const FILTER_ACTIVE_CLASS = 'odc-m-filter-active';

interface StateProps {
  application: string;
  eventSourceEnabled: boolean;
}

interface DispatchProps {
  onSelectTab?: (name: string) => void;
  onFiltersChange: (filters: DisplayFilters) => void;
  onSupportedFiltersChange: (supportedFilterIds: string[]) => void;
}

interface TopologyProps {
  model: Model;
  namespace: string;
}

const graphModel: Model = {
  graph: {
    id: 'g1',
    type: 'graph',
    layout: COLA_LAYOUT,
    layers: [BOTTOM_LAYER, GROUPS_LAYER, 'groups2', DEFAULT_LAYER, TOP_LAYER],
  },
};

type ComponentProps = TopologyProps & StateProps & DispatchProps;

const Topology: React.FC<ComponentProps> = ({
  model,
  application,
  namespace,
  eventSourceEnabled,
  onSelectTab,
  onFiltersChange,
  onSupportedFiltersChange,
}) => {
  const applicationRef = React.useRef<string>(null);
  const [layout, setLayout] = React.useState<string>(graphModel.graph.layout);
  const [filteredModel, setFilteredModel] = React.useState<Model>();
  const [graphData, setGraphData] = React.useState<GraphData>();
  const [selectedIds, setSelectedIds] = React.useState<string[]>([]);
  const createResourceAccess: string[] = useAddToProjectAccess(namespace);
  const [dragHint, setDragHint] = React.useState<string>('');
  const filters = useDisplayFilters();
  const appliedFilters = useAppliedDisplayFilters();
  const [displayFilterers, setDisplayFilterers] = React.useState<TopologyApplyDisplayOptions[]>(
    null,
  );
  const [componentFactories, setComponentFactories] = React.useState<ComponentFactory[]>([]);
  const componentFactoryExtensions = useExtensions<TopologyComponentFactory>(
    isTopologyComponentFactory,
  );
  const displayFilterExtensions = useExtensions<TopologyDisplayFilters>(isTopologyDisplayFilter);
  const createConnectorExtensions = useExtensions<TopologyCreateConnector>(
    isTopologyCreateConnector,
  );
  const [createConnectors, setCreateConnectors] = React.useState<CreateConnectionGetter[]>(null);
  const searchParams = window.location.search;
  const [filtersLoaded, setFiltersLoaded] = React.useState<boolean>(false);
  const componentFactoriesPromises = React.useMemo(
    () => componentFactoryExtensions.map((factory) => factory.properties.getFactory()),
    [componentFactoryExtensions],
  );

  React.useEffect(() => {
    Promise.all(componentFactoriesPromises)
      .then((res) => setComponentFactories(res))
      .catch(() => {});
  }, [componentFactoriesPromises]);

  const createConnectorPromises = React.useMemo(
    () => createConnectorExtensions.map((creator) => creator.properties.getCreateConnector()),
    [createConnectorExtensions],
  );

  React.useEffect(() => {
    if (createConnectorPromises) {
      if (createConnectorPromises.length === 0) {
        setCreateConnectors([]);
      }
      Promise.all(createConnectorPromises)
        .then((res) => setCreateConnectors(res))
        .catch(() => {
          setCreateConnectors([]);
        });
    }
  }, [createConnectorPromises]);

  const displayFilterPromises = React.useMemo(
    () => displayFilterExtensions.map((filterer) => filterer.properties.applyDisplayOptions()),
    [displayFilterExtensions],
  );

  React.useEffect(() => {
    if (displayFilterPromises) {
      if (displayFilterPromises.length === 0) {
        setDisplayFilterers([]);
      }
      Promise.all(displayFilterPromises)
        .then((res) => setDisplayFilterers(res))
        .catch(() => {
          setDisplayFilterers([]);
        });
    }
  }, [displayFilterPromises]);

  const topologyFilterPromises = React.useMemo(
    () => displayFilterExtensions.map((filterer) => filterer.properties.getTopologyFilters()),
    [displayFilterExtensions],
  );

  React.useEffect(() => {
    Promise.all(topologyFilterPromises)
      .then((res) => {
        const updateFilters = [...filters];
        res.forEach((getter) => {
          const extFilters = getter();
          extFilters.forEach((filter) => {
            if (!updateFilters.find((f) => f.id === filter.id)) {
              if (appliedFilters[filter.id] !== undefined) {
                filter.value = appliedFilters[filter.id];
              }
              updateFilters.push(filters.find((f) => f.id === filter.id) || filter);
            }
          });
        });
        onFiltersChange(updateFilters);
        setFiltersLoaded(true);
      })
      .catch(() => {});
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [topologyFilterPromises]);

  const onSelect = (ids: string[]) => {
    // set empty selection when selecting the graph
    if (ids.length > 0 && ids[0] === graphModel.graph.id) {
      setSelectedIds([]);
      removeQueryArgument('selectId');
    } else {
      setSelectedIds(ids);
      setQueryArgument('selectId', ids[0]);
    }
  };

  const visualization: Visualization = React.useMemo(() => {
    if (componentFactoriesPromises.length && !componentFactories.length) {
      return null;
    }

    const vis = new Visualization();
    vis.registerLayoutFactory(layoutFactory);
    vis.registerComponentFactory(componentFactory);
    componentFactories.forEach((factory) => {
      vis.registerComponentFactory(factory);
    });

    vis.addEventListener<SelectionEventListener>(SELECTION_EVENT, onSelect);
    vis.addEventListener<ShowGroupingHintEventListener>(
      SHOW_GROUPING_HINT_EVENT,
      (element, hint) => {
        setDragHint(hint);
      },
    );
    vis.fromModel(graphModel);
    return vis;
  }, [componentFactoriesPromises, componentFactories]);

  React.useEffect(() => {
    const newGraphData: GraphData = {
      createResourceAccess,
      namespace,
      eventSourceEnabled,
      createConnectorExtensions: createConnectors,
    };
    if (visualization) {
      visualization.getGraph().setData(newGraphData);
    }
    setGraphData(newGraphData);
  }, [namespace, createResourceAccess, eventSourceEnabled, visualization, createConnectors]);

  React.useEffect(() => {
    if (visualization && displayFilterers && filtersLoaded) {
      const newModel = updateModelFromFilters(
        model,
        filters,
        application,
        displayFilterers,
        onSupportedFiltersChange,
      );
      visualization.fromModel(newModel);
      setFilteredModel(newModel);
      visualization.fromModel(model);
      if (selectedIds.length && !visualization.getElementById(selectedIds[0])) {
        setSelectedIds([]);
      } else {
        const selectId = getQueryArgument('selectId');
        const selectTab = getQueryArgument('selectTab');
        visualization.getElementById(selectId) && setSelectedIds([selectId]);
        if (selectTab) {
          onSelectTab(selectTab);
          removeQueryArgument('selectTab');
        }
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [model, visualization, filters, application, displayFilterers, filtersLoaded]);

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
      if (selectedIds.length > 0) {
        const selectedEntity = visualization.getElementById(selectedIds[0]);
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
  }, [selectedIds, visualization]);

  React.useEffect(() => {
    action(() => {
      if (visualization) {
        visualization.getGraph().setLayout(layout);
      }
    })();
  }, [layout, visualization]);

  const onSearchChange = (searchQuery) => {
    if (searchQuery.length > 0) {
      setQueryArgument(TOPOLOGY_SEARCH_FILTER_KEY, searchQuery);
      document.body.classList.add(FILTER_ACTIVE_CLASS);
    } else {
      removeQueryArgument(TOPOLOGY_SEARCH_FILTER_KEY);
      document.body.classList.remove(FILTER_ACTIVE_CLASS);
    }
  };

  React.useEffect(() => {
    const searchQuery = getTopologySearchQuery();
    searchQuery && onSearchChange(searchQuery);
  }, [searchParams]);

  if (!visualization) {
    return null;
  }

  const onSidebarClose = () => {
    setSelectedIds([]);
    removeQueryArgument('selectId');
  };

  const renderControlBar = () => {
    return (
      <TopologyControlBar
        controlButtons={[
          ...createTopologyControlButtons({
            ...defaultControlButtonsOptions,
            zoomInCallback: action(() => {
              visualization.getGraph().scaleBy(4 / 3);
            }),
            zoomOutCallback: action(() => {
              visualization.getGraph().scaleBy(0.75);
            }),
            fitToScreenCallback: action(() => {
              visualization.getGraph().fit(80);
            }),
            resetViewCallback: action(() => {
              visualization.getGraph().reset();
              visualization.getGraph().layout();
            }),
            legend: false,
          }),
        ]}
      >
        <div className="odc-topology__layout-group">
          <Tooltip content="Layout 1">
            <PageHeaderToolsItem className="odc-topology__layout-button" tabIndex={-1}>
              <Button
                className={classNames('pf-topology-control-bar__button', {
                  'pf-m-active': layout === COLA_LAYOUT,
                })}
                variant="tertiary"
                onClick={() => setLayout(COLA_LAYOUT)}
              >
                <TopologyIcon className="odc-topology__layout-button__icon" aria-label="Layout" />1
              </Button>
            </PageHeaderToolsItem>
          </Tooltip>
          <Tooltip content="Layout 2">
            <PageHeaderToolsItem className="odc-topology__layout-button" tabIndex={-1}>
              <Button
                className={classNames('pf-topology-control-bar__button', {
                  'pf-m-active': layout === COLA_FORCE_LAYOUT,
                })}
                variant="tertiary"
                onClick={() => setLayout(COLA_FORCE_LAYOUT)}
              >
                <TopologyIcon className="odc-topology__layout-button__icon" aria-label="Layout" />2
              </Button>
            </PageHeaderToolsItem>
          </Tooltip>
        </div>
      </TopologyControlBar>
    );
  };

  const selectedItemDetails = () => {
    const selectedEntity = selectedIds[0] ? visualization.getElementById(selectedIds[0]) : null;
    if (isNode(selectedEntity)) {
      if (selectedEntity.getType() === TYPE_APPLICATION_GROUP) {
        return (
          <TopologyApplicationPanel
            graphData={graphData}
            application={{
              id: selectedEntity.getId(),
              name: selectedEntity.getLabel(),
              resources: selectedEntity.getData().groupResources,
            }}
          />
        );
      }
      // TODO: Use Plugins
      if (selectedEntity.getType() === TYPE_HELM_RELEASE) {
        return <TopologyHelmReleasePanel helmRelease={selectedEntity} />;
      }
      if (selectedEntity.getType() === TYPE_HELM_WORKLOAD) {
        return <TopologyHelmWorkloadPanel item={selectedEntity.getData() as TopologyDataObject} />;
      }
      if (selectedEntity.getType() === TYPE_OPERATOR_BACKED_SERVICE) {
        return null;
      }
      if (selectedEntity.getType() === TYPE_VIRTUAL_MACHINE) {
        return <TopologyVmPanel vmNode={selectedEntity} />;
      }
      return <TopologyResourcePanel item={selectedEntity.getData() as TopologyDataObject} />;
    }

    if (isEdge(selectedEntity)) {
      if (selectedEntity.getType() === TYPE_EVENT_PUB_SUB_LINK) {
        const itemResources = selectedEntity.getData();
        return <KnativeResourceOverviewPage item={itemResources.resources} />;
      }
      return <ConnectedTopologyEdgePanel edge={selectedEntity as BaseEdge} model={filteredModel} />;
    }
    return null;
  };

  const renderSideBar = () => {
    const selectedEntity =
      selectedIds.length === 0 ? null : visualization.getElementById(selectedIds[0]);
    const details = selectedItemDetails();
    if (!selectedEntity || !details) {
      return null;
    }

    return (
      <TopologySideBar show={!!selectedEntity && !!details} onClose={onSidebarClose}>
        {selectedEntity && details}
      </TopologySideBar>
    );
  };

  if (!filteredModel) {
    return null;
  }

  const sideBar = renderSideBar();

  const containerClasses = classNames('pf-topology-container', {
    'pf-topology-container__with-sidebar': sideBar,
    'pf-topology-container__with-sidebar--open': sideBar,
  });

  return (
    <VisualizationProvider controller={visualization}>
      <Stack>
        <StackItem isFilled={false}>
          <TopologyFilterBar visualization={visualization} onSearchChange={onSearchChange} />
        </StackItem>
        <StackItem isFilled className={containerClasses}>
          <div className="pf-topology-content">
            <VisualizationSurface state={{ selectedIds }} />
            {dragHint && <div className="odc-topology__hint-container">{dragHint}</div>}
            <span className="pf-topology-control-bar">{renderControlBar()}</span>
          </div>
          {sideBar}
        </StackItem>
      </Stack>
    </VisualizationProvider>
  );
};

const TopologyStateToProps = (state: RootState): StateProps => {
  return {
    application: getActiveApplication(state),
    eventSourceEnabled: getEventSourceStatus(state),
  };
};

const TopologyDispatchToProps = (dispatch): DispatchProps => ({
  onSelectTab: (name) => dispatch(selectOverviewDetailsTab(name)),
  onFiltersChange: (filters: DisplayFilters) => {
    dispatch(setTopologyFilters(filters));
  },
  onSupportedFiltersChange: (supportedFilterIds: string[]) => {
    dispatch(setSupportedTopologyFilters(supportedFilterIds));
  },
});

export default connect<StateProps, DispatchProps, TopologyProps>(
  TopologyStateToProps,
  TopologyDispatchToProps,
)(Topology);
