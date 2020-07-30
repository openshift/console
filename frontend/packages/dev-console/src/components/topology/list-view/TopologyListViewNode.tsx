import * as React from 'react';
import * as classNames from 'classnames';
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
import { isNode, Node, observer } from '@patternfly/react-topology';
import { getSeverityAlertType, AlertSeverityIcon, getFiringAlerts } from '@console/shared';
import { useSearchFilter } from '../filters';
import { getResourceKind } from '../topology-utils';
import { labelForNodeKind } from './list-view-utils';
import {
  AlertsCell,
  GroupResourcesCell,
  MetricsCell,
  StatusCell,
  TypedResourceBadgeCell,
} from './cells';
import { selectOverviewDetailsTab } from '@console/internal/actions/ui';
import { connect } from 'react-redux';

interface DispatchProps {
  onSelectTab?: (name: string) => void;
}

interface TopologyListViewNodeProps {
  item: Node;
  selectedIds: string[];
  onSelect: (ids: string[]) => void;
  badgeCell?: React.ReactNode;
  labelCell?: React.ReactNode;
  groupResourcesCell?: React.ReactNode;
  additionalCells?: React.ReactNode[];
}

const ObservedTopologyListViewNode: React.FC<TopologyListViewNodeProps & DispatchProps> = ({
  item,
  selectedIds,
  onSelect,
  onSelectTab,
  badgeCell,
  labelCell,
  groupResourcesCell,
  additionalCells,
  children,
}) => {
  const [filtered] = useSearchFilter(item.getLabel());
  if (!item.isVisible) {
    return null;
  }
  const kind = getResourceKind(item);
  const childNodes =
    item.isGroup() && !item.isCollapsed()
      ? (item.getChildren().filter((n) => isNode(n)) as Node[])
      : [];
  childNodes.sort((a, b) =>
    labelForNodeKind(getResourceKind(a)).localeCompare(labelForNodeKind(getResourceKind(b))),
  );

  let alertIndicator = null;
  const alerts = getFiringAlerts(item.getData().data?.monitoringAlerts ?? []);
  if (alerts?.length > 0) {
    const onAlertClick = () => {
      onSelect([item.getId()]);
      onSelectTab('Monitoring');
    };
    const severityAlertType = getSeverityAlertType(alerts);
    alertIndicator = (
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
  cells.push(badgeCell || <TypedResourceBadgeCell key="type-icon" kind={kind} />);
  cells.push(
    labelCell || (
      <DataListCell
        className="odc-topology-list-view__label-cell"
        key="label"
        id={`${item.getId()}_label`}
      >
        {item.getLabel()}
        {alertIndicator}
      </DataListCell>
    ),
  );
  if (item.isGroup()) {
    if (item.isCollapsed()) {
      cells.push(groupResourcesCell || <GroupResourcesCell key="resources" group={item} />);
    }
  } else if (additionalCells) {
    cells.push(...additionalCells);
  } else {
    cells.push(<AlertsCell key="alerts" item={item} />);
    cells.push(<MetricsCell key="metrics" item={item} />);
    cells.push(<StatusCell key="status" item={item} />);
  }

  const className = classNames('odc-topology-list-view__item-row', { 'is-filtered': filtered });
  return (
    <DataListItem
      key={item.getId()}
      id={item.getId()}
      aria-labelledby={`${item.getId()}_label`}
      isExpanded={childNodes.length > 0}
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
