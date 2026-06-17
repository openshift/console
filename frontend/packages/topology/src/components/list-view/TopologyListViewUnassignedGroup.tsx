import type { FC } from 'react';
import {
  DataListCell,
  DataList,
  DataListItem,
  DataListItemCells,
  DataListItemRow,
} from '@patternfly/react-core';
import type { Node } from '@patternfly/react-topology';
import { observer } from '@patternfly/react-topology';
import { useTranslation } from 'react-i18next';
import { getChildKinds } from './list-view-utils';
import { TopologyListViewKindGroup } from './TopologyListViewKindGroup';

interface TopologyListViewUnassignedGroupProps {
  items: Node[];
  showCategory: boolean;
  selectedIds: string[];
  onSelect: (ids: string[]) => void;
}

const TopologyListViewUnassignedGroupComponent: FC<TopologyListViewUnassignedGroupProps> = ({
  items,
  showCategory,
  selectedIds,
  onSelect,
}) => {
  const { t } = useTranslation('topology');
  if (!items?.length) {
    return null;
  }

  const { kindsMap, kindKeys } = getChildKinds(items);

  const unassignedContent = (
    <DataList aria-label="unassigned items" id="unassigned-items">
      {kindKeys.map((key) => (
        <TopologyListViewKindGroup
          groupLabel={t('unassigned')}
          key={key}
          kind={key}
          childElements={kindsMap[key]}
          selectedIds={selectedIds}
          onSelect={onSelect}
        />
      ))}
    </DataList>
  );

  if (!showCategory) {
    return unassignedContent;
  }

  const cells = [];
  cells.push(
    <DataListCell
      key="label"
      className="odc-topology-list-view__unassigned-label"
      id="unassigned_label"
    >
      {t('No application group')}
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
      {unassignedContent}
    </DataListItem>
  );
};

export const TopologyListViewUnassignedGroup = observer(TopologyListViewUnassignedGroupComponent);
