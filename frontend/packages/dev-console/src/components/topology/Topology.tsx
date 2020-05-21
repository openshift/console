import * as React from 'react';
import * as classNames from 'classnames';
import { action } from 'mobx';
import { connect } from 'react-redux';
import { Button, ToolbarItem, Tooltip } from '@patternfly/react-core';
import { TopologyIcon } from '@patternfly/react-icons';
import {
  TopologyView,
  TopologyControlBar,
  createTopologyControlButtons,
  defaultControlButtonsOptions,
} from '@patternfly/react-topology';
import {
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
} from '@console/topology';
import { RootState } from '@console/internal/redux';
import { getActiveApplication } from '@console/internal/reducers/ui';
import { selectOverviewDetailsTab } from '@console/internal/actions/ui';
import { getEventSourceStatus } from '@console/knative-plugin/src/topology/knative-topology-utils';
import {
  getQueryArgument,
  setQueryArgument,
  removeQueryArgument,
} from '@console/internal/components/utils';
import KnativeComponentFactory from '@console/knative-plugin/src/topology/components/knativeComponentFactory';
import { KubevirtComponentFactory } from '@console/kubevirt-plugin/src/topology/components/kubevirtComponentFactory';
import { useAddToProjectAccess } from '../../utils/useAddToProjectAccess';
import TopologySideBar from './TopologySideBar';
import {
  GraphData,
  TopologyDataModel,
  TopologyDataObject,
  SHOW_GROUPING_HINT_EVENT,
  ShowGroupingHintEventListener,
} from './topology-types';
import TopologyResourcePanel from './TopologyResourcePanel';
import TopologyApplicationPanel from './application-panel/TopologyApplicationPanel';
import ConnectedTopologyEdgePanel from './TopologyEdgePanel';
import { topologyModelFromDataModel } from './data-transforms/topology-model';
import { layoutFactory, COLA_LAYOUT, COLA_FORCE_LAYOUT } from './layouts/layoutFactory';
import { TYPE_APPLICATION_GROUP, ComponentFactory } from './components';
import TopologyFilterBar from './filters/TopologyFilterBar';
import {
  getTopologyFilters,
  getTopologySearchQuery,
  TopologyFilters,
  TOPOLOGY_SEARCH_FILTER_KEY,
  FILTER_ACTIVE_CLASS,
} from './filters';
import TopologyHelmReleasePanel from './helm/TopologyHelmReleasePanel';
import { TYPE_HELM_RELEASE } from './helm/components/const';
import { HelmComponentFactory } from './helm/components/helmComponentFactory';
import { TYPE_OPERATOR_BACKED_SERVICE } from './operators/components/const';
import { OperatorsComponentFactory } from './operators/components/operatorsComponentFactory';
import { getServiceBindingStatus } from './topology-utils';
import { TYPE_VIRTUAL_MACHINE } from '@console/kubevirt-plugin/src/topology/components/const';
import TopologyVmPanel from '@console/kubevirt-plugin/src/topology/TopologyVmPanel';

interface StateProps {
  filters: TopologyFilters;
  application: string;
  serviceBinding: boolean;
  eventSourceEnabled: boolean;
}

interface DispatchProps {
  onSelectTab?: (name: string) => void;
}

