import * as React from 'react';
import {
  DataListCell,
  DataList,
  DataListItem,
  DataListItemCells,
  DataListItemRow,
} from '@patternfly/react-core';
import { Node, observer } from '@patternfly/react-topology';
import * as classNames from 'classnames';
import { ResourceIcon } from '@console/internal/components/utils';
import { showKind, useDisplayFilters, useSearchFilter } from '../../filters';
import { ApplicationModel } from '../../models';
import GroupResourcesCell from './cells/GroupResourcesCell';
import { getChildKinds } from './list-view-utils';
import TopologyListViewKindGroup from './TopologyListViewKindGroup';

interface TopologyListViewAppGroupProps {
  appGroup: Node;
  selectedIds: string[];
  onSelect: (ids: string[]) => void;
}

const TopologyListViewAppGroup: React.FC<TopologyListViewAppGroupProps> = ({
  appGroup,
  selectedIds,
  onSelect,
}) => {
  const [filtered] = useSearchFilter(appGroup.getLabel());
  const displayFilters = useDisplayFilters();
  const id = appGroup.getId();
  const visible = appGroup.isVisible();
  const label = appGroup.getLabel();
  const collapsed = appGroup.isCollapsed();
  const children = appGroup.getChildren();
  const { groupResources } = appGroup.getData();

  if (
    !visible ||
    (!collapsed && !children?.length) ||
    (collapsed &&
      !groupResources.find((res) =>
        showKind(res.resourceKind || res.resource?.kind, displayFilters),
      ))
  ) {
    return null;
  }

  const { kindsMap, kindKeys } = getChildKinds(children);

  const cells = [];
  cells.push(
    <DataListCell
      key={id}
      className="odc-topology-list-view__application-label-cell"
      id={`${id}_label`}
    >
      <ResourceIcon
        className="odc-topology-list-view__resource-icon co-m-resource-icon--lg"
        kind={ApplicationModel.kind}
      />
      <span className="odc-topology-list-view__application-label">{label}</span>
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
        <DataList aria-label={id} id={id}>
          {kindKeys.map((key) => (
            <TopologyListViewKindGroup
              key={key}
              kind={key}
              childElements={kindsMap[key]}
              selectedIds={selectedIds}
              onSelect={onSelect}
            />
          ))}
        </DataList>
      )}
    </DataListItem>
  );
};

export default observer(TopologyListViewAppGroup);
