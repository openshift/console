import * as React from 'react';
import * as classNames from 'classnames';
import { connect } from 'react-redux';
import { Stack, StackItem } from '@patternfly/react-core';
import { GraphElement, isGraph, Model, Visualization } from '@patternfly/react-topology';
import { useDeepCompareMemoize, useQueryParams } from '@console/shared';
import { useExtensions } from '@console/plugin-sdk';
import { RootState } from '@console/internal/redux';
import { selectOverviewDetailsTab } from '@console/internal/actions/ui';
import { getActiveApplication } from '@console/internal/reducers/ui';
import { removeQueryArgument, setQueryArgument } from '@console/internal/components/utils';
import { getEventSourceStatus } from '@console/knative-plugin/src/topology/knative-topology-utils';
import {
  CreateConnectionGetter,
  DisplayFilters,
  GraphData,
  TopologyApplyDisplayOptions,
  TopologyDisplayFilterType,
} from './topology-types';
import {
  isTopologyCreateConnector,
  isTopologyDisplayFilter,
  TopologyCreateConnector,
  TopologyDisplayFilters,
} from '../../extensions/topology';
import { getTopologySearchQuery, useAppliedDisplayFilters, useDisplayFilters } from './filters';
import { updateModelFromFilters } from './data-transforms';
import {
  setSupportedTopologyFilters,
  setSupportedTopologyKinds,
  setTopologyFilters,
} from './redux/action';
import Topology from './Topology';
import TopologyListView from './list-view/TopologyListView';
import TopologyFilterBar from './filters/TopologyFilterBar';
import { useAddToProjectAccess } from '../../utils/useAddToProjectAccess';
import { getTopologySideBar } from './TopologySideBar';

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

export const TopologyView: React.FC<ComponentProps> = ({
  model,
  namespace,
  showGraphView,
  eventSourceEnabled,
  application,
  onFiltersChange,
  onSupportedFiltersChange,
  onSupportedKindsChange,
}) => {
  const [filteredModel, setFilteredModel] = React.useState<Model>();
  const [selectedEntity, setSelectedEntity] = React.useState<GraphElement>(null);
  const [visualization, setVisualization] = React.useState<Visualization>();
  const displayFilters = useDisplayFilters();
  const filters = useDeepCompareMemoize(displayFilters);
  const createResourceAccess: string[] = useAddToProjectAccess(namespace);
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

  const onSelect = (entity?: GraphElement) => {
    // set empty selection when selecting the graph
    const selEntity = isGraph(entity) ? undefined : entity;
    setSelectedEntity(selEntity);
    if (!selEntity) {
      removeQueryArgument('selectId');
    } else {
      setQueryArgument('selectId', selEntity.getId());
    }
  };

  const onVisualizationChange = React.useCallback(
    (vis: Visualization) => {
      const graphData: GraphData = {
        createResourceAccess,
        namespace,
        eventSourceEnabled,
        createConnectorExtensions: createConnectors,
      };
      vis.getGraph().setData(graphData);

      setVisualization(vis);
    },
    [createConnectors, createResourceAccess, eventSourceEnabled, namespace],
  );

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
  }, [
    model,
    filters,
    application,
    displayFilterers,
    filtersLoaded,
    onSupportedFiltersChange,
    onSupportedKindsChange,
  ]);

  React.useEffect(() => {
    if (filters.find((f) => f.type !== TopologyDisplayFilterType.kind)) {
      const updatedFilters = filters.filter((f) => f.type !== TopologyDisplayFilterType.kind);
      onFiltersChange(updatedFilters);
    }
    // Only clear kind filters on namespace change
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [namespace]);

  React.useEffect(() => {
    const searchQuery = getTopologySearchQuery();
    if (searchQuery.length > 0) {
      document.body.classList.add(FILTER_ACTIVE_CLASS);
    } else {
      document.body.classList.remove(FILTER_ACTIVE_CLASS);
    }
  }, [searchParams]);

  const viewContent = React.useMemo(
    () =>
      showGraphView ? (
        <Topology
          model={filteredModel}
          namespace={namespace}
          application={application}
          onSelect={onSelect}
          setVisualization={onVisualizationChange}
        />
      ) : (
        <TopologyListView
          model={filteredModel}
          namespace={namespace}
          application={application}
          onSelect={onSelect}
          setVisualization={onVisualizationChange}
        />
      ),
    [application, filteredModel, namespace, onVisualizationChange, showGraphView],
  );

  const topologyFilterBar = React.useMemo(
    () => <TopologyFilterBar showGraphView={showGraphView} visualization={visualization} />,
    [showGraphView, visualization],
  );

  const topologySideBar = React.useMemo(
    () => getTopologySideBar(visualization, selectedEntity, () => onSelect()),
    [selectedEntity, visualization],
  );

  if (!filteredModel) {
    return null;
  }

  const containerClasses = classNames('pf-topology-container', {
    'pf-topology-container__with-sidebar': topologySideBar.shown,
    'pf-topology-container__with-sidebar--open': topologySideBar.shown,
  });

  return (
    <div className="odc-topology">
      <Stack>
        <StackItem isFilled={false}>{topologyFilterBar}</StackItem>
        <StackItem isFilled className={containerClasses}>
          <div className="pf-topology-content">{viewContent}</div>
          {topologySideBar.sidebar}
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
