import * as React from 'react';
import { Skeleton } from '@patternfly/react-core';
import { Link } from 'react-router-dom';

import './OverviewInventoryItem.scss';

export const OverviewInventoryItem: React.FC = ({ children }) => (
  <div className="co-overview-inventory-card__item">{children}</div>
);

export const OverviewInventoryItemLoading: React.FC = () => (
  <Skeleton width="20px" className="co-overview-inventory-card__item-loading" />
);

export type OverviewInventoryItemTitleProps = {
  children: React.ReactNode;
};

export const OverviewInventoryItemTitle: React.FC<OverviewInventoryItemTitleProps> = ({
  children,
}) => <div className="co-overview-inventory-card__item-title">{children}</div>;

export type OverviewInventoryItemBodyProps = {
  error?: string;
};

export const OverviewInventoryItemBody: React.FC<OverviewInventoryItemBodyProps> = ({
  error,
  children,
}) => (
  <div className="co-overview-inventory-card__item-body">
    {error ? <div className="co-dashboard-text--small text-secondary">{error}</div> : children}
  </div>
);

export type OverviewInventoryItemStatusProps = {
  count: number;
  icon: React.ReactNode;
  linkTo?: string;
};

export const OverviewInventoryItemStatus: React.FC<OverviewInventoryItemStatusProps> = ({
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
    <div className="co-overview-inventory-card__item-status">
      {linkTo ? <Link to={linkTo}>{body}</Link> : body}
    </div>
  );
};