interface TopologyProps {
  data: TopologyDataModel;
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
  data,
  filters,
  application,
  namespace,
  serviceBinding,
  eventSourceEnabled,
  onSelectTab,
}) => {
  const visRef = React.useRef<Visualization | null>(null);
  const applicationRef = React.useRef<string>(null);
  const componentFactoryRef = React.useRef<ComponentFactory | null>(null);
  const knativeComponentFactoryRef = React.useRef<KnativeComponentFactory | null>(null);
  const helmComponentFactoryRef = React.useRef<HelmComponentFactory | null>(null);
  const operatorsComponentFactoryRef = React.useRef<OperatorsComponentFactory | null>(null);
  const vmsComponentFactoryRef = React.useRef<KubevirtComponentFactory | null>(null);
  const [layout, setLayout] = React.useState<string>(graphModel.graph.layout);
  const [model, setModel] = React.useState<Model>();
  const [graphData, setGraphData] = React.useState<GraphData>();
  const [selectedIds, setSelectedIds] = React.useState<string[]>([]);
  const createResourceAccess: string[] = useAddToProjectAccess(namespace);
  const [dragHint, setDragHint] = React.useState<string>('');

  if (!componentFactoryRef.current) {
    componentFactoryRef.current = new ComponentFactory(serviceBinding);
  }
  if (!knativeComponentFactoryRef.current) {
    knativeComponentFactoryRef.current = new KnativeComponentFactory(serviceBinding);
  }
  if (!helmComponentFactoryRef.current) {
    helmComponentFactoryRef.current = new HelmComponentFactory(serviceBinding);
  }
  if (!operatorsComponentFactoryRef.current) {
    operatorsComponentFactoryRef.current = new OperatorsComponentFactory(serviceBinding);
  }
  if (!vmsComponentFactoryRef.current) {
    vmsComponentFactoryRef.current = new KubevirtComponentFactory(serviceBinding);
  }

  if (!visRef.current) {
    visRef.current = new Visualization();
    visRef.current.registerLayoutFactory(layoutFactory);
    visRef.current.registerComponentFactory(componentFactoryRef.current.getFactory());
    // TODO: Use Plugins
    visRef.current.registerComponentFactory(knativeComponentFactoryRef.current.getFactory());
    visRef.current.registerComponentFactory(helmComponentFactoryRef.current.getFactory());
    visRef.current.registerComponentFactory(operatorsComponentFactoryRef.current.getFactory());
    visRef.current.registerComponentFactory(vmsComponentFactoryRef.current.getFactory());
    visRef.current.addEventListener<SelectionEventListener>(SELECTION_EVENT, (ids: string[]) => {
      // set empty selection when selecting the graph
      if (ids.length > 0 && ids[0] === graphModel.graph.id) {
        setSelectedIds([]);
        removeQueryArgument('selectId');
      } else {
        setSelectedIds(ids);
        ids.length > 0 ? setQueryArgument('selectId', ids[0]) : removeQueryArgument('selectId');
      }
    });
    visRef.current.addEventListener<ShowGroupingHintEventListener>(
      SHOW_GROUPING_HINT_EVENT,
      (element, hint) => {
        setDragHint(hint);
      },
    );
    visRef.current.fromModel(graphModel);
  }

  React.useEffect(() => {
    const newGraphData: GraphData = {
      createResourceAccess,
      namespace,
      eventSourceEnabled,
    };
    visRef.current.getGraph().setData(newGraphData);
    setGraphData(newGraphData);
  }, [namespace, createResourceAccess, eventSourceEnabled]);

  React.useEffect(() => {
    const newModel = topologyModelFromDataModel(data, application, filters);
    visRef.current.fromModel(newModel);
    setModel(newModel);
    if (selectedIds.length && !visRef.current.getElementById(selectedIds[0])) {
      setSelectedIds([]);
    } else {
      const selectId = getQueryArgument('selectId');
      const selectTab = getQueryArgument('selectTab');
      visRef.current.getElementById(selectId) && setSelectedIds([selectId]);
      if (selectTab) {
        onSelectTab(selectTab);
        removeQueryArgument('selectTab');
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [data]);

  React.useEffect(() => {
    if (!applicationRef.current) {
      applicationRef.current = application;
      return;
    }
    if (application !== applicationRef.current) {
      applicationRef.current = application;
      visRef.current.getGraph().reset();
      visRef.current.getGraph().layout();
    }
  }, [application]);

  React.useEffect(() => {
    let resizeTimeout = null;
    if (selectedIds.length > 0) {
      const selectedEntity = visRef.current.getElementById(selectedIds[0]);
      if (selectedEntity) {
        const visibleEntity = isNode(selectedEntity)
          ? selectedEntity
          : (selectedEntity as BaseEdge).getSource();
        resizeTimeout = setTimeout(
          action(() => {
            visRef.current
              .getGraph()
              .panIntoView(visibleEntity, { offset: 20, minimumVisible: 40 });
            resizeTimeout = null;
          }),
          500,
        );
      }
    }
    return () => {
      if (resizeTimeout) {
        clearTimeout(resizeTimeout);
      }
    };
  }, [selectedIds]);

  React.useEffect(() => {
    action(() => {
      visRef.current.getGraph().setLayout(layout);
    })();
  }, [layout]);

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
  }, []);

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
              visRef.current.getGraph().scaleBy(4 / 3);
            }),
            zoomOutCallback: action(() => {
              visRef.current.getGraph().scaleBy(0.75);
            }),
            fitToScreenCallback: action(() => {
              visRef.current.getGraph().fit(80);
            }),
            resetViewCallback: action(() => {
              visRef.current.getGraph().reset();
              visRef.current.getGraph().layout();
            }),
            legend: false,
          }),
        ]}
      >
        <div className="odc-topology__layout-group">
          <Tooltip content="Layout 1">
            <ToolbarItem className="odc-topology__layout-button" tabIndex={-1}>
              <Button
                className={classNames('pf-topology-control-bar__button', {
                  'pf-m-active': layout === COLA_LAYOUT,
                })}
                variant="tertiary"
                onClick={() => setLayout(COLA_LAYOUT)}
              >
                <TopologyIcon className="odc-topology__layout-button__icon" />1
                <span className="sr-only">Layout 1</span>
              </Button>
            </ToolbarItem>
          </Tooltip>
          <Tooltip content="Layout 2">
            <ToolbarItem className="odc-topology__layout-button" tabIndex={-1}>
              <Button
                className={classNames('pf-topology-control-bar__button', {
                  'pf-m-active': layout === COLA_FORCE_LAYOUT,
                })}
                variant="tertiary"
                onClick={() => setLayout(COLA_FORCE_LAYOUT)}
              >
                <TopologyIcon className="odc-topology__layout-button__icon" />2
                <span className="sr-only">Layout 2</span>
              </Button>
            </ToolbarItem>
          </Tooltip>
        </div>
      </TopologyControlBar>
    );
  };

  const selectedItemDetails = () => {
    const selectedEntity = selectedIds[0] ? visRef.current.getElementById(selectedIds[0]) : null;
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
      if (selectedEntity.getType() === TYPE_OPERATOR_BACKED_SERVICE) {
        return null;
      }
      if (selectedEntity.getType() === TYPE_VIRTUAL_MACHINE) {
        return <TopologyVmPanel vmNode={selectedEntity} />;
      }
      return <TopologyResourcePanel item={selectedEntity.getData() as TopologyDataObject} />;
    }

    if (isEdge(selectedEntity)) {
      return <ConnectedTopologyEdgePanel edge={selectedEntity as BaseEdge} data={data} />;
    }
    return null;
  };

  const renderSideBar = () => {
    const selectedEntity =
      selectedIds.length === 0 ? null : visRef.current.getElementById(selectedIds[0]);
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

  if (!model) {
    return null;
  }

  const sideBar = renderSideBar();

  return (
    <TopologyView
      viewToolbar={
        <TopologyFilterBar visualization={visRef.current} onSearchChange={onSearchChange} />
      }
      controlBar={renderControlBar()}
      sideBar={sideBar}
      sideBarOpen={!!sideBar}
    >
      <VisualizationSurface visualization={visRef.current} state={{ selectedIds }} />
      {dragHint && <div className="odc-topology__hint-container">{dragHint}</div>}
    </TopologyView>
  );
};

const TopologyStateToProps = (state: RootState): StateProps => {
  return {
    filters: getTopologyFilters(state),
    application: getActiveApplication(state),
    serviceBinding: getServiceBindingStatus(state),
    eventSourceEnabled: getEventSourceStatus(state),
  };
};

const TopologyDispatchToProps = (dispatch): DispatchProps => ({
  onSelectTab: (name) => dispatch(selectOverviewDetailsTab(name)),
});

export default connect<StateProps, DispatchProps, TopologyProps>(
  TopologyStateToProps,
  TopologyDispatchToProps,
)(Topology);
