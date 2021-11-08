import * as React from 'react';
import { useTranslation } from 'react-i18next';
import { FieldLevelHelp } from '@console/internal/components/utils';
import './storage-efficiency-card.scss';

export const EfficiencyItemBody: React.FC<EfficiencyItemBodyProps> = React.memo(
  ({ stats, title, infoText, isLoading, error, getStats }) => {
    const { t } = useTranslation();

    let status: React.ReactElement;

    if (isLoading) {
      status = <div className="skeleton-text ceph-storage-efficiency-card__item-body--loading" />;
    } else if (error || stats <= 0) {
      status = <span className="text-muted">{t('ceph-storage-plugin~Not available')}</span>;
    } else {
      status = <span className="ceph-storage-efficiency-card__item-text">{getStats()}</span>;
    }
    return (
      <div className="co-inventory-card__item">
        <div className="ceph-storage-efficiency-card__item-title">{title}</div>
        <div
          className="ceph-storage-efficiency-card__item-status"
          data-test={`${title}-efficiency-card-status`}
        >
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
