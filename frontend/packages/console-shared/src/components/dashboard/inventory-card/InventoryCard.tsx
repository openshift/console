import * as React from 'react';
import { Icon } from '@patternfly/react-core';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom-v5-compat';
import {
  InventoryItemTitleProps,
  InventoryItemBodyProps,
  InventoryItemStatusProps,
} from '@console/dynamic-plugin-sdk';

interface InventoryItemProps {
  children?: React.ReactNode;
}

const InventoryItem: Snail.FCC<InventoryItemProps> = ({ children }) => (
  <div className="co-inventory-card__item">{children}</div>
);

export const InventoryItemLoading: React.FC = () => <div className="skeleton-inventory" />;

export const InventoryItemTitle: Snail.FCC<InventoryItemTitleProps> = ({ children }) => (
  <div className="co-inventory-card__item-title">{children}</div>
);

export const InventoryItemBody: Snail.FCC<InventoryItemBodyProps> = ({ error, children }) => {
  const { t } = useTranslation();
  return (
    <div className="co-inventory-card__item-status">
      {error ? (
        <div className="pf-v6-u-text-color-subtle">{t('console-shared~Not available')}</div>
      ) : (
        children
      )}
    </div>
  );
};

export const InventoryItemStatus: React.FC<InventoryItemStatusProps> = ({
  count,
  icon,
  linkTo,
}) => {
  const body = (
    <>
      <span className="co-inventory-card__status-count">{count}</span> <Icon size="xl">{icon}</Icon>
    </>
  );
  return (
    <div className="co-inventory-card__status">
      {linkTo ? <Link to={linkTo}>{body}</Link> : body}
    </div>
  );
};

export default InventoryItem;
