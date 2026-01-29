import type { FC } from 'react';
import { useContext, useState, useRef, useCallback, useMemo, useEffect } from 'react';
import { Drawer, DrawerContent, DrawerContentBody, Stack, StackItem } from '@patternfly/react-core';
import { css } from '@patternfly/react-styles';
import {
  GraphElement,
  isGraph,
  Model,
  TopologyQuadrant,
  Visualization,
} from '@patternfly/react-topology';
import { ConnectDropTarget, DropTargetMonitor } from 'react-dnd';
import { useTranslation } from 'react-i18next';
import { connect } from 'react-redux';
import {
  FileUploadContextType,
  FileUploadContext,
} from '@console/app/src/components/file-upload/file-upload-context';
import { useAddToProjectAccess } from '@console/dev-console/src/utils/useAddToProjectAccess';
import { useResolvedExtensions } from '@console/dynamic-plugin-sdk/src/api/useResolvedExtensions';
import {
  isTopologyCreateConnector,
  isTopologyDecoratorProvider,
  isTopologyDisplayFilters,
  TopologyCreateConnector,
  TopologyDecoratorProvider,
  TopologyDisplayFilters,
  TopologyRelationshipProvider,
  isTopologyRelationshipProvider,
} from '@console/dynamic-plugin-sdk/src/extensions/topology';
import { selectOverviewDetailsTab } from '@console/internal/actions/ui';
import { useQueryParamsMutator } from '@console/internal/components/utils/router';
import { getActiveApplication } from '@console/internal/reducers/ui';
import { RootState } from '@console/internal/redux';
import { getEventSourceStatus } from '@console/knative-plugin/src/topology/knative-topology-utils';
import { useDeepCompareMemoize, useQueryParams } from '@console/shared';
import { useTelemetry } from '@console/shared/src/hooks/useTelemetry';
import { LAST_TOPOLOGY_OVERVIEW_OPEN_STORAGE_KEY } from '../../const';
import { updateModelFromFilters } from '../../data-transforms/updateModelFromFilters';
import {
  getTopologySearchQuery,
  TOPOLOGY_LABELS_FILTER_KEY,
  TOPOLOGY_SEARCH_FILTER_KEY,
  useAppliedDisplayFilters,
  useDisplayFilters,
} from '../../filters';
import { FilterContext } from '../../filters/FilterProvider';
import TopologyFilterBar from '../../filters/TopologyFilterBar';
import { setSupportedTopologyFilters, setSupportedTopologyKinds } from '../../redux/action';
import {
  GraphData,
  TopologyDecorator,
  TopologyDisplayFilterType,
  TopologyViewType,
} from '../../topology-types';
import Topology from '../graph-view/Topology';
import TopologyListView from '../list-view/TopologyListView';
import TopologyQuickSearch from '../quick-search/TopologyQuickSearch';
import { isSidebarRenderable, SelectedEntityDetails } from '../side-bar/SelectedEntityDetails';
import TopologySideBar from '../side-bar/TopologySideBar';
import { LimitExceededState } from './LimitExceededState';
import TopologyEmptyState from './TopologyEmptyState';

import './TopologyView.scss';

const FILTER_ACTIVE_CLASS = 'odc-m-filter-active';
const MAX_NODES_LIMIT = 300;

interface StateProps {
  application?: string;
  eventSourceEnabled?: boolean;
}

interface DispatchProps {
  onSelectTab?: (name: string) => void;
  onSupportedFiltersChange?: (supportedFilterIds: string[]) => void;
  onSupportedKindsChange?: (supportedKinds: { [key: string]: number }) => void;
}

export interface TopologyViewProps {
  model: Model;
  namespace: string;
  viewType: TopologyViewType;
  connectDropTarget?: ConnectDropTarget;
  isOver?: boolean;
  canDrop?: boolean;
  onDrop?: (monitor: DropTargetMonitor) => void;
  canDropFile?: boolean;
}

type ComponentProps = TopologyViewProps & StateProps & DispatchProps;

