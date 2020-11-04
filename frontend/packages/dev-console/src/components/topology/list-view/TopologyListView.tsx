import * as React from 'react';
import * as _ from 'lodash';
import { connect } from 'react-redux';
import {
  observer,
  isGraph,
  Node,
  isNode,
  Visualization,
  GraphElement,
  Model,
} from '@patternfly/react-topology';
import { DataList } from '@patternfly/react-core';
import { useQueryParams } from '@console/shared';
import { OverviewMetrics } from '@console/internal/components/overview/metricUtils';
import { Alert } from '@console/internal/components/monitoring/types';
import * as UIActions from '@console/internal/actions/ui';
import { TYPE_APPLICATION_GROUP } from '../components';
import { odcElementFactory } from '../elements';
import { useOverviewMetricsUpdater } from '../hooks/useOverviewMetricsUpdater';
import { useOverviewAlertsUpdater } from '../hooks/useOverviewAlertsUpdater';
import { TopologyListViewAppGroup } from './TopologyListViewAppGroup';
import { getChildKinds, sortGroupChildren } from './list-view-utils';
import { TopologyListViewUnassignedGroup } from './TopologyListViewUnassignedGroup';

import './TopologyListView.scss';

interface TopologyGraphViewProps {
  visualizationReady: boolean;
  visualization: Visualization;
  selectedId: string;
  onSelect: (entity?: GraphElement) => void;
  applicationGroups: Node[];
  unassignedItems: Node[];
}

const TopologyListViewComponent: React.FC<TopologyGraphViewProps> = React.memo(
  ({
    visualizationReady,
    visualization,
    onSelect,
    applicationGroups,
    unassignedItems,
    selectedId,
  }) => {
    if (!visualizationReady) {
      return null;
    }

    return (
      <div className="odc-topology-list-view">
        <DataList
          aria-label="Topology List View"
          className="odc-topology-list-view__data-list"
          selectedDataListItemId={selectedId}
          onSelectDataListItem={(id) =>
            onSelect(selectedId === id ? undefined : visualization.getElementById(id))
          }
        >
          {applicationGroups.map((g) => (
            <TopologyListViewAppGroup
              key={g.getId()}
              appGroup={g}
              selectedIds={[selectedId]}
              onSelect={(ids) => onSelect(ids ? visualization.getElementById(ids[0]) : undefined)}
            />
          ))}
          {unassignedItems.length > 0 ? (
            <TopologyListViewUnassignedGroup
              key="unassigned"
              showCategory={applicationGroups.length > 0}
              items={unassignedItems}
              selectedIds={[selectedId]}
              onSelect={(ids) => onSelect(ids ? visualization.getElementById(ids[0]) : undefined)}
            />
          ) : null}
        </DataList>
      </div>
    );
  },
  (prevProps, nextProps) => {
    if (
      prevProps.visualizationReady !== nextProps.visualizationReady ||
      prevProps.visualization !== nextProps.visualization ||
      prevProps.onSelect !== nextProps.onSelect ||
      prevProps.selectedId !== nextProps.selectedId
    ) {
      return false;
    }
    return (
      _.isEqual(
        prevProps.applicationGroups.map((g) => ({
          label: g.getId(),
        })),
        nextProps.applicationGroups.map((g) => ({
          label: g.getId(),
        })),
      ) &&
      _.isEqual(
        prevProps.unassignedItems.map((g) => ({
          label: g.getId(),
        })),
        nextProps.unassignedItems.map((g) => ({
          label: g.getId(),
        })),
      )
    );
  },
);

const TOPOLOGY_LIST_ID = 'odc-topology-list';
const listModel: Model = {
  graph: {
    id: TOPOLOGY_LIST_ID,
    type: 'graph',
  },
};
interface TopologyListViewPropsFromState {
  metrics: OverviewMetrics;
}

interface TopologyListViewPropsFromDispatch {
  updateMetrics: (metrics: OverviewMetrics) => void;
  updateMonitoringAlerts: (alerts: Alert[]) => void;
}

interface TopologyListViewProps {
  model: Model;
  namespace: string;
  onSelect: (entity?: GraphElement) => void;
  setVisualization: (vis: Visualization) => void;
}

