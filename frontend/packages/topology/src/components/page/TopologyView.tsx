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
import { useAddToProjectAccess } from '@console/dev-console/src/utils/useAddToProjectAccess';
import { getEventSourceStatus } from '@console/knative-plugin/src/topology/knative-topology-utils';
import {
  CreateConnectionGetter,
  DisplayFilters,
  GraphData,
  TopologyApplyDisplayOptions,
  TopologyDisplayFilterType,
  TopologyViewType,
} from '../../topology-types';
import {
  isTopologyCreateConnector,
  isTopologyDisplayFilter,
  TopologyCreateConnector,
  TopologyDisplayFilters,
} from '../../extensions/topology';
import { getTopologySearchQuery, useAppliedDisplayFilters, useDisplayFilters } from '../../filters';
import { updateModelFromFilters } from '../../data-transforms/updateModelFromFilters';
import {
  setSupportedTopologyFilters,
  setSupportedTopologyKinds,
  setTopologyFilters,
} from '../../redux/action';
import Topology from '../graph-view/Topology';
import TopologyListView from '../list-view/TopologyListView';
import TopologyFilterBar from '../../filters/TopologyFilterBar';
import { getTopologySideBar } from '../side-bar/TopologySideBar';

import './TopologyView.scss';

const FILTER_ACTIVE_CLASS = 'odc-m-filter-active';

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
  viewType: TopologyViewType;
}

type ComponentProps = TopologyViewProps & StateProps & DispatchProps;

export const ConnectedTopologyView: React.FC<ComponentProps> = ({
  model,
  namespace,
  viewType,
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
  const applicationRef = React.useRef<string>(null);
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

  const onSelect = React.useCallback((entity?: GraphElement) => {
    // set empty selection when selecting the graph
    const selEntity = isGraph(entity) ? undefined : entity;
    setSelectedEntity(selEntity);
    if (!selEntity) {
      removeQueryArgument('selectId');
    } else {
      setQueryArgument('selectId', selEntity.getId());
    }
  }, []);

  const graphData: GraphData = React.useMemo(
    () => ({
      createResourceAccess,
      namespace,
      eventSourceEnabled,
      createConnectorExtensions: createConnectors,
    }),
    [createConnectors, createResourceAccess, eventSourceEnabled, namespace],
  );

  React.useEffect(() => {
    if (visualization) {
      visualization.getGraph().setData(graphData);
    }
  }, [visualization, graphData]);

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
      applicationRef.current = application;
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
      viewType === TopologyViewType.graph ? (
        <Topology
          model={filteredModel}
          namespace={namespace}
          application={applicationRef.current}
          onSelect={onSelect}
          setVisualization={setVisualization}
        />
      ) : (
        <TopologyListView
          model={filteredModel}
          namespace={namespace}
          onSelect={onSelect}
          setVisualization={setVisualization}
        />
      ),
    [filteredModel, namespace, onSelect, viewType],
  );

  const topologyFilterBar = React.useMemo(
    () => <TopologyFilterBar viewType={viewType} visualization={visualization} />,
    [viewType, visualization],
  );

  const topologySideBar = React.useMemo(
    () => getTopologySideBar(visualization, selectedEntity, () => onSelect()),
    [onSelect, selectedEntity, visualization],
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

export default connect<StateProps, DispatchProps, TopologyViewProps>(
  TopologyStateToProps,
  TopologyDispatchToProps,
)(ConnectedTopologyView);
