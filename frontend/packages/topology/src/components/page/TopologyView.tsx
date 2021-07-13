import * as React from 'react';
import { Stack, StackItem } from '@patternfly/react-core';
import { GraphElement, isGraph, Model, Visualization } from '@patternfly/react-topology';
import * as classNames from 'classnames';
import { ConnectDropTarget, DropTargetMonitor } from 'react-dnd';
import { useTranslation } from 'react-i18next';
import { connect } from 'react-redux';
import {
  FileUploadContextType,
  FileUploadContext,
} from '@console/app/src/components/file-upload/file-upload-context';
import { useAddToProjectAccess } from '@console/dev-console/src/utils/useAddToProjectAccess';
import {
  useResolvedExtensions,
  isTopologyCreateConnector as isDynamicTopologyCreateConnector,
  isTopologyDecoratorProvider as isDynamicTopologyDecoratorProvider,
  isTopologyDisplayFilters as isDynamicTopologyDisplayFilters,
  TopologyCreateConnector as DynamicTopologyCreateConnector,
  TopologyDecoratorProvider as DynamicTopologyDecoratorProvider,
  TopologyDisplayFilters as DynamicTopologyDisplayFilters,
} from '@console/dynamic-plugin-sdk';
import { selectOverviewDetailsTab } from '@console/internal/actions/ui';
import {
  getQueryArgument,
  removeQueryArgument,
  setQueryArgument,
} from '@console/internal/components/utils';
import { getActiveApplication } from '@console/internal/reducers/ui';
import { RootState } from '@console/internal/redux';
import { getEventSourceStatus } from '@console/knative-plugin/src/topology/knative-topology-utils';
import { useDeepCompareMemoize, useQueryParams } from '@console/shared';
import { useTelemetry } from '@console/shared/src/hooks/useTelemetry';
import { updateModelFromFilters } from '../../data-transforms/updateModelFromFilters';
import {
  isTopologyCreateConnector,
  isTopologyDecoratorProvider,
  isTopologyDisplayFilters,
  TopologyCreateConnector,
  TopologyDecoratorProvider,
  TopologyDisplayFilters,
} from '../../extensions/topology';
import { getTopologySearchQuery, useAppliedDisplayFilters, useDisplayFilters } from '../../filters';
import { FilterContext } from '../../filters/FilterProvider';
import TopologyFilterBar from '../../filters/TopologyFilterBar';
import { setSupportedTopologyFilters, setSupportedTopologyKinds } from '../../redux/action';
import {
  GraphData,
  TopologyDecorator,
  TopologyDecoratorQuadrant,
  TopologyDisplayFilterType,
  TopologyViewType,
} from '../../topology-types';
import Topology from '../graph-view/Topology';
import TopologyListView from '../list-view/TopologyListView';
import TopologyQuickSearch from '../quick-search/TopologyQuickSearch';
import { getSelectedEntityDetails } from '../side-bar/getSelectedEntityDetails';
import TopologySideBar from '../side-bar/TopologySideBar';
import TopologyEmptyState from './TopologyEmptyState';

import './TopologyView.scss';

const FILTER_ACTIVE_CLASS = 'odc-m-filter-active';

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

export const ConnectedTopologyView: React.FC<ComponentProps> = ({
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
    typeof getQueryArgument('catalogSearch') === 'string',
  );
  const setIsQuickSearchOpenAndFireEvent = React.useCallback(
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

  const [
    dynamicDisplayFilterExtensions,
    dynamicDisplayFilterExtensionsResolved,
  ] = useResolvedExtensions<DynamicTopologyDisplayFilters>(isDynamicTopologyDisplayFilters);
  const [dynamicCreateConnectors, dynamicCreateConnectorsResolved] = useResolvedExtensions<
    DynamicTopologyCreateConnector
  >(isDynamicTopologyCreateConnector);
  const [dynamicExtensionDecorators, dynamicExtensionDecoratorsResolved] = useResolvedExtensions<
    DynamicTopologyDecoratorProvider
  >(isDynamicTopologyDecoratorProvider);

  const [topologyDecorators, setTopologyDecorators] = React.useState<{
    [key: string]: TopologyDecorator[];
  }>({});
  const [filtersLoaded, setFiltersLoaded] = React.useState<boolean>(false);
  const queryParams = useQueryParams();
  const { extensions: supportedFileExtensions } = React.useContext<FileUploadContextType>(
    FileUploadContext,
  );

  const searchParams = queryParams.get('searchQuery');
  const fileTypes = supportedFileExtensions.map((ex) => `.${ex}`).toString();

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
      createConnectorExtensions:
        createConnectorsResolved && dynamicCreateConnectorsResolved
          ? [...createConnectors, ...dynamicCreateConnectors].map(
              (creator) => creator.properties.getCreateConnector,
            )
          : [],
      decorators: topologyDecorators,
    }),
    [
      createConnectors,
      createConnectorsResolved,
      createResourceAccess,
      dynamicCreateConnectors,
      dynamicCreateConnectorsResolved,
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
    if (extensionDecoratorsResolved && dynamicExtensionDecoratorsResolved) {
      const allDecorators = [...extensionDecorators, ...dynamicExtensionDecorators].reduce(
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
  }, [
    dynamicExtensionDecorators,
    dynamicExtensionDecoratorsResolved,
    extensionDecorators,
    extensionDecoratorsResolved,
  ]);

  React.useEffect(() => {
    if (displayFilterExtensionsResolved && dynamicDisplayFilterExtensionsResolved) {
      const updateFilters = [...filters];
      [...displayFilterExtensions, ...dynamicDisplayFilterExtensions].forEach((extension) => {
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
  }, [
    displayFilterExtensionsResolved,
    dynamicDisplayFilterExtensionsResolved,
    displayFilterExtensions,
    dynamicDisplayFilterExtensions,
  ]);

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

  const topologySideBarDetails = getSelectedEntityDetails(selectedEntity);

  if (!filteredModel) {
    return null;
  }

  const containerClasses = classNames('pf-topology-container pf-topology-container__with-sidebar', {
    'pf-topology-container__with-sidebar--open': topologySideBarDetails,
  });

  const topologyViewComponent = (
    <div className="odc-topology">
      <Stack>
        <StackItem isFilled={false}>
          <TopologyFilterBar
            viewType={viewType}
            visualization={visualization}
            setIsQuickSearchOpen={setIsQuickSearchOpenAndFireEvent}
            isDisabled={!model.nodes?.length}
          />
        </StackItem>
        <StackItem isFilled className={containerClasses}>
          <div className="co-file-dropzone co-file-dropzone__flex">
            <div ref={setViewContainer} className="pf-topology-content">
              {canDrop && isOver && (
                <div
                  className={classNames(
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
              {viewContent}
              {!model.nodes?.length ? (
                <TopologyEmptyState setIsQuickSearchOpen={setIsQuickSearchOpenAndFireEvent} />
              ) : null}
            </div>
          </div>
          <TopologySideBar show={!!topologySideBarDetails} onClose={() => onSelect()}>
            {topologySideBarDetails}
          </TopologySideBar>
        </StackItem>
        <TopologyQuickSearch
          namespace={namespace}
          viewContainer={viewContainer}
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
