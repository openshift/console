import * as React from 'react';
import { Link } from 'react-router-dom';
import { humanizeNumber } from '@console/internal/components/utils';
import { PrometheusResponse } from '@console/internal/components/graphs';
import { getGaugeValue } from '../../utils';

const formatCount = (count: number) => {
  const hCount = humanizeNumber(count);
  return `${hCount.string} Object${count === 1 ? '' : 's'}`;
};

export const BucketsTitle: React.FC<BucketsTitleProps> = ({ objects, link, error, children }) => {
  let objectsBody: JSX.Element;
  if (!objects && !error) {
    objectsBody = <div className="skeleton-text" />;
  } else {
    const objectsCount = getGaugeValue(objects);
    objectsBody = (
      <div className="co-dashboard-text--small text-secondary">
        {!error && objectsCount ? formatCount(Number(objectsCount)) : 'Not available'}
      </div>
    );
  }
  return (
    <div className="nb-buckets-card__buckets-status-title">
      {link ? <Link to={link}>{children}</Link> : children}
      {objectsBody}
    </div>
  );
};

export type BucketsTitleProps = {
  objects: PrometheusResponse;
  link: string;
  error: boolean;
};

export type BucketsItemProps = {
  bucketsCount: number;
  hasLoadError: boolean;
  isLoading: boolean;
  links: string[];
  objectsCount: string;
  title: string;
  unhealthyCounts: number[];
};
