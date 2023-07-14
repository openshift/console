/* eslint-disable tsdoc/syntax */
import * as React from 'react';
import * as classNames from 'classnames';
import { Button, Divider, Flex, FlexItem, ToggleGroup } from '@patternfly/react-core';
import { useTranslation } from 'react-i18next';

export const CheckBox = ({ title, active, number, toggle }) => {
  const klass = classNames('pf-c-toggle-group__button', {
    'pf-m-selected co-row-filter__box--active': active,
    'pf-m-disabled': !number,
  });

  return (
    <div className="pf-c-toggle-group__item">
      <a href="#" onClick={toggle} className={klass}>
        <span
          className={classNames('co-row-filter__number-bubble', {
            'co-row-filter__number-bubble--active': active,
          })}
        >
          {number}
        </span>
        {title}
      </a>
    </div>
  );
};

export const CheckBoxControls = ({
  allSelected,
  itemCount,
  selectedCount,
  onSelectAll,
  children,
}) => {
  const { t } = useTranslation();
  return (
    <Flex className="co-row-filter" direction={{ default: 'column', md: 'row' }}>
      <ToggleGroup>{children}</ToggleGroup>
      <Divider className="pf-u-hidden-on-md" />
      <Flex flex={{ default: 'flex_1' }}>
        <FlexItem>
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
