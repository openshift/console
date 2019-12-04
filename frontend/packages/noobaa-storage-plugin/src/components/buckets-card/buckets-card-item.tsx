import * as React from 'react';
import * as _ from 'lodash';
import { RedExclamationCircleIcon } from '@console/shared';
import { LoadingInline, pluralize, humanizeNumber } from '@console/internal/components/utils';

const formatCount = (count: number) => {
  const hCount = humanizeNumber(count);
  return `${hCount.string} Object${count === 1 ? '' : 's'}`;
};

const BucketsRowStatus: React.FC<BucketsRowStatusProps> = React.memo(({ status, link, error }) => (
  <div className="nb-buckets-card__row-status-item">
    {error || _.isNil(status) ? (
      <span className="co-dashboard-text--small nb-buckets-card__row-subtitle">Not available</span>
    ) : Number(status) > 0 ? (
      <>
        <a href={link} style={{ textDecoration: 'none' }} target="_blank" rel="noopener noreferrer">
          <RedExclamationCircleIcon className="co-dashboard-icon nb-bucket-card__status-icon" />
          <span className="nb-buckets-card__row-status-item-text">{status}</span>
        </a>
      </>
    ) : null}
  </div>
));

const BucketsRow: React.FC<BucketsRowProps> = React.memo(
  ({ bucketsCount, title, objectsCount }) => {
    const subtitle: string = _.isNil(objectsCount)
      ? 'Not available'
      : formatCount(Number(objectsCount));
    return (
      <div className="nb-buckets-card__row-title">
        <div>{_.isNil(bucketsCount) ? title : pluralize(Number(bucketsCount), title)}</div>
        <div className="co-dashboard-text--small nb-buckets-card__row-subtitle">{subtitle}</div>
      </div>
    );
  },
);

export const BucketsItem: React.FC<BucketsItemProps> = React.memo(
  ({ title, bucketsCount, objectsCount, unhealthyCount, isLoading, link, error }) =>
    isLoading ? (
      <LoadingInline />
    ) : (
      <div className="co-inventory-card__item">
        <BucketsRow title={title} bucketsCount={bucketsCount} objectsCount={objectsCount} />
        <BucketsRowStatus status={unhealthyCount} link={link} error={error} />
      </div>
    ),
);

export type BucketsType = {
  bucketsCount: string;
  isLoading: boolean;
  objectsCount: string;
  unhealthyCount: string | number;
  error: boolean;
};

type BucketsItemProps = BucketsType & {
  link: string;
  title: string;
};

type BucketsRowProps = {
  bucketsCount: string;
  title: string;
  objectsCount: string;
};

type BucketsRowStatusProps = {
  link: string;
  status: string | number;
  error: boolean;
};
