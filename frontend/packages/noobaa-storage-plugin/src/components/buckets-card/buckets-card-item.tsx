import * as React from 'react';
import * as _ from 'lodash';
import { RedExclamationCircleIcon } from '@console/shared';
import { LoadingInline, pluralize, humanizeNumber } from '@console/internal/components/utils';

const formatCount = (count: number) => {
  const hCount = humanizeNumber(count);
  return `${hCount.string} Object${count === 1 ? '' : 's'}`;
};

const BucketsRowStatus: React.FC<BucketsRowStatusProps> = React.memo(({ status }) => (
  <div className="nb-buckets-card__row-status-item">
    {_.isNil(status) ? (
      <span className="nb-buckets-card__row-subtitle">Unavailable</span>
    ) : Number(status) > 0 ? (
      <React.Fragment>
        <div>
          <RedExclamationCircleIcon />
        </div>
        <div className="nb-buckets-card__row-status-item-text">{status}</div>
      </React.Fragment>
    ) : null}
  </div>
));

const BucketsRow: React.FC<BucketsRowProps> = React.memo(
  ({ bucketsCount, title, objectsCount }) => {
    const subtitle = _.isNil(objectsCount) ? 'Unavailable' : formatCount(Number(objectsCount));
    return (
      <div className="nb-buckets-card__row-title">
        <div>{_.isNil(bucketsCount) ? title : pluralize(Number(bucketsCount), title)}</div>
        <div className="nb-buckets-card__row-subtitle">{subtitle}</div>
      </div>
    );
  },
);

export const BucketsItem: React.FC<BucketsItemProps> = React.memo(
  ({ title, bucketsCount, objectsCount, unhealthyCount, isLoading }) =>
    isLoading ? (
      <LoadingInline />
    ) : (
      <div className="nb-buckets-card__row">
        <BucketsRow title={title} bucketsCount={bucketsCount} objectsCount={objectsCount} />
        <BucketsRowStatus status={unhealthyCount} />
      </div>
    ),
);

export type BucketsType = {
  bucketsCount: string;
  objectsCount: string;
  unhealthyCount: string;
  isLoading: boolean;
};

type BucketsItemProps = {
  title: string;
  bucketsCount: string;
  objectsCount: string;
  unhealthyCount: string;
  isLoading: boolean;
};

type BucketsRowProps = {
  bucketsCount: string;
  title: string;
  objectsCount: string;
};

type BucketsRowStatusProps = {
  status: string;
};