const ConnectedTopologyListView: React.FC<TopologyListViewProps &
  TopologyListViewPropsFromDispatch &
  TopologyListViewPropsFromState> = observer(
  ({
    model,
    onSelect,
    setVisualization,
    namespace,
    metrics,
    updateMetrics,
    updateMonitoringAlerts,
  }) => {
    const queryParams = useQueryParams();
    const selectedId = queryParams.get('selectId');
    const [visualizationReady, setVisualizationReady] = React.useState<boolean>(false);

    const createVisualization = () => {
      const newVisualization = new Visualization();
      newVisualization.registerElementFactory(odcElementFactory);
      newVisualization.fromModel(listModel);
      setVisualization(newVisualization);
      return newVisualization;
    };

    const visualizationRef = React.useRef<Visualization>();
    if (!visualizationRef.current) {
      visualizationRef.current = createVisualization();
    }

    const visualization = visualizationRef.current;

    React.useEffect(() => {
      if (model) {
        // Clear out any layout that might have been saved
        if (model.graph?.layout) {
          delete model.graph.layout;
        }
        visualization.fromModel(model);
        const selectedItem = selectedId ? visualization.getElementById(selectedId) : null;
        if (!selectedItem || !selectedItem.isVisible()) {
          onSelect();
        } else {
          onSelect(selectedItem);
        }
      }
      setVisualizationReady(true);
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [model, onSelect, visualization]);

    const nodes = visualization.getElements().filter((e) => isNode(e)) as Node[];
    const applicationGroups = nodes.filter((n) => n.getType() === TYPE_APPLICATION_GROUP);
    applicationGroups.sort((a, b) => a.getLabel().localeCompare(b.getLabel()));
    const unassignedItems = nodes.filter(
      (n) => n.getType() !== TYPE_APPLICATION_GROUP && isGraph(n.getParent()) && n.isVisible(),
    );

    React.useLayoutEffect(() => {
      if (visualizationReady && selectedId) {
        const element = document.getElementById(selectedId);
        if (element) {
          element.scrollIntoView({ block: 'nearest' });
        }
      }
    }, [selectedId, visualizationReady]);

    React.useEffect(() => {
      const getFlattenedItems = (): Node[] => {
        const flattened = [];
        const addFlattenedNode = (node: Node) => {
          if (node) {
            flattened.push(node);
            const childNodes = sortGroupChildren(node.getChildren());
            childNodes.forEach((child) => {
              if (isNode(child)) {
                addFlattenedNode(child);
              }
            });
          }
        };

        const addFlattenedKinds = (children: GraphElement[]) => {
          const { kindsMap, kindKeys } = getChildKinds(children);
          kindKeys.forEach((key) => {
            kindsMap[key]
              .sort((a, b) => a.getLabel().localeCompare(b.getLabel()))
              .forEach((child) => {
                addFlattenedNode(child);
              });
          });
        };

        applicationGroups.forEach((appGroup) => {
          flattened.push(appGroup);
          addFlattenedKinds(appGroup.getChildren());
        });
        addFlattenedKinds(unassignedItems);
        return flattened;
      };

      const selectPrevious = () => {
        const flattenedItems = getFlattenedItems();
        const index = flattenedItems.findIndex((item) => selectedId === item.getId());
        if (index > 0) {
          onSelect(flattenedItems[index - 1]);
        }
      };

      const selectNext = () => {
        const flattenedItems = getFlattenedItems();
        const index = flattenedItems.findIndex((item) => selectedId === item.getId());
        if (index < flattenedItems.length - 1) {
          onSelect(flattenedItems[index + 1]);
        }
      };

      const stopEvent = (e: KeyboardEvent) => {
        document.activeElement instanceof HTMLElement && document.activeElement.blur();
        e.stopPropagation();
        e.preventDefault();
      };

      const onKeyDown = (e: KeyboardEvent) => {
        const { nodeName } = e.target as Element;
        if (nodeName === 'INPUT' || nodeName === 'TEXTAREA') {
          return;
        }

        switch (e.key) {
          case 'Escape':
            stopEvent(e);
            onSelect();
            break;
          case 'k':
          case 'ArrowUp':
            stopEvent(e);
            selectPrevious();
            break;
          case 'j':
          case 'ArrowDown':
            stopEvent(e);
            selectNext();
            break;
          default:
            break;
        }
      };

      if (visualization) {
        window.addEventListener('keydown', onKeyDown);
      }
      return () => {
        window.removeEventListener('keydown', onKeyDown);
      };
    }, [visualization, selectedId, applicationGroups, unassignedItems, onSelect]);

    React.useEffect(() => {
      const clearMetricsInterval = useOverviewMetricsUpdater(namespace, metrics, updateMetrics);
      const clearAlertsInterval = useOverviewAlertsUpdater(namespace, updateMonitoringAlerts);

      return () => {
        clearMetricsInterval();
        clearAlertsInterval();
      };
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [namespace, updateMetrics, updateMonitoringAlerts]);

    return (
      <TopologyListViewComponent
        visualizationReady={visualizationReady}
        visualization={visualization}
        selectedId={selectedId}
        onSelect={onSelect}
        applicationGroups={applicationGroups}
        unassignedItems={unassignedItems}
      />
    );
  },
);

const stateToProps = ({ UI }): TopologyListViewPropsFromState => {
  return { metrics: UI.get('overview').toJS() };
};

const dispatchToProps = (dispatch): TopologyListViewPropsFromDispatch => ({
  updateMetrics: (metrics: OverviewMetrics) => dispatch(UIActions.updateOverviewMetrics(metrics)),
  updateMonitoringAlerts: (alerts: Alert[]) =>
    dispatch(UIActions.monitoringLoaded('devAlerts', alerts, 'dev')),
});

const TopologyListView = connect<
  TopologyListViewPropsFromState,
  TopologyListViewPropsFromDispatch,
  TopologyListViewProps
>(
  stateToProps,
  dispatchToProps,
)(React.memo(ConnectedTopologyListView));

export default TopologyListView;
