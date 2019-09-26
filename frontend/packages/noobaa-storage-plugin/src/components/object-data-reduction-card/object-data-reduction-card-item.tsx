import * as React from 'react';
import * as _ from 'lodash';
import { DashboardCardHelp } from '@console/internal/components/dashboard/dashboard-card';
import {
  humanizeBinaryBytesWithoutB,
  humanizePercentage,
  LoadingInline,
} from '@console/internal/components/utils';

const ItemBody: React.FC<ItemBodyProps> = React.memo(
  ({ title, stats, infoText, isLoading, error }) => {
    let status: React.ReactElement;
    if (error) {
      status = <span className="co-dashboard-text--small text-muted">Unavailable</span>;
    } else if (isLoading) {
      status = <LoadingInline />;
    } else if (!stats) {
      status = <span className="co-dashboard-text--small text-muted">Unavailable</span>;
    } else {
      status = <span className="nb-object-data-reduction-card__row-status-item-text">{stats}</span>;
    }
    return (
      <div className="co-inventory-card__item">
        <div className="nb-object-data-reduction-card__row-title">{title}</div>
        <div className="nb-object-data-reduction-card__row-status-item">
          {status}
          <DashboardCardHelp>{infoText}</DashboardCardHelp>
        </div>
      </div>
    );
  },
);

export const EfficiencyItem: React.FC<EfficiencyItemProps> = React.memo(
  ({ efficiency, isLoading, error }) => {
    const infoText =
      'Efficiency ratio refers to the deduplication and compression process effectiveness.';
    const stats: string = !_.isNil(efficiency) ? `${Number(efficiency).toFixed(1)}:1` : null;
    return (
      <ItemBody
        title="Efficiency Ratio"
        stats={stats}
        infoText={infoText}
        isLoading={isLoading}
        error={error}
      />
    );
  },
);

export const SavingsItem: React.FC<SavingsItemProps> = React.memo(
  ({ savings, logicalSize, isLoading, error }) => {
    const infoText =
      'Savings shows the uncompressed and non-deduped data that would have been stored without those techniques';
    let stats: string = null;
    if (!_.isNil(savings)) {
      const savingsPercentage = logicalSize
        ? `(${humanizePercentage((100 * Number(savings)) / logicalSize).string})`
        : '';
      stats = `${humanizeBinaryBytesWithoutB(savings).string} ${savingsPercentage}`;
    }
    return (
      <ItemBody
        title="Savings"
        stats={stats}
        infoText={infoText}
        isLoading={isLoading}
        error={error}
      />
    );
  },
);

type ItemBodyProps = {
  title: string;
  stats: string;
  infoText: string;
  isLoading: boolean;
  error: boolean;
};

type EfficiencyItemProps = {
  efficiency: string;
  isLoading: boolean;
  error: boolean;
};

type SavingsItemProps = {
  savings: string;
  logicalSize: number;
  isLoading: boolean;
  error: boolean;
};
