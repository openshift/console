import * as React from 'react';
import * as _ from 'lodash';
import { DashboardCardHelp } from '@console/internal/components/dashboard/dashboard-card';
import {
  humanizeBinaryBytesWithoutB,
  humanizePercentage,
  LoadingInline,
} from '@console/internal/components/utils';

const ItemBody: React.FC<ItemBodyProps> = React.memo(({ title, children }) => (
  <div className="nb-object-data-reduction-card__row">
    <div className="nb-object-data-reduction-card__row-title">{title}</div>
    {children}
  </div>
));

export const EfficiencyItem: React.FC<EfficiencyItemProps> = React.memo(
  ({ efficiency, isLoading }) => {
    let text = <span className="text-secondary">Unavailable</span>;
    const infoText =
      'Efficiency ratio refers to the deduplication and compression process effectiveness.';

    if (isLoading) {
      text = <LoadingInline />;
    } else if (!_.isNil(efficiency)) {
      text = (
        <span className="nb-object-data-reduction-card__row-status-item-text">
          {Number(efficiency).toFixed(1)}:1
        </span>
      );
    }
    return (
      <ItemBody title="Efficiency">
        <div className="nb-object-data-reduction-card__row-status-item">
          {text}
          <DashboardCardHelp>{infoText}</DashboardCardHelp>
        </div>
      </ItemBody>
    );
  },
);

export const SavingsItem: React.FC<SavingsItemProps> = React.memo(
  ({ savings, logicalSize, isLoading }) => {
    let text = <span className="text-secondary">Unavailable</span>;
    const infoText =
      'Savings shows the uncompressed and non-deduped data that would have been stored without those techniques';

    if (isLoading) {
      text = <LoadingInline />;
    } else if (!_.isNil(savings)) {
      const savingsPercentage = humanizePercentage((100 * Number(savings)) / Number(logicalSize));
      const savingsFormattted = humanizeBinaryBytesWithoutB(Number(savings));
      text = (
        <span className="nb-object-data-reduction-card__row-status-item-text">
          {savingsFormattted.value}
          {savingsFormattted.unit}({savingsPercentage.string})
        </span>
      );
    }
    return (
      <ItemBody title="Savings">
        <div className="nb-object-data-reduction-card__row-status-item">
          {text}
          <DashboardCardHelp>{infoText}</DashboardCardHelp>
        </div>
      </ItemBody>
    );
  },
);

type ItemBodyProps = {
  title: string;
  children: React.ReactNode;
};

type EfficiencyItemProps = {
  efficiency: string;
  isLoading: boolean;
};

type SavingsItemProps = {
  savings: string;
  logicalSize: string;
  isLoading: boolean;
};
