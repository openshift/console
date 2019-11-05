import * as React from 'react';
import * as _ from 'lodash';
import { action } from 'mobx';
import {
  TopologyView,
  TopologyControlBar,
  createTopologyControlButtons,
  defaultControlButtonsOptions,
} from '@patternfly/react-topology';
import {
  Visualization,
  VisualizationSurface,
  GraphElement,
  isNode,
  Model,
  SELECTION_EVENT,
  SelectionEventListener,
} from '@console/topology';
import TopologySideBar from '../topology/TopologySideBar';
import { TopologyDataModel, TopologyDataObject } from '../topology/topology-types';
import TopologyResourcePanel from '../topology/TopologyResourcePanel';
import TopologyApplicationPanel from '../topology/TopologyApplicationPanel';
import { topologyModelFromDataModel } from './topology-utils';
import layoutFactory from './layoutFactory';
import ComponentFactory from './componentFactory';
import { TYPE_APPLICATION_GROUP } from './const';

export interface TopologyProps {
  data: TopologyDataModel;
  serviceBinding: boolean;
}

const graphModel: Model = {
  graph: {
    id: 'g1',
    type: 'graph',
    layout: 'Force',
  },
};

const Topology: React.FC<TopologyProps> = ({ data, serviceBinding }) => {
  const visRef = React.useRef<Visualization | null>(null);
  const componentFactoryRef = React.useRef<ComponentFactory | null>(null);
  const [model, setModel] = React.useState<Model>();
  const [selectedIds, setSelectedIds] = React.useState<string[]>([]);

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
    visRef.current.fromModel(graphModel);
  }

  React.useEffect(() => {
    componentFactoryRef.current.serviceBinding = serviceBinding;
  }, [serviceBinding]);

  React.useEffect(() => {
    const newModel = topologyModelFromDataModel(data);
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
      if (selectedEntity && isNode(selectedEntity)) {
        resizeTimeout = setTimeout(
          action(() => {
            visRef.current
              .getGraph()
              .panIntoView(selectedEntity, { offset: 20, minimumVisible: 40 });
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

  const onSidebarClose = () => {
    setSelectedIds([]);
  };

  const renderControlBar = () => {
    return (
      <TopologyControlBar
        controlButtons={createTopologyControlButtons({
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
        })}
      />
    );
  };

  const selectedItemDetails = () => {
    const selectedEntity = selectedIds[0] ? visRef.current.getElementById(selectedIds[0]) : null;
    if (isNode(selectedEntity)) {
      if (selectedEntity.getType() === TYPE_APPLICATION_GROUP) {
        return (
          <TopologyApplicationPanel
            application={{
              id: selectedEntity.getId(),
              name: selectedEntity.getLabel(),
              resources: _.map(selectedEntity.getChildren(), (node: GraphElement) =>
                node.getData(),
              ),
            }}
          />
        );
      }
      return <TopologyResourcePanel item={selectedEntity.getData() as TopologyDataObject} />;
    }

    return null;
  };

  const renderSideBar = () => {
    const selectedEntity =
      selectedIds.length === 0 ? null : visRef.current.getElementById(selectedIds[0]);
    return (
      <TopologySideBar show={!!selectedEntity} onClose={onSidebarClose}>
        {selectedEntity && selectedItemDetails()}
      </TopologySideBar>
    );
  };

  if (!model) {
    return null;
  }

  return (
    <TopologyView
      controlBar={renderControlBar()}
      sideBar={renderSideBar()}
      sideBarOpen={selectedIds.length > 0}
    >
      <VisualizationSurface visualization={visRef.current} state={{ selectedIds }} />
    </TopologyView>
  );
};

export default Topology;
