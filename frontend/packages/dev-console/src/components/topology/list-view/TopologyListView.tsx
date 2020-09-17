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
import { METRICS_POLL_INTERVAL, useQueryParams } from '@console/shared';
import { PROMETHEUS_TENANCY_BASE_PATH } from '@console/internal/components/graphs';
import {
  fetchOverviewMetrics,
  fetchMonitoringAlerts,
  OverviewMetrics,
  METRICS_FAILURE_CODES,
} from '@console/internal/components/overview/metricUtils';
import { Alert } from '@console/internal/components/monitoring/types';
import * as UIActions from '@console/internal/actions/ui';
import { TYPE_APPLICATION_GROUP } from '../components';
import { odcElementFactory } from '../elements';
import { TopologyListViewAppGroup } from './TopologyListViewAppGroup';
import { getChildKinds, sortGroupChildren } from './list-view-utils';
import { TopologyListViewUnassignedGroup } from './TopologyListViewUnassignedGroup';

import './TopologyListView.scss';

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
  application: string;
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
        visualization.fromModel(model);
        const selectedItem = selectedId ? visualization.getElementById(selectedId) : null;
        if (!selectedItem || !selectedItem.isVisible()) {
          onSelect();
        } else {
          onSelect(selectedItem);
        }
      }
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [model, onSelect, visualization]);

    const nodes = visualization.getElements().filter((e) => isNode(e)) as Node[];
    const applicationGroups = nodes.filter((n) => n.getType() === TYPE_APPLICATION_GROUP);
    applicationGroups.sort((a, b) => a.getLabel().localeCompare(b.getLabel()));
    const unassignedItems = nodes.filter(
      (n) => n.getType() !== TYPE_APPLICATION_GROUP && isGraph(n.getParent()) && n.isVisible(),
    );

    React.useEffect(() => {
      if (selectedId) {
        const element = document.getElementById(selectedId);
        if (element) {
          element.scrollIntoView({ block: 'nearest' });
        }
      }
    }, [selectedId]);

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
      let metricsInterval: any = null;
      let alertsInterval: any = null;

      const fetchMetrics = () => {
        if (!PROMETHEUS_TENANCY_BASE_PATH) {
          return;
        }
        fetchOverviewMetrics(namespace)
          .then((updatedMetrics) => {
            updateMetrics(updatedMetrics);
          })
          .catch((res) => {
            const status = res?.response?.status;
            // eslint-disable-next-line no-console
            console.error('Could not fetch metrics, status:', status);
            // Don't retry on some status codes unless a previous request succeeded.
            if (_.includes(METRICS_FAILURE_CODES, status) && _.isEmpty(metrics)) {
              throw new Error(`Could not fetch metrics, status: ${status}`);
            }
          })
          .then(() => {
            metricsInterval = setTimeout(fetchMetrics, METRICS_POLL_INTERVAL);
          })
          .catch((e) => {
            console.error(e); // eslint-disable-line no-console
          });
      };

      const fetchAlerts = (): void => {
        fetchMonitoringAlerts(namespace)
          .then((alerts) => {
            updateMonitoringAlerts(alerts);
          })
          .catch((e) => {
            console.error(e); // eslint-disable-line no-console
          })
          .then(() => {
            alertsInterval = setTimeout(fetchAlerts, 15 * 1000);
          })
          .catch((e) => {
            console.error(e); // eslint-disable-line no-console
          });
      };

      fetchMetrics();
      fetchAlerts();

      return () => {
        clearInterval(metricsInterval);
        clearInterval(alertsInterval);
      };
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [namespace, updateMetrics, updateMonitoringAlerts]);

    if (!applicationGroups || !unassignedItems) {
      return null;
    }

    return (
      <div className="odc-topology-list-view">
        <DataList
          aria-label="Topology List View"
          className="odc-topology-list-view__data-list"
          selectedDataListItemId={selectedId}
          onSelectDataListItem={(id) => onSelect(visualization.getElementById(id))}
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
              items={unassignedItems}
              selectedIds={[selectedId]}
              onSelect={(ids) => onSelect(ids ? visualization.getElementById(ids[0]) : undefined)}
            />
          ) : null}
        </DataList>
      </div>
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
)(ConnectedTopologyListView);

export default TopologyListView;
