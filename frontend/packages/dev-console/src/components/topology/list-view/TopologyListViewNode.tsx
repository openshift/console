import * as React from 'react';
import * as classNames from 'classnames';
import { connect } from 'react-redux';
import {
  Button,
  DataList,
  DataListCell,
  DataListContent,
  DataListItem,
  DataListItemCells,
  DataListItemRow,
  Tooltip,
  TooltipPosition,
} from '@patternfly/react-core';
import { Node, observer } from '@patternfly/react-topology';
import {
  getSeverityAlertType,
  AlertSeverityIcon,
  getFiringAlerts,
  shouldHideMonitoringAlertDecorator,
} from '@console/shared';
import { selectOverviewDetailsTab } from '@console/internal/actions/ui';

import { useSearchFilter } from '../filters';
import { getResourceKind } from '../topology-utils';
import {
  AlertsCell,
  GroupResourcesCell,
  CpuCell,
  MemoryCell,
  StatusCell,
  TypedResourceBadgeCell,
} from './cells';

interface DispatchProps {
  onSelectTab?: (name: string) => void;
}

interface TopologyListViewNodeProps {
  item: Node;
  selectedIds: string[];
  onSelect: (ids: string[]) => void;
  badgeCell?: React.ReactNode;
  labelCell?: React.ReactNode;
  alertsCell?: React.ReactNode;
  memoryCell?: React.ReactNode;
  cpuCell?: React.ReactNode;
  statusCell?: React.ReactNode;
  groupResourcesCell?: React.ReactNode;
  hideAlerts?: boolean;
  noPods?: boolean;
}

const ObservedTopologyListViewNode: React.FC<TopologyListViewNodeProps & DispatchProps> = ({
  item,
  selectedIds,
  onSelect,
  onSelectTab,
  badgeCell,
  labelCell,
  alertsCell,
  memoryCell,
  cpuCell,
  statusCell,
  groupResourcesCell,
  hideAlerts = false,
  noPods = false,
  children,
}) => {
  const [filtered] = useSearchFilter(item.getLabel());
  if (!item.isVisible) {
    return null;
  }
  const kind = getResourceKind(item);

  let alertIndicator = null;
  const alerts = getFiringAlerts(item.getData().data?.monitoringAlerts ?? []);
  if (alerts?.length > 0) {
    const onAlertClick = () => {
      onSelect([item.getId()]);
      onSelectTab('Monitoring');
    };
    const severityAlertType = getSeverityAlertType(alerts);
    alertIndicator = shouldHideMonitoringAlertDecorator(severityAlertType) ? null : (
      <Tooltip key="monitoringAlert" content="Monitoring Alert" position={TooltipPosition.right}>
        <Button
          variant="plain"
          className="odc-topology-list-view__alert-button"
          onClick={onAlertClick}
        >
          <AlertSeverityIcon severityAlertType={severityAlertType} />
        </Button>
      </Tooltip>
    );
  }

  const cells = [];
  cells.push(
    labelCell || (
      <DataListCell
        className="odc-topology-list-view__label-cell"
        key="label"
        id={`${item.getId()}_label`}
      >
        {badgeCell || <TypedResourceBadgeCell key="type-icon" kind={kind} />}
        {item.getLabel()}
        {alertIndicator}
      </DataListCell>
    ),
  );
  if (item.isGroup()) {
    if (item.isCollapsed()) {
      cells.push(groupResourcesCell || <GroupResourcesCell key="resources" group={item} />);
    }
  } else {
    if (!hideAlerts) {
      cells.push(alertsCell || <AlertsCell key="alerts" item={item} />);
    }
    if (!noPods) {
      if (!selectedIds[0]) {
        cells.push(memoryCell || <MemoryCell key="memory" item={item} />);
        cells.push(cpuCell || <CpuCell key="cpu" item={item} />);
      }
      cells.push(statusCell || <StatusCell key="status" item={item} />);
    }
  }

  const className = classNames('odc-topology-list-view__item-row', { 'is-filtered': filtered });
  return (
    <DataListItem
      key={item.getId()}
      id={item.getId()}
      aria-labelledby={`${item.getId()}_label`}
      isExpanded={children !== undefined}
    >
      <DataListItemRow className={className}>
        <DataListItemCells dataListCells={cells} />
      </DataListItemRow>
      {children ? (
        <DataListContent
          className="odc-topology-list-view__group-children"
          aria-label={item.getLabel()}
          id={item.getId()}
          isHidden={false}
        >
          <DataList
            aria-label={`${item.getLabel()} sub-resources}`}
            selectedDataListItemId={selectedIds[0]}
            onSelectDataListItem={(id) => onSelect(selectedIds[0] === id ? [] : [id])}
          >
            {children}
          </DataList>
        </DataListContent>
      ) : null}
    </DataListItem>
  );
};

const TopologyListViewNodeDispatchToProps = (dispatch): DispatchProps => ({
  onSelectTab: (name) => dispatch(selectOverviewDetailsTab(name)),
});

const TopologyListViewNode = connect<{}, DispatchProps, TopologyListViewNodeProps>(
  null,
  TopologyListViewNodeDispatchToProps,
)(observer(ObservedTopologyListViewNode));
export { TopologyListViewNode };