export const ConnectedTopologyView: FC<ComponentProps> = ({
  model,
  namespace,
  viewType,
  eventSourceEnabled,
  application,
  onSupportedFiltersChange,
  onSupportedKindsChange,
  connectDropTarget,
  isOver,
  canDrop,
}) => {
  const { t } = useTranslation();
  const fireTelemetryEvent = useTelemetry();
  const { setTopologyFilters: onFiltersChange } = useContext(FilterContext);
  const { getQueryArgument, setQueryArgument, removeQueryArgument } = useQueryParamsMutator();
  const [filteredModel, setFilteredModel] = useState<Model>();
  const [selectedEntity, setSelectedEntity] = useState<GraphElement>(null);
  const [visualization, setVisualization] = useState<Visualization>();
  const [showTopologyAnyway, setShowTopologyAnyway] = useState(false);
  const displayFilters = useDisplayFilters();
  const filters = useDeepCompareMemoize(displayFilters);
  const applicationRef = useRef<string>(null);
  const createResourceAccess: string[] = useAddToProjectAccess(namespace);
  const [isQuickSearchOpen, setIsQuickSearchOpen] = useState<boolean>(
    typeof getQueryArgument('catalogSearch') === 'string',
  );
  const setIsQuickSearchOpenAndFireEvent = useCallback(
    (open: boolean) => {
      if (open) {
        fireTelemetryEvent('Quick Search Accessed');
      }
      setIsQuickSearchOpen(open);
    },
    [fireTelemetryEvent],
  );
  const appliedFilters = useAppliedDisplayFilters();

  const [displayFilterExtensions, displayFilterExtensionsResolved] = useResolvedExtensions<
    TopologyDisplayFilters
  >(isTopologyDisplayFilters);
  const [createConnectors, createConnectorsResolved] = useResolvedExtensions<
    TopologyCreateConnector
  >(isTopologyCreateConnector);
  const [extensionDecorators, extensionDecoratorsResolved] = useResolvedExtensions<
    TopologyDecoratorProvider
  >(isTopologyDecoratorProvider);
  const [relationshipProvider] = useResolvedExtensions<TopologyRelationshipProvider>(
    isTopologyRelationshipProvider,
  );

  const [topologyDecorators, setTopologyDecorators] = useState<{
    [key: string]: TopologyDecorator[];
  }>({});
  const [filtersLoaded, setFiltersLoaded] = useState<boolean>(false);
  const queryParams = useQueryParams();
  const { extensions: supportedFileExtensions } = useContext<FileUploadContextType>(
    FileUploadContext,
  );

  const searchParams = queryParams.get(TOPOLOGY_SEARCH_FILTER_KEY);
  const labelParams = queryParams.get(TOPOLOGY_LABELS_FILTER_KEY);
  const fileTypes = supportedFileExtensions.map((ex) => `.${ex}`).toString();

  const onSelect = useCallback(
    (entity?: GraphElement) => {
      // set empty selection when selecting the graph
      const selEntity = isGraph(entity) ? undefined : entity;
      setSelectedEntity(selEntity);
      if (!selEntity) {
        removeQueryArgument('selectId');
        sessionStorage.removeItem(LAST_TOPOLOGY_OVERVIEW_OPEN_STORAGE_KEY);
      } else {
        setQueryArgument('selectId', selEntity.getId());
        sessionStorage.setItem(
          LAST_TOPOLOGY_OVERVIEW_OPEN_STORAGE_KEY,
          JSON.stringify({ [namespace]: selEntity.getId() }),
        );
      }
    },
    [namespace, removeQueryArgument, setQueryArgument],
  );

  const graphData: GraphData = useMemo(
    () => ({
      createResourceAccess,
      namespace,
      eventSourceEnabled,
      createConnectorExtensions: createConnectorsResolved
        ? createConnectors.map((creator) => creator.properties.getCreateConnector)
        : [],
      decorators: topologyDecorators,
      relationshipProviderExtensions: relationshipProvider,
    }),
    [
      createConnectors,
      createConnectorsResolved,
      createResourceAccess,
      eventSourceEnabled,
      namespace,
      relationshipProvider,
      topologyDecorators,
    ],
  );

  useEffect(() => {
    if (visualization) {
      visualization.getGraph().setData(graphData);
    }
  }, [visualization, graphData]);

  useEffect(() => {
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
          [TopologyQuadrant.upperLeft]: [],
          [TopologyQuadrant.upperRight]: [],
          [TopologyQuadrant.lowerLeft]: [],
          [TopologyQuadrant.lowerRight]: [],
        },
      );
      Object.keys(allDecorators).forEach((key) =>
        allDecorators[key].sort((a, b) => a.priority - b.priority),
      );
      setTopologyDecorators(allDecorators);
    }
  }, [extensionDecorators, extensionDecoratorsResolved]);

  useEffect(() => {
    if (displayFilterExtensionsResolved) {
      const updateFilters = [...filters];
      displayFilterExtensions.forEach((extension) => {
        const extFilters = extension.properties.getTopologyFilters();
        extFilters?.forEach((filter) => {
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

  useEffect(() => {
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

  useEffect(() => {
    if (filters.find((f) => f.type !== TopologyDisplayFilterType.kind)) {
      const updatedFilters = filters.filter((f) => f.type !== TopologyDisplayFilterType.kind);
      onFiltersChange(updatedFilters);
    }
    // Only clear kind filters on namespace change
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [namespace]);

  useEffect(() => {
    const searchQuery = getTopologySearchQuery();
    if (searchQuery.length > 0) {
      document.body.classList.add(FILTER_ACTIVE_CLASS);
    } else {
      document.body.classList.remove(FILTER_ACTIVE_CLASS);
    }
  }, [searchParams, labelParams]);

  const nodesLength = filteredModel?.nodes?.length ?? 0;

  const viewContent = useMemo(
    () =>
      nodesLength <= MAX_NODES_LIMIT || showTopologyAnyway ? (
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
        )
      ) : null,
    [filteredModel, namespace, onSelect, viewType, nodesLength, showTopologyAnyway],
  );

  const isSidebarAvailable = isSidebarRenderable(selectedEntity);

  if (!filteredModel) {
    return null;
  }

  const topologyViewComponent = (
    <div className="odc-topology">
      <Stack>
        <StackItem isFilled={false}>
          <TopologyFilterBar
            viewType={viewType}
            visualization={visualization}
            setIsQuickSearchOpen={setIsQuickSearchOpenAndFireEvent}
            isDisabled={
              !model.nodes?.length || (nodesLength > MAX_NODES_LIMIT && !showTopologyAnyway)
            }
          />
        </StackItem>
        <StackItem isFilled className="pf-topology-container">
          <div className="co-file-dropzone co-file-dropzone__flex">
            <Drawer isExpanded={isSidebarAvailable} isInline>
              <DrawerContent
                panelContent={
                  <TopologySideBar onClose={() => onSelect()}>
                    <SelectedEntityDetails selectedEntity={selectedEntity} />
                  </TopologySideBar>
                }
              >
                <DrawerContentBody>
                  <div className="pf-topology-content ocs-quick-search-modal__no-backdrop">
                    {canDrop && isOver && (
                      <div
                        className={css(
                          'co-file-dropzone-container',
                          'co-file-dropzone--drop-over',
                          'odc-topology__dropzone',
                        )}
                      >
                        <span className="co-file-dropzone__drop-text odc-topology__dropzone-text">
                          {t('topology~Drop file ({{fileTypes}}) here', { fileTypes })}
                        </span>
                      </div>
                    )}
                    {nodesLength > MAX_NODES_LIMIT && !showTopologyAnyway ? (
                      <LimitExceededState
                        onShowTopologyAnyway={() => setShowTopologyAnyway(true)}
                      />
                    ) : (
                      viewContent
                    )}
                    {!model.nodes?.length ? (
                      <TopologyEmptyState setIsQuickSearchOpen={setIsQuickSearchOpenAndFireEvent} />
                    ) : null}
                  </div>
                </DrawerContentBody>
              </DrawerContent>
            </Drawer>
          </div>
        </StackItem>
        <TopologyQuickSearch
          namespace={namespace}
          isOpen={isQuickSearchOpen}
          setIsOpen={setIsQuickSearchOpenAndFireEvent}
        />
      </Stack>
    </div>
  );

  return typeof connectDropTarget === 'function'
    ? connectDropTarget(topologyViewComponent)
    : topologyViewComponent;
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
