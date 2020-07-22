import * as React from 'react';
import * as classNames from 'classnames';
import {
  DataList,
  DataListCell,
  DataListContent,
  DataListItem,
  DataListItemCells,
  DataListItemRow,
} from '@patternfly/react-core';
import { isNode, Node, observer } from '@patternfly/react-topology';
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

interface TopologyListViewNodeProps {
  item: Node;
  selectedIds: string[];
  onSelect: (ids: string[]) => void;
  badgeCell?: React.ReactNode;
  labelCell?: React.ReactNode;
  groupResourcesCell?: React.ReactNode;
  additionalCells?: React.ReactNode[];
}

const ObservedTopologyListViewNode: React.FC<TopologyListViewNodeProps> = ({
  item,
  selectedIds,
  onSelect,
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

  const cells = [];
  cells.push(badgeCell || <TypedResourceBadgeCell key="type-icon" kind={kind} />);
  cells.push(
    labelCell || (
      <DataListCell key="label" id={`${item.getId()}_label`}>
        {item.getLabel()}
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

const TopologyListViewNode = observer(ObservedTopologyListViewNode);
export { TopologyListViewNode };
