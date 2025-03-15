/* eslint-disable tsdoc/syntax */
import { Button, Divider, Flex, FlexItem } from '@patternfly/react-core';
import { useTranslation } from 'react-i18next';

export const RowFilter = ({ allSelected, itemCount, selectedCount, onSelectAll, children }) => {
  const { t } = useTranslation();
  return (
    <Flex
      className="co-row-filter pf-v6-u-mb-lg pf-v6-u-px-sm-on-md pf-v6-u-py-sm-on-md"
      direction={{ default: 'column', md: 'row' }}
    >
      {children}
      <Divider className="pf-v6-u-hidden-on-md" />
      <Flex flex={{ default: 'flex_1' }}>
        <FlexItem className="pf-v6-u-ml-md-on-md">
          <Button
            disabled={allSelected}
            type="button"
            onClick={onSelectAll}
            variant="link"
            isInline
          >
            {t('public~Select all filters')}
          </Button>
        </FlexItem>
        <FlexItem align={{ default: 'alignRight' }} className="co-row-filter__items">
          {itemCount === selectedCount ? (
            itemCount
          ) : (
            <>{t('public~{{selectedCount}} of {{itemCount}}', { selectedCount, itemCount })}</>
          )}{' '}
          {t('public~Item', { count: itemCount })}
        </FlexItem>
      </Flex>
    </Flex>
  );
};

export const storagePrefix = 'rowFilter-';
