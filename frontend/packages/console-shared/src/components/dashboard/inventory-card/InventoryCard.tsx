import type { FC, ReactNode } from 'react';
import { Icon } from '@patternfly/react-core';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom-v5-compat';
import {
  InventoryItemTitleProps,
  InventoryItemBodyProps,
  InventoryItemStatusProps,
} from '@console/dynamic-plugin-sdk';

interface InventoryItemProps {
  children?: ReactNode;
}

const InventoryItem: FC<InventoryItemProps> = ({ children }) => (
  <div className="co-inventory-card__item">{children}</div>
);

export const InventoryItemLoading: FC = () => <div className="skeleton-inventory" />;

export const InventoryItemTitle: FC<InventoryItemTitleProps> = ({ children }) => (
  <div className="co-inventory-card__item-title">{children}</div>
);

export const InventoryItemBody: FC<InventoryItemBodyProps> = ({ error, children }) => {
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

export const InventoryItemStatus: FC<InventoryItemStatusProps> = ({ count, icon, linkTo }) => {
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
