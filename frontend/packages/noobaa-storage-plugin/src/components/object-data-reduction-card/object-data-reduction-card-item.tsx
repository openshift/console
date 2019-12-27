import * as React from 'react';
import {
  FieldLevelHelp,
  humanizeBinaryBytes,
  humanizePercentage,
} from '@console/internal/components/utils';

const ItemBody: React.FC<ItemBodyProps> = React.memo(
  ({ title, stats, infoText, isLoading, error }) => {
    let status: React.ReactElement;
    if (isLoading) {
      status = <div className="skeleton-text nb-object-data-reduction__item-body--loading" />;
    } else if (error || !stats) {
      status = <span className="co-dashboard-text--small text-muted">Not available</span>;
    } else {
      status = <span className="nb-object-data-reduction-card__row-status-item-text">{stats}</span>;
    }
    return (
      <div className="co-inventory-card__item">
        <div className="nb-object-data-reduction-card__row-title">{title}</div>
        <div className="nb-object-data-reduction-card__row-status-item">
          {status}
          <FieldLevelHelp>{infoText}</FieldLevelHelp>
        </div>
      </div>
    );
  },
);

export const EfficiencyItem: React.FC<EfficiencyItemProps> = React.memo(
  ({ efficiency, isLoading, error }) => {
    const infoText =
      'Efficiency ratio refers to the deduplication and compression process effectiveness.';
    let stats: string = efficiency;
    if (efficiency) {
      const formattedEfficiency = +Number(efficiency).toFixed(1);
      stats = formattedEfficiency === 0 ? '1:1' : `${formattedEfficiency}:1`;
    }
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
    const savingsValue = Number(savings);
    if (savings && logicalSize) {
      const savedBytes = humanizeBinaryBytes(savingsValue).string;
      const savingsPercentage = `${savedBytes} (${
        humanizePercentage((100 * savingsValue) / Number(logicalSize)).string
      })`;
      stats = savingsValue <= 0 ? 'No Savings' : savingsPercentage;
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
  logicalSize: string;
  isLoading: boolean;
  error: boolean;
};
