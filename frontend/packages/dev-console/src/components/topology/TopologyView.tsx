import * as React from 'react';
import { connect } from 'react-redux';
import {
  BaseEdge,
  BOTTOM_LAYER,
  DEFAULT_LAYER,
  GROUPS_LAYER,
  isEdge,
  isNode,
  Model,
  SELECTION_EVENT,
  SelectionEventListener,
  TOP_LAYER,
  Visualization,
} from '@patternfly/react-topology';
import { useDeepCompareMemoize, useQueryParams } from '@console/shared';
import { useExtensions } from '@console/plugin-sdk';
import { RootState } from '@console/internal/redux';
import { getActiveApplication } from '@console/internal/reducers/ui';
import { getEventSourceStatus } from '@console/knative-plugin/src/topology/knative-topology-utils';
import { removeQueryArgument, setQueryArgument } from '@console/internal/components/utils';
import { selectOverviewDetailsTab } from '@console/internal/actions/ui';
import {
  CreateConnectionGetter,
  DisplayFilters,
  GraphData,
  TopologyApplyDisplayOptions,
  TopologyDataObject,
  TopologyDisplayFilterType,
} from './topology-types';
import {
  isTopologyCreateConnector,
  isTopologyDisplayFilter,
  TopologyCreateConnector,
  TopologyDisplayFilters,
} from '../../extensions/topology';
import {
  getFilterById,
  getTopologySearchQuery,
  SHOW_GROUPS_FILTER_ID,
  useAppliedDisplayFilters,
  useDisplayFilters,
} from './filters';
import { updateModelFromFilters } from './data-transforms';
import {
  setSupportedTopologyFilters,
  setSupportedTopologyKinds,
  setTopologyFilters,
} from './redux/action';
import { useAddToProjectAccess } from '../../utils/useAddToProjectAccess';
import Topology from './Topology';
import TopologyListView from './list-view/TopologyListView';
import { COLA_LAYOUT, layoutFactory } from './layouts/layoutFactory';
import { odcElementFactory } from './elements';
import { TYPE_APPLICATION_GROUP } from './components';
import TopologyApplicationPanel from './application-panel/TopologyApplicationPanel';
import { TYPE_HELM_RELEASE, TYPE_HELM_WORKLOAD } from './helm/components/const';
import TopologyHelmReleasePanel from './helm/TopologyHelmReleasePanel';
import TopologyHelmWorkloadPanel from './helm/TopologyHelmWorkloadPanel';
import { TYPE_OPERATOR_BACKED_SERVICE } from './operators/components/const';
import TopologyOperatorBackedPanel from './operators/TopologyOperatorBackedPanel';
import { TYPE_VIRTUAL_MACHINE } from '@console/kubevirt-plugin/src/topology/components/const';
import TopologyVmPanel from '@console/kubevirt-plugin/src/topology/TopologyVmPanel';
import TopologyResourcePanel from './TopologyResourcePanel';
import {
  TYPE_EVENT_PUB_SUB_LINK,
  TYPE_EVENT_SOURCE_LINK,
  TYPE_REVISION_TRAFFIC,
} from '@console/knative-plugin/src/topology/const';
import KnativeResourceOverviewPage from '@console/knative-plugin/src/components/overview/KnativeResourceOverviewPage';
import KnativeTopologyEdgePanel from '@console/knative-plugin/src/components/overview/KnativeTopologyEdgePanel';
import ConnectedTopologyEdgePanel from './TopologyEdgePanel';
import TopologySideBar from './TopologySideBar';
import { OperatorGroupData } from './operators/operator-topology-types';
import { Stack, StackItem } from '@patternfly/react-core';
import TopologyFilterBar from './filters/TopologyFilterBar';
import * as classNames from 'classnames';

const TOPOLOGY_GRAPH_ID = 'odc-topology-graph';
export const FILTER_ACTIVE_CLASS = 'odc-m-filter-active';

interface StateProps {
  application: string;
  eventSourceEnabled: boolean;
}

interface DispatchProps {
  onSelectTab?: (name: string) => void;
  onFiltersChange: (filters: DisplayFilters) => void;
  onSupportedFiltersChange: (supportedFilterIds: string[]) => void;
  onSupportedKindsChange: (supportedKinds: { [key: string]: number }) => void;
}

interface TopologyViewProps {
  model: Model;
  namespace: string;
  showGraphView: boolean;
}

