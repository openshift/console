import * as React from 'react';
import { LoadingInline } from '../../utils';

export const DetailItem: React.FC<DetailItemProps> = React.memo(
  ({ title, isLoading = false, children, error = false }) => {
    let status: React.ReactNode;
    if (error) {
      status = <span className="text-secondary">Unavailable</span>;
    } else if (isLoading) {
      status = <LoadingInline />;
    } else {
      status = children;
    }
    return (
      <React.Fragment>
        <dt className="co-details-card__item-title">{title}</dt>
        <dd className="co-details-card__item-value">{status}</dd>
      </React.Fragment>
    );
  }
);

type DetailItemProps = {
  title: string;
  isLoading?: boolean;
  error?: boolean;
  children: React.ReactNode;
};
