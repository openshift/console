import * as React from 'react';
import { Link } from 'react-router-dom';
import { InProgressIcon } from '@patternfly/react-icons';
import { RedExclamationCircleIcon } from '@console/shared';
import { humanizeNumber, pluralize } from '@console/internal/components/utils';
import { PrometheusResponse } from '@console/shared/src/types/monitoring';
import { getGaugeValue } from '../../utils';

const formatCount = (count: number) => {
  const hCount = humanizeNumber(count);
  return `${hCount.string} Object${count === 1 ? '' : 's'}`;
};

// Displays count of erroneous buckets due to issues not externalized as phase
const OtherFailure: React.FC<BucketFailureItemProps> = React.memo(({ link, status }) => (
  <div className="nb-buckets-card__buckets-failure-status-item">
    <a
      className="nb-buckets-card__buckets-failure-status-item--link"
      href={link}
      target="_blank"
      rel="noopener noreferrer"
    >
      <RedExclamationCircleIcon />
      <span className="nb-buckets-card__buckets-failure-status-count">{status}</span>
    </a>
  </div>
));

// Displays count of erroneous buckets due to failure in provision
const ProvisioningFailure: React.FC<BucketFailureItemProps> = React.memo(({ link, status }) => (
  <div className="nb-buckets-card__buckets-failure-status-item">
    <Link to={link} className="nb-buckets-card__buckets-failure-status-item--link">
      <InProgressIcon className="co-inventory-card__status-icon--progress" />
      <span className="nb-buckets-card__buckets-failure-status-count">{status}</span>
    </Link>
  </div>
));

// Displays count of erroneous buckets
const BucketFailureStatus: React.FC<BucketFailureStatusProps> = React.memo(
  ({ failureCounts, failureLinks }) => (
    <div className="nb-buckets-card__buckets-failure-status">
      {failureCounts[0] > 0 && <OtherFailure link={failureLinks[0]} status={failureCounts[0]} />}
      {failureCounts[1] > 0 && (
        <ProvisioningFailure link={failureLinks[1]} status={failureCounts[1]} />
      )}
    </div>
  ),
);

// Displays count of buckets and objects present in buckets
const BucketsStatus: React.FC<BucketsStatusProps> = React.memo(
  ({ isLoading, hasLoadError, title, bucketsCount, objectsCount }) => {
    let body: JSX.Element;
    if (isLoading && !hasLoadError) {
      body = (
        <>
          <div className="co-inventory-card__item-title">
            <div className="skeleton-inventory" />
            <div>{title}</div>
          </div>
          <div className="skeleton-text" />
        </>
      );
    } else {
      body = (
        <>
          <div>{hasLoadError ? title : pluralize(bucketsCount, title)}</div>
          <div className="co-dashboard-text--small text-secondary">
            {hasLoadError || !objectsCount ? 'Not available' : formatCount(Number(objectsCount))}
          </div>
        </>
      );
    }
    return <div className="nb-buckets-card__buckets-status-title">{body}</div>;
  },
);

// Displays Buckets and Bucket Claims information as rows
export const BucketsItem: React.FC<BucketsItemProps> = React.memo(
  ({ isLoading, hasLoadError, title, bucketsCount, objectsCount, unhealthyCounts, links }) => (
    <div className="co-inventory-card__item">
      <BucketsStatus
        title={title}
        bucketsCount={bucketsCount}
        objectsCount={objectsCount}
        hasLoadError={hasLoadError}
        isLoading={isLoading}
      />
      {!(isLoading || hasLoadError) && (
        <BucketFailureStatus failureCounts={unhealthyCounts} failureLinks={links} />
      )}
    </div>
  ),
);

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

type BucketsStatusProps = {
  bucketsCount: number;
  isLoading: boolean;
  hasLoadError: boolean;
  objectsCount: string;
  title: string;
};

type BucketFailureItemProps = {
  link: string;
  status: number;
};

type BucketFailureStatusProps = {
  failureCounts: number[];
  failureLinks: string[];
};
