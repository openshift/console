import * as React from 'react';

import './OverviewStatusPopupItem.scss';

export type OverviewStatusPopupSectionProps = {
  firstColumn: React.ReactNode;
  secondColumn?: React.ReactNode;
};

export const OverviewStatusPopupSection: React.FC<OverviewStatusPopupSectionProps> = ({
  firstColumn,
  secondColumn,
  children,
}) => (
  <>
    <div className="co-overview-status-card__popup-row">
      <div className="co-overview-status-card__popup-text--bold">{firstColumn}</div>
      {secondColumn && <div className="text-secondary">{secondColumn}</div>}
    </div>
    {children}
  </>
);

export type OverviewStatusPopupItemProps = {
  children: React.ReactNode;
  value?: string;
  icon?: React.ReactNode;
};

export const OverviewStatusPopupItem: React.FC<OverviewStatusPopupItemProps> = ({
  value,
  icon,
  children,
}) => (
  <div className="co-overview-status-card__popup-row">
    {children}
    {(value || icon) && (
      <div className="co-overview-status-card__popup-status">
        {value && <div className="text-secondary">{value}</div>}
        {icon && <div className="co-overview-status-card__popup-icon">{icon}</div>}
      </div>
    )}
  </div>
);
