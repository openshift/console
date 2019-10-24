import * as React from 'react';
import { LoadingInline } from '@console/internal/components/utils/status-box';

const DetailItem: React.FC<DetailItemProps> = React.memo(
  ({ title, isLoading = false, children, error = false }) => {
    let status: React.ReactNode;
    if (error) {
      status = <span className="text-secondary">Not available</span>;
    } else if (isLoading) {
      status = <LoadingInline />;
    } else {
      status = children;
    }
    return (
      <>
        <dt className="co-details-card__item-title">{title}</dt>
        <dd className="co-details-card__item-value">{status}</dd>
      </>
    );
  },
);

export default DetailItem;

type DetailItemProps = {
  title: string;
  isLoading?: boolean;
  error?: boolean;
  children: React.ReactNode;
};
