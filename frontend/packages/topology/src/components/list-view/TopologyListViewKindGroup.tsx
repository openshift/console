import * as React from 'react';
import {
  DataList,
  DataListCell,
  DataListContent,
  DataListItem,
  DataListItemCells,
  DataListItemRow,
} from '@patternfly/react-core';
import { GraphElement, isNode, Node, observer } from '@patternfly/react-topology';
import { useTranslation } from 'react-i18next';
import { labelKeyForNodeKind } from './list-view-utils';
import ListElementWrapper from './ListElementWrapper';

interface TopologyListViewKindGroupProps {
  kind: string;
  childElements: GraphElement[];
  selectedIds: string[];
  onSelect: (ids: string[]) => void;
}

const TopologyListViewKindGroup: React.FC<TopologyListViewKindGroupProps> = ({
  kind,
  childElements,
  selectedIds,
  onSelect,
}) => {
  const { t } = useTranslation();
  const resourceLabel = t(labelKeyForNodeKind(kind));

  const childNodes = childElements.filter((n) => isNode(n)) as Node[];
  childNodes.sort((a, b) => a.getLabel().localeCompare(b.getLabel()));

  return (
    <DataListItem key={kind} aria-labelledby={`${kind}_label`} isExpanded>
      <DataListItemRow className="odc-topology-list-view__kind-row">
        <DataListItemCells
          dataListCells={[
            <DataListCell
              key={kind}
              className="odc-topology-list-view__kind-label"
              id={`${kind}_label`}
            >
              {resourceLabel}
            </DataListCell>,
          ]}
        />
      </DataListItemRow>
      <DataListContent aria-label={kind} id={kind} isHidden={false}>
        <DataList
          aria-label={t('topology~{{resourceLabel}} sub-resources', { resourceLabel })}
          selectedDataListItemId={selectedIds[0]}
          onSelectDataListItem={(id) => onSelect(selectedIds[0] === id ? [] : [id])}
        >
          {childNodes.map((child) => (
            <ListElementWrapper
              key={child.getId()}
              item={child}
              selectedIds={selectedIds}
              onSelect={onSelect}
            />
          ))}
        </DataList>
      </DataListContent>
    </DataListItem>
  );
};

export default observer(TopologyListViewKindGroup);
