import * as React from 'react';
import * as classNames from 'classnames';
import { useTranslation } from 'react-i18next';
import { DetailItemProps } from '@console/dynamic-plugin-sdk/src/api/internal-types';

export const DetailItem: React.FC<DetailItemProps> = React.memo(
  ({ title, isLoading = false, children, error = false, valueClassName, errorMessage }) => {
    const { t } = useTranslation();

    let status: React.ReactNode;

    if (error) {
      status = (
        <span className="text-secondary">{errorMessage || t('console-shared~Not available')}</span>
      );
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
  },
);

export default DetailItem;
