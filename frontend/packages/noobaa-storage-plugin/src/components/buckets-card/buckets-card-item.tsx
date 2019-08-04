import * as React from 'react';
import * as _ from 'lodash';
import { LoadingInline, pluralize } from '@console/internal/components/utils';
import { RedExclamationCircleIcon } from '@console/shared';

const pluralizeWithNotation = (i: number, suffix: string, singular: string) =>
  `${i}${suffix} ${i === 1 ? singular : `${singular}s`}`;

const formatCount = (count: number) => {
  if (count < 1000) return pluralizeWithNotation(count, '', 'Object');
  if (count >= 1000 && count < 1000000) return pluralizeWithNotation(count / 1000, 'K', 'Object');
  return pluralizeWithNotation(count / 1000000, 'M', 'Object');
};

const BucketsRowStatus: React.FC<BucketsRowStatusProps> = React.memo(({ status, link }) => (
  <div className="nb-buckets-card__row-status-item">
    {_.isNil(status) ? (
      <span className="nb-buckets-card__row-subtitle">Unavailable</span>
    ) : Number(status) > 0 ? (
      <React.Fragment>
        <a href={link} style={{ textDecoration: 'none' }}>
          <RedExclamationCircleIcon className="nb-bucket-card__status-icon" />
          <span className="nb-buckets-card__row-status-item-text">{status}</span>
        </a>
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
  ({ title, bucketsCount, objectsCount, unhealthyCount, isLoading, link }) =>
    isLoading ? (
      <LoadingInline />
    ) : (
      <div className="nb-buckets-card__row">
        <BucketsRow title={title} bucketsCount={bucketsCount} objectsCount={objectsCount} />
        <BucketsRowStatus status={unhealthyCount} link={link} />
      </div>
    ),
);

export type BucketsType = {
  bucketsCount: string;
  isLoading: boolean;
  objectsCount: string;
  unhealthyCount: string;
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
  status: string;
};
