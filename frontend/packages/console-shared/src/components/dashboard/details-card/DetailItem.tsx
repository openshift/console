import * as React from 'react';
import * as classNames from 'classnames';

export const DetailItem: React.FC<DetailItemProps> = React.memo(
  ({ title, isLoading = false, children, error = false, valueClassName }) => {
    let status: React.ReactNode;
    if (error) {
      status = <span className="text-secondary">Not available</span>;
    } else if (isLoading) {
      status = <div className="skeleton-text" />;
    } else {
      status = children;
    }
    return (
      <>
        <dt className="co-details-card__item-title">{title}</dt>
        <dd className={classNames('co-details-card__item-value', valueClassName)}>{status}</dd>
      </>
    );
  },
);

export default DetailItem;

type DetailItemProps = {
  title: string;
  children: React.ReactNode;
  isLoading?: boolean;
  error?: boolean;
  valueClassName?: string;
};
