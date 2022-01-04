import * as React from 'react';
import * as classNames from 'classnames';
import { useTranslation } from 'react-i18next';

export const MirroringCardItem: React.FC<MirroringCardItemProps> = React.memo(
  ({ title, isLoading = false, children, error = false, valueClassName, errorMessage }) => {
    const { t } = useTranslation();

    let status: React.ReactNode;

    if (error) {
      status = (
        <span className="text-secondary">
          {errorMessage || t('ceph-storage-plugin~Not available')}
        </span>
      );
    } else if (isLoading) {
      status = <div className="skeleton-text" />;
    } else {
      status = children;
    }
    return (
      <>
        {title && (
          <dt
            className="odf-block-pool__mirroring-card-item-dt"
            data-test="mirroring-card-item-title"
          >
            {title}
          </dt>
        )}
        <dd
          className={classNames('odf-block-pool__mirroring-card-item-dd', valueClassName)}
          data-test="mirroring-card-item-value"
        >
          {status}
        </dd>
      </>
    );
  },
);

type MirroringCardItemProps = {
  children: React.ReactNode;
  title?: string;
  isLoading?: boolean;
  error?: boolean;
  valueClassName?: string;
  errorMessage?: string;
};
