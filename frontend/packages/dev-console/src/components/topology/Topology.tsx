import * as React from 'react';
import * as classNames from 'classnames';
import { action } from 'mobx';
import { Button, PageHeaderToolsItem, Tooltip } from '@patternfly/react-core';
import { TopologyIcon } from '@patternfly/react-icons';
import {
  TopologyControlBar,
  createTopologyControlButtons,
  defaultControlButtonsOptions,
  ComponentFactory,
  Visualization,
  VisualizationSurface,
  isNode,
  BaseEdge,
  VisualizationProvider,
} from '@patternfly/react-topology';
import { isTopologyComponentFactory, TopologyComponentFactory } from '../../extensions/topology';
import { useExtensions } from '@console/plugin-sdk';
import { SHOW_GROUPING_HINT_EVENT, ShowGroupingHintEventListener } from './topology-types';
import { COLA_LAYOUT, COLA_FORCE_LAYOUT } from './layouts/layoutFactory';
import { componentFactory } from './components';

interface TopologyProps {
  visualization: Visualization;
  application: string;
  namespace: string;
  selectedIds: string[];
}

const Topology: React.FC<TopologyProps> = ({ visualization, application, selectedIds }) => {
  const applicationRef = React.useRef<string>(null);
  const [layout, setLayout] = React.useState<string>(COLA_LAYOUT);
  const [visualizationReady, setVisualizationReady] = React.useState<boolean>(false);
  const [dragHint, setDragHint] = React.useState<string>('');
  const [componentFactories, setComponentFactories] = React.useState<ComponentFactory[]>([]);
  const componentFactoryExtensions = useExtensions<TopologyComponentFactory>(
    isTopologyComponentFactory,
  );
  const componentFactoriesPromises = React.useMemo(
    () => componentFactoryExtensions.map((factory) => factory.properties.getFactory()),
    [componentFactoryExtensions],
  );

  React.useEffect(() => {
    Promise.all(componentFactoriesPromises)
      .then((res) => {
        setComponentFactories(res);
      })
      .catch(() => {});
  }, [componentFactoriesPromises]);

  React.useEffect(() => {
    if (componentFactoriesPromises.length && !componentFactories.length) {
      return;
    }

    visualization.registerComponentFactory(componentFactory);
    componentFactories.forEach((factory) => {
      visualization.registerComponentFactory(factory);
    });

    visualization.addEventListener<ShowGroupingHintEventListener>(
      SHOW_GROUPING_HINT_EVENT,
      (element, hint) => {
        setDragHint(hint);
      },
    );
    setVisualizationReady(true);
  }, [visualization, componentFactoriesPromises, componentFactories]);

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
      if (visualizationReady) {
        visualization.getGraph().setLayout(layout);
      }
    })();
  }, [layout, visualization, visualizationReady]);

  if (!visualizationReady) {
    return null;
  }

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

  if (!visualizationReady) {
    return null;
  }

  return (
    <VisualizationProvider controller={visualization}>
      <VisualizationSurface state={{ selectedIds }} />
      {dragHint && <div className="odc-topology__hint-container">{dragHint}</div>}
      <span className="pf-topology-control-bar">{renderControlBar()}</span>
    </VisualizationProvider>
  );
};

export default Topology;
