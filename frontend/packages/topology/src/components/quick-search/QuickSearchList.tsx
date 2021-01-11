import * as React from 'react';
import { useTranslation } from 'react-i18next';
import cx from 'classnames';
import { history } from '@console/internal/components/utils';
import { CatalogItem } from '@console/plugin-sdk';
import {
  DataList,
  DataListItem,
  DataListItemRow,
  DataListItemCells,
  DataListCell,
  Split,
  SplitItem,
  Label,
  TextContent,
  Text,
  TextVariants,
  Button,
} from '@patternfly/react-core';
import { getIconProps } from '@console/dev-console/src/components/catalog/utils/catalog-utils';
import { getImageForIconClass } from '@console/internal/components/catalog/catalog-item-icon';
import './QuickSearchList.scss';

interface QuickSearchListProps {
  listItems: CatalogItem[];
  totalItems: number;
  selectedItemId: string;
  searchTerm: string;
  namespace: string;
  onSelectListItem: (itemId: string) => void;
}

const QuickSearchList: React.FC<QuickSearchListProps> = ({
  listItems,
  totalItems,
  selectedItemId,
  searchTerm,
  namespace,
  onSelectListItem,
}) => {
  const { t } = useTranslation();

  const openForm = (e: React.SyntheticEvent, item: CatalogItem) => {
    e.preventDefault();
    history.push(item.cta.href);
  };

  const goToCatalogPage = React.useCallback(() => {
    history.push(`/catalog/ns/${namespace}?keyword=${searchTerm}`);
  }, [namespace, searchTerm]);

  const getIcon = (item: CatalogItem) => {
    const { iconImg, iconClass } = getIconProps(item);
    return (
      <img
        className="odc-quick-search-list__item-icon"
        src={iconClass ? getImageForIconClass(iconClass) : iconImg}
        alt={`${item.name} icon`}
      />
    );
  };

  return (
    <DataList
      className="odc-quick-search-list"
      aria-label={t('topology~Quick search list')}
      selectedDataListItemId={selectedItemId}
      onSelectDataListItem={(itemId) => itemId !== 'viewAll' && onSelectListItem(itemId)}
      isCompact
    >
      {listItems.map((item) => (
        <DataListItem
          id={item.uid}
          key={item.uid}
          tabIndex={-1}
          className={cx('odc-quick-search-list__item', {
            'odc-quick-search-list__item--highlight': item.uid === selectedItemId,
          })}
          onDoubleClick={(e: React.SyntheticEvent) => openForm(e, item)}
        >
          <DataListItemRow className="odc-quick-search-list__item-row">
            <DataListItemCells
              className="odc-quick-search-list__item-content"
              dataListCells={[
                <DataListCell isIcon key={`${item.uid}-icon`}>
                  {getIcon(item)}
                </DataListCell>,
                <DataListCell
                  style={{ paddingTop: 'var(--pf-global--spacer--sm)' }}
                  width={2}
                  wrapModifier="truncate"
                  key={`${item.uid}-name`}
                >
                  <span className="odc-quick-search-list__item-name">{item.name}</span>
                  <Split style={{ alignItems: 'center' }} hasGutter>
                    <SplitItem>
                      <Label>{item.type}</Label>
                    </SplitItem>
                    <SplitItem>
                      <TextContent>
                        <Text component={TextVariants.small}>{item.provider}</Text>
                      </TextContent>
                    </SplitItem>
                  </Split>
                </DataListCell>,
              ]}
            />
          </DataListItemRow>
        </DataListItem>
      ))}
      <DataListItem
        id="viewAll"
        className="odc-quick-search-list__all-items"
        onClick={goToCatalogPage}
      >
        <DataListItemRow className="odc-quick-search-list__all-items-link">
          <DataListItemCells
            dataListCells={[
              <DataListCell key="view-all-link">
                <Button variant="link" tabIndex={-1}>
                  {t('topology~View all results for "{{searchTerm}}" ({{totalItems, number}})', {
                    searchTerm,
                    totalItems,
                  })}
                </Button>
              </DataListCell>,
            ]}
          />
        </DataListItemRow>
      </DataListItem>
    </DataList>
  );
};

export default QuickSearchList;
