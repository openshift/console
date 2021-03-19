import * as React from 'react';
import { connect } from 'react-redux';
import { Drawer, DrawerContent, DrawerContentBody, Stack, StackItem } from '@patternfly/react-core';
import {
  GraphElement,
  isEdge,
  isGraph,
  isNode,
  Model,
  Visualization,
} from '@patternfly/react-topology';
import { useDeepCompareMemoize, useQueryParams } from '@console/shared';
import { RootState } from '@console/internal/redux';
import { selectOverviewDetailsTab } from '@console/internal/actions/ui';
import { getActiveApplication } from '@console/internal/reducers/ui';
import {
  getQueryArgument,
  removeQueryArgument,
  setQueryArgument,
} from '@console/internal/components/utils';
import { useResolvedExtensions } from '@console/dynamic-plugin-sdk/src/api/useResolvedExtensions';
import { useAddToProjectAccess } from '@console/dev-console/src/utils/useAddToProjectAccess';
import { getEventSourceStatus } from '@console/knative-plugin/src/topology/knative-topology-utils';
import {
  GraphData,
  TopologyDecorator,
  TopologyDecoratorQuadrant,
  TopologyDisplayFilterType,
  TopologyViewType,
} from '../../topology-types';
import {
  isTopologyCreateConnector,
  isTopologyDecoratorProvider,
  isTopologyDisplayFilter,
  TopologyCreateConnector,
  TopologyDecoratorProvider,
  TopologyDisplayFilters,
} from '../../extensions/topology';
import { getTopologySearchQuery, useAppliedDisplayFilters, useDisplayFilters } from '../../filters';
import { updateModelFromFilters } from '../../data-transforms/updateModelFromFilters';
import { setSupportedTopologyFilters, setSupportedTopologyKinds } from '../../redux/action';
import Topology from '../graph-view/Topology';
import TopologyListView from '../list-view/TopologyListView';
import TopologyFilterBar from '../../filters/TopologyFilterBar';
import TopologySideBar from '../side-bar/TopologySideBar';
import { FilterContext } from '../../filters/FilterProvider';
import TopologyEmptyState from './TopologyEmptyState';
import QuickSearch from '../quick-search/QuickSearch';

import './TopologyView.scss';

const FILTER_ACTIVE_CLASS = 'odc-m-filter-active';

interface StateProps {
  application: string;
  eventSourceEnabled: boolean;
}

