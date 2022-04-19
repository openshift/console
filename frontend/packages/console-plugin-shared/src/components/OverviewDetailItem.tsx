import * as React from 'react';
import * as classNames from 'classnames';

import './OverviewDetailItem.css';

export type OverviewDetailItemProps = {
  title: string;
  children: React.ReactNode;
  isLoading?: boolean;
  valueClassName?: string;

  error?: boolean;
  /** Text for error === true, use "Not available" as a fallback */
  errorMessage?: string;
};

export const OverviewDetailItem: React.FC<OverviewDetailItemProps> = ({
  title,
  isLoading = false,
  children,
  error = false,
  valueClassName,
  errorMessage,
}) => {
  let status: React.ReactNode;

  if (error) {
    status = <span className="text-secondary">{errorMessage}</span>;
  } else if (isLoading) {
    status = <div className="skeleton-text" />;
  } else {
    status = children;
  }
  return (
    <>
      <dt className="co-details-card__item-title" data-test="detail-item-title">
        {title}
      </dt>
      <dd
        className={classNames('co-details-card__item-value', valueClassName)}
        data-test="detail-item-value"
      >
        {status}
      </dd>
    </>
  );
};
