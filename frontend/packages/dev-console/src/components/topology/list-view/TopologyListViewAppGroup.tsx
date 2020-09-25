import * as React from 'react';
import {
  DataListCell,
  DataListContent,
  DataListItem,
  DataListItemCells,
  DataListItemRow,
} from '@patternfly/react-core';
import { Node, observer } from '@patternfly/react-topology';
import { getChildKinds } from './list-view-utils';
import { TopologyListViewKindGroup } from './TopologyListViewKindGroup';
import { GroupResourcesCell } from './cells/GroupResourcesCell';
import { useSearchFilter } from '../filters';
import * as classNames from 'classnames';

interface TopologyListViewAppGroupProps {
  appGroup: Node;
  selectedIds: string[];
  onSelect: (ids: string[]) => void;
}

const ObservedTopologyListViewAppGroup: React.FC<TopologyListViewAppGroupProps> = ({
  appGroup,
  selectedIds,
  onSelect,
}) => {
  const [filtered] = useSearchFilter(appGroup.getLabel());
  const id = appGroup.getId();
  const visible = appGroup.isVisible();
  const label = appGroup.getLabel();
  const collapsed = appGroup.isCollapsed();
  const children = appGroup.getChildren();

  if (!visible) {
    return null;
  }

  const { kindsMap, kindKeys } = getChildKinds(children);

  const cells = [];
  cells.push(
    <DataListCell key={id} className="odc-topology-list-view__application-label" id={`${id}_label`}>
      {label}
    </DataListCell>,
  );
  if (collapsed) {
    cells.push(
      <DataListCell key="resources" id={`${id}_resources`}>
        <GroupResourcesCell group={appGroup} />
      </DataListCell>,
    );
  }
  const className = classNames('odc-topology-list-view__application-row', {
    'is-filtered': filtered,
  });
  return (
    <DataListItem
      className="odc-topology-list-view__application"
      key={id}
      id={id}
      aria-labelledby={`${id}_label`}
      isExpanded
    >
      <DataListItemRow className={className}>
        <DataListItemCells dataListCells={cells} />
      </DataListItemRow>
      {!collapsed && (
        <DataListContent aria-label={id} id={id} isHidden={false}>
          {kindKeys.map((key) => (
            <TopologyListViewKindGroup
              key={key}
              kind={key}
              childElements={kindsMap[key]}
              selectedIds={selectedIds}
              onSelect={onSelect}
            />
          ))}
        </DataListContent>
      )}
    </DataListItem>
  );
};

const TopologyListViewAppGroup = observer(ObservedTopologyListViewAppGroup);
export { TopologyListViewAppGroup };