interface DispatchProps {
  onSelectTab?: (name: string) => void;
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
  onSupportedFiltersChange,
  onSupportedKindsChange,
}) => {
  const [viewContainer, setViewContainer] = React.useState<HTMLElement>(null);
  const { setTopologyFilters: onFiltersChange } = React.useContext(FilterContext);
  const [filteredModel, setFilteredModel] = React.useState<Model>();
  const [selectedEntity, setSelectedEntity] = React.useState<GraphElement>(null);
  const [visualization, setVisualization] = React.useState<Visualization>();
  const displayFilters = useDisplayFilters();
  const filters = useDeepCompareMemoize(displayFilters);
  const applicationRef = React.useRef<string>(null);
  const createResourceAccess: string[] = useAddToProjectAccess(namespace);
  const [isQuickSearchOpen, setIsQuickSearchOpen] = React.useState<boolean>(
    !!getQueryArgument('catalogSearch'),
  );
  const appliedFilters = useAppliedDisplayFilters();
  const [displayFilterExtensions, displayFilterExtensionsResolved] = useResolvedExtensions<
    TopologyDisplayFilters
  >(isTopologyDisplayFilter);
  const [createConnectors, createConnectorsResolved] = useResolvedExtensions<
    TopologyCreateConnector
  >(isTopologyCreateConnector);
  const [extensionDecorators, extensionDecoratorsResolved] = useResolvedExtensions<
    TopologyDecoratorProvider
  >(isTopologyDecoratorProvider);
  const [topologyDecorators, setTopologyDecorators] = React.useState<{
    [key: string]: TopologyDecorator[];
  }>({});
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
      createConnectorExtensions: createConnectorsResolved
        ? createConnectors.map((creator) => creator.properties.getCreateConnector)
        : [],
      decorators: topologyDecorators,
    }),
    [
      createConnectors,
      createConnectorsResolved,
      createResourceAccess,
      eventSourceEnabled,
      namespace,
      topologyDecorators,
    ],
  );

  React.useEffect(() => {
    if (visualization) {
      visualization.getGraph().setData(graphData);
    }
  }, [visualization, graphData]);

  React.useEffect(() => {
    if (extensionDecoratorsResolved) {
      const allDecorators = extensionDecorators.reduce(
        (acc, extensionDecorator) => {
          const decorator: TopologyDecorator = extensionDecorator.properties;
          if (!acc[decorator.quadrant]) {
            acc[decorator.quadrant] = [];
          }
          acc[decorator.quadrant].push(decorator);
          return acc;
        },
        {
          [TopologyDecoratorQuadrant.upperLeft]: [],
          [TopologyDecoratorQuadrant.upperRight]: [],
          [TopologyDecoratorQuadrant.lowerLeft]: [],
          [TopologyDecoratorQuadrant.lowerRight]: [],
        },
      );
      Object.keys(allDecorators).forEach((key) =>
        allDecorators[key].sort((a, b) => a.priority - b.priority),
      );
      setTopologyDecorators(allDecorators);
    }
  }, [extensionDecorators, extensionDecoratorsResolved]);

  React.useEffect(() => {
    if (displayFilterExtensionsResolved) {
      const updateFilters = [...filters];
      displayFilterExtensions.forEach((extension) => {
        const extFilters = extension.properties.getTopologyFilters();
        extFilters.forEach((filter) => {
          if (!updateFilters.find((f) => f.id === filter.id)) {
            if (appliedFilters[filter.id] !== undefined) {
              filter.value = appliedFilters[filter.id];
            }
            updateFilters.push(filters.find((f) => f.id === filter.id) || filter);
          }
        });
        onFiltersChange(updateFilters);
        setFiltersLoaded(true);
      });
    }
    // Only update on extension changes
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [displayFilterExtensionsResolved, displayFilterExtensions]);

  React.useEffect(() => {
    if (filtersLoaded) {
      const newModel = updateModelFromFilters(
        model,
        filters,
        application,
        displayFilterExtensions.map((extension) => extension.properties.applyDisplayOptions),
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
    filtersLoaded,
    onSupportedFiltersChange,
    onSupportedKindsChange,
    displayFilterExtensions,
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
      viewType === TopologyViewType.list ? (
        <TopologyListView
          model={filteredModel}
          namespace={namespace}
          onSelect={onSelect}
          setVisualization={setVisualization}
        />
      ) : (
        <Topology
          model={filteredModel}
          namespace={namespace}
          application={applicationRef.current}
          onSelect={onSelect}
          setVisualization={setVisualization}
        />
      ),
    [filteredModel, namespace, onSelect, viewType],
  );

  if (!filteredModel) {
    return null;
  }

  return (
    <div className="odc-topology">
      <Stack>
        <StackItem isFilled={false}>
          <TopologyFilterBar
            viewType={viewType}
            visualization={visualization}
            setIsQuickSearchOpen={setIsQuickSearchOpen}
            isDisabled={!model?.nodes?.length}
          />
        </StackItem>
        <StackItem isFilled className="pf-topology-container">
          <Drawer isExpanded={isNode(selectedEntity) || isEdge(selectedEntity)} isInline>
            <DrawerContent
              panelContent={
                <TopologySideBar onClose={() => onSelect()} selectedEntity={selectedEntity} />
              }
            >
              <DrawerContentBody>
                <div ref={setViewContainer} className="pf-topology-content">
                  {viewContent}
                  {!model?.nodes?.length ? (
                    <TopologyEmptyState setIsQuickSearchOpen={setIsQuickSearchOpen} />
                  ) : null}
                </div>
              </DrawerContentBody>
            </DrawerContent>
          </Drawer>
        </StackItem>
        <QuickSearch
          namespace={namespace}
          viewContainer={viewContainer}
          isOpen={isQuickSearchOpen}
          setIsOpen={setIsQuickSearchOpen}
        />
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
