import * as React from 'react';
import { FieldLevelHelp } from '@console/internal/components/utils';

export const EfficiencyItemBody: React.FC<EfficiencyItemBodyProps> = React.memo(
  ({ stats, title, infoText, isLoading, error, getStats }) => {
    let status: React.ReactElement;
    if (isLoading) {
      status = <div className="skeleton-text ceph-storage-efficiency-card__item-body--loading" />;
    } else if (error || stats <= 0) {
      status = <span className="co-dashboard-text--small text-muted">Not available</span>;
    } else {
      status = <span className="ceph-storage-efficiency-card__item-text">{getStats()}</span>;
    }
    return (
      <div className="co-inventory-card__item">
        <div className="ceph-storage-efficiency-card__item-title">{title}</div>
        <div className="ceph-storage-efficiency-card__item-status">
          {status}
          <FieldLevelHelp>{infoText}</FieldLevelHelp>
        </div>
      </div>
    );
  },
);

type EfficiencyItemBodyProps = {
  stats: number;
  title: string;
  infoText: string;
  isLoading: boolean;
  error: boolean;
  getStats: () => string;
};
