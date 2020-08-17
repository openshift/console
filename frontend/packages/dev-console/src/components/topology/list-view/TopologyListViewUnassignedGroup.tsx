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

interface TopologyListViewUnassignedGroupProps {
  items: Node[];
  selectedIds: string[];
  onSelect: (ids: string[]) => void;
}

const ObservedTopologyListViewUnassignedGroup: React.FC<TopologyListViewUnassignedGroupProps> = ({
  items,
  selectedIds,
  onSelect,
}) => {
  if (!items?.length) {
    return null;
  }

  const { kindsMap, kindKeys } = getChildKinds(items);

  const cells = [];
  cells.push(
    <DataListCell
      key="label"
      className="odc-topology-list-view__application-label"
      id="unassigned_label"
    >
      unassigned
    </DataListCell>,
  );
  return (
    <DataListItem
      className="odc-topology-list-view__application"
      key="unassigned"
      aria-labelledby="unassigned_label"
      isExpanded
    >
      <DataListItemRow className="odc-topology-list-view__application-row odc-topology-list-view__unassigned-group">
        <DataListItemCells dataListCells={cells} />
      </DataListItemRow>
      <DataListContent aria-label="unassigned items" id="unassigned-items" isHidden={false}>
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
    </DataListItem>
  );
};

const TopologyListViewUnassignedGroup = observer(ObservedTopologyListViewUnassignedGroup);
export { TopologyListViewUnassignedGroup };