type ComponentProps = TopologyViewProps & StateProps & DispatchProps;

const graphModel: Model = {
  graph: {
    id: TOPOLOGY_GRAPH_ID,
    type: 'graph',
    layout: COLA_LAYOUT,
    layers: [BOTTOM_LAYER, GROUPS_LAYER, 'groups2', DEFAULT_LAYER, TOP_LAYER],
  },
};

export const TopologyView: React.FC<ComponentProps> = ({
  model,
  namespace,
  showGraphView,
  eventSourceEnabled,
  application,
  onSelectTab,
  onFiltersChange,
  onSupportedFiltersChange,
  onSupportedKindsChange,
}) => {
  const [filteredModel, setFilteredModel] = React.useState<Model>();
  const [storedSelectedIds, setSelectedIds] = React.useState<string[]>([]);
  const selectedIds = useDeepCompareMemoize(storedSelectedIds);
  const createResourceAccess: string[] = useAddToProjectAccess(namespace);
  const displayFilters = useDisplayFilters();
  const showGroupsRef = React.useRef<boolean>();
  const groupsShown = getFilterById(SHOW_GROUPS_FILTER_ID, displayFilters)?.value ?? true;
  const filters = useDeepCompareMemoize(displayFilters);
  const appliedFilters = useAppliedDisplayFilters();
  const [displayFilterers, setDisplayFilterers] = React.useState<TopologyApplyDisplayOptions[]>(
    null,
  );
  const displayFilterExtensions = useExtensions<TopologyDisplayFilters>(isTopologyDisplayFilter);
  const createConnectorExtensions = useExtensions<TopologyCreateConnector>(
    isTopologyCreateConnector,
  );
  const [createConnectors, setCreateConnectors] = React.useState<CreateConnectionGetter[]>(null);
  const [filtersLoaded, setFiltersLoaded] = React.useState<boolean>(false);
  const queryParams = useQueryParams();
  const searchParams = queryParams.get('searchQuery');
  const onSelect = (ids: string[]) => {
    // set empty selection when selecting the graph
    if (!ids || ids.length === 0 || ids[0] === TOPOLOGY_GRAPH_ID) {
      setSelectedIds([]);
      removeQueryArgument('selectId');
    } else {
      setSelectedIds(ids);
      setQueryArgument('selectId', ids[0]);
    }
  };
  const createVisualization = () => {
    const newVisualization = new Visualization();
    newVisualization.registerElementFactory(odcElementFactory);
    newVisualization.registerLayoutFactory(layoutFactory);
    newVisualization.fromModel(graphModel);
    newVisualization.addEventListener<SelectionEventListener>(SELECTION_EVENT, onSelect);
    const newGraphData: GraphData = {
      createResourceAccess,
      namespace,
      eventSourceEnabled,
      createConnectorExtensions: createConnectors,
    };
    newVisualization.getGraph().setData(newGraphData);
    if (filteredModel) {
      newVisualization.fromModel(filteredModel);
    }
    return newVisualization;
  };
  const visualizationRef = React.useRef<Visualization>();
  if (!visualizationRef.current) {
    visualizationRef.current = createVisualization();
  }
  const visualization = visualizationRef.current;

  const createConnectorPromises = React.useMemo(
    () => createConnectorExtensions.map((creator) => creator.properties.getCreateConnector()),
    [createConnectorExtensions],
  );

  React.useEffect(() => {
    if (createConnectorPromises) {
      Promise.all(createConnectorPromises)
        .then((res) => {
          setCreateConnectors(res);
        })
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
      Promise.all(displayFilterPromises)
        .then((res) => {
          setDisplayFilterers(res);
        })
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

  React.useEffect(() => {
    if (displayFilterers && filtersLoaded) {
      const newModel = updateModelFromFilters(
        model,
        filters,
        application,
        displayFilterers,
        onSupportedFiltersChange,
        onSupportedKindsChange,
      );
      setFilteredModel(newModel);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [model, filters, application, displayFilterers, filtersLoaded]);

  React.useEffect(() => {
    if (filters.find((f) => f.type !== TopologyDisplayFilterType.kind)) {
      const updatedFilters = filters.filter((f) => f.type !== TopologyDisplayFilterType.kind);
      onFiltersChange(updatedFilters);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [namespace]);

  React.useEffect(() => {
    if (visualization) {
      const newGraphData: GraphData = {
        createResourceAccess,
        namespace,
        eventSourceEnabled,
        createConnectorExtensions: createConnectors,
      };
      visualization.getGraph().setData(newGraphData);
    }
  }, [createResourceAccess, createConnectors, eventSourceEnabled, visualization, namespace]);

  React.useEffect(() => {
    const searchQuery = getTopologySearchQuery();
    if (searchQuery.length > 0) {
      document.body.classList.add(FILTER_ACTIVE_CLASS);
    } else {
      document.body.classList.remove(FILTER_ACTIVE_CLASS);
    }
  }, [searchParams]);

  React.useEffect(() => {
    if (filteredModel) {
      visualization.fromModel(filteredModel);
      let selectedItem = selectedIds.length ? visualization.getElementById(selectedIds[0]) : null;
      if (!selectedItem || !selectedItem.isVisible()) {
        onSelect([]);
      } else {
        const selectId = queryParams.get('selectId');
        if (selectId) {
          selectedItem = visualization.getElementById(selectId);
          if (selectedItem && selectedItem.isVisible()) {
            setSelectedIds([selectId]);
            const selectTab = queryParams.get('selectTab');
            if (selectTab) {
              onSelectTab(selectTab);
            }
          } else {
            onSelect([]);
          }
        }
        removeQueryArgument('selectTab');
      }
      if (showGraphView) {
        if (groupsShown && showGroupsRef.current === false) {
          showGroupsRef.current = groupsShown;
          visualization.getGraph().layout();
        }
        showGroupsRef.current = groupsShown;
      } else {
        showGroupsRef.current = undefined;
      }
    }
    // Do not update on groupsShown change, filterModel will get updated and we want to wait to layout
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filteredModel, onSelectTab, queryParams, selectedIds, showGraphView, visualization]);

  const viewContent = React.useMemo(
    () =>
      showGraphView ? (
        <Topology
          visualization={visualization}
          namespace={namespace}
          application={application}
          selectedIds={selectedIds}
        />
      ) : (
        <TopologyListView
          visualization={visualization}
          namespace={namespace}
          application={application}
          selectedIds={selectedIds}
          onSelect={onSelect}
        />
      ),
    [application, namespace, selectedIds, showGraphView, visualization],
  );

  if (!filteredModel) {
    return null;
  }

  const onSidebarClose = () => {
    onSelect([]);
  };

  const selectedItemDetails = () => {
    const selectedEntity = selectedIds[0] ? visualization.getElementById(selectedIds[0]) : null;
    if (isNode(selectedEntity)) {
      if (selectedEntity.getType() === TYPE_APPLICATION_GROUP) {
        return (
          <TopologyApplicationPanel
            graphData={visualization.getGraph().getData()}
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
        return (
          <TopologyOperatorBackedPanel
            item={selectedEntity.getData() as TopologyDataObject<OperatorGroupData>}
          />
        );
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
      if ([TYPE_REVISION_TRAFFIC, TYPE_EVENT_SOURCE_LINK].includes(selectedEntity.getType())) {
        return <KnativeTopologyEdgePanel edge={selectedEntity as BaseEdge} />;
      }
      return <ConnectedTopologyEdgePanel edge={selectedEntity as BaseEdge} />;
    }
    return null;
  };

  const renderSideBar = () => {
    if (!visualization || selectedIds.length === 0) {
      return null;
    }
    const selectedEntity = visualization.getElementById(selectedIds[0]);
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

  const sideBar = renderSideBar();

  const containerClasses = classNames('pf-topology-container', {
    'pf-topology-container__with-sidebar': sideBar,
    'pf-topology-container__with-sidebar--open': sideBar,
  });

  return (
    <div className="odc-topology">
      <Stack>
        <StackItem isFilled={false}>
          <TopologyFilterBar showGraphView={showGraphView} visualization={visualization} />
        </StackItem>
        <StackItem isFilled className={containerClasses}>
          <div className="pf-topology-content">{viewContent}</div>
          {sideBar}
        </StackItem>
      </Stack>
    </div>
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
  onSupportedKindsChange: (supportedKinds: { [key: string]: number }) => {
    dispatch(setSupportedTopologyKinds(supportedKinds));
  },
});

export const ConnectedTopologyView = connect<StateProps, DispatchProps, TopologyViewProps>(
  TopologyStateToProps,
  TopologyDispatchToProps,
)(TopologyView);
