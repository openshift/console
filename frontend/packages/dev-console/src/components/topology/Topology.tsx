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
} from '@console/topology';
import { RootState } from '@console/internal/redux';
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
import { topologyModelFromDataModel } from './topology-utils';
import { layoutFactory, COLA_LAYOUT, COLA_FORCE_LAYOUT } from './layouts/layoutFactory';
import ComponentFactory from './componentFactory';
import { TYPE_APPLICATION_GROUP, TYPE_HELM_RELEASE, TYPE_OPERATOR_BACKED_SERVICE } from './const';
import TopologyFilterBar from './filters/TopologyFilterBar';
import { getTopologyFilters, TopologyFilters } from './filters/filter-utils';
import TopologyHelmReleasePanel from './helm-details/TopologyHelmReleasePanel';
import { useAddToProjectAccess } from '../../utils/useAddToProjectAccess';

interface StateProps {
  filters: TopologyFilters;
  activeNamespace: string;
}

export interface TopologyProps extends StateProps {
  data: TopologyDataModel;
  serviceBinding: boolean;
}

const graphModel: Model = {
  graph: {
    id: 'g1',
    type: 'graph',
    layout: COLA_LAYOUT,
  },
};

const Topology: React.FC<TopologyProps> = ({ data, serviceBinding, filters, activeNamespace }) => {
  const visRef = React.useRef<Visualization | null>(null);
  const componentFactoryRef = React.useRef<ComponentFactory | null>(null);
  const [layout, setLayout] = React.useState<string>(graphModel.graph.layout);
  const [model, setModel] = React.useState<Model>();
  const [graphData, setGraphData] = React.useState<GraphData>();
  const [selectedIds, setSelectedIds] = React.useState<string[]>([]);
  const createResourceAccess: string[] = useAddToProjectAccess(activeNamespace);
  const [dragHint, setDragHint] = React.useState<string>('');

  if (!componentFactoryRef.current) {
    componentFactoryRef.current = new ComponentFactory(serviceBinding);
  }

  if (!visRef.current) {
    visRef.current = new Visualization();
    visRef.current.registerLayoutFactory(layoutFactory);
    visRef.current.registerComponentFactory(componentFactoryRef.current.getFactory());
    visRef.current.addEventListener<SelectionEventListener>(SELECTION_EVENT, (ids: string[]) => {
      // set empty selection when selecting the graph
      if (ids.length > 0 && ids[0] === graphModel.graph.id) {
        setSelectedIds([]);
      } else {
        setSelectedIds(ids);
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
      namespace: activeNamespace,
    };
    visRef.current.getGraph().setData(newGraphData);
    setGraphData(newGraphData);
  }, [activeNamespace, createResourceAccess]);

  React.useEffect(() => {
    componentFactoryRef.current.serviceBinding = serviceBinding;
  }, [serviceBinding]);

  React.useEffect(() => {
    const newModel = topologyModelFromDataModel(data, filters);
    visRef.current.fromModel(newModel);
    setModel(newModel);
    if (selectedIds.length && !visRef.current.getElementById(selectedIds[0])) {
      setSelectedIds([]);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [data]);

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

  const onSidebarClose = () => {
    setSelectedIds([]);
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
      if (selectedEntity.getType() === TYPE_HELM_RELEASE) {
        return <TopologyHelmReleasePanel helmRelease={selectedEntity} />;
      }
      if (selectedEntity.getType() === TYPE_OPERATOR_BACKED_SERVICE) {
        return null;
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
      viewToolbar={<TopologyFilterBar visualization={visRef.current} />}
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
    activeNamespace: state.UI.get('activeNamespace'),
  };
};

export default connect(TopologyStateToProps)(Topology);
