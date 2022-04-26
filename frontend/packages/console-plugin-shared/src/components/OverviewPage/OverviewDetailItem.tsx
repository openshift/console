import * as React from 'react';
import * as classNames from 'classnames';

import './OverviewDetailItem.scss';

export type OverviewDetailItemProps = {
  title: string;
  children: React.ReactNode;
  isLoading?: boolean;
  valueClassName?: string;

  error?: string;
};

export const OverviewDetailItem: React.FC<OverviewDetailItemProps> = ({
  title,
  isLoading = false,
  children,
  error,
  valueClassName,
}) => {
  let status: React.ReactNode;

  if (error) {
    status = <span className="text-secondary">{error}</span>;
  } else if (isLoading) {
    status = <div className="skeleton-text" />;
  } else {
    status = children;
  }
  return (
    <>
      <dt className="co-overview-details-card__item-title" data-test="detail-item-title">
        {title}
      </dt>
      <dd
        className={classNames('co-overview-details-card__item-value', valueClassName)}
        data-test="detail-item-value"
      >
        {status}
      </dd>
    </>
  );
};
