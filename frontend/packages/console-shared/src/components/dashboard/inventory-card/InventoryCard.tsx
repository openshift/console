import * as React from 'react';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import {
  InventoryItemTitleProps,
  InventoryItemBodyProps,
  InventoryItemStatusProps,
} from '@console/dynamic-plugin-sdk';

const InventoryItem: React.FC = ({ children }) => (
  <div className="co-inventory-card__item">{children}</div>
);

export const InventoryItemLoading: React.FC = () => <div className="skeleton-inventory" />;

export const InventoryItemTitle: React.FC<InventoryItemTitleProps> = ({ children }) => (
  <div className="co-inventory-card__item-title">{children}</div>
);

export const InventoryItemBody: React.FC<InventoryItemBodyProps> = ({ error, children }) => {
  const { t } = useTranslation();
  return (
    <div className="co-inventory-card__item-status">
      {error ? (
        <div className="co-dashboard-text--small text-secondary">
          {t('console-shared~Not available')}
        </div>
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
      <span>{count}</span>
      <span className="co-dashboard-icon co-icon-space-l">{icon}</span>
    </>
  );
  return (
    <div className="co-inventory-card__status">
      {linkTo ? <Link to={linkTo}>{body}</Link> : body}
    </div>
  );
};

export default InventoryItem;
