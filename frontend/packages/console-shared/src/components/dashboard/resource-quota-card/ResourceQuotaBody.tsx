import type { FC, ReactNode } from 'react';
import { Children } from 'react';
import { useTranslation } from 'react-i18next';

import './resource-quota-card.scss';

const ResourceQuotaBody: FC<ResourceQuotaBodyProps> = ({ error, isLoading, noText, children }) => {
  let body: ReactNode;
  const { t } = useTranslation();
  if (error) {
    body = <div className="pf-v6-u-text-color-subtle">{t('console-shared~Not available')}</div>;
  } else if (isLoading) {
    body = <div className="skeleton-quota" />;
  } else if (!Children.count(children)) {
    body = (
      <div className="pf-v6-u-text-color-subtle">
        {noText || t('console-shared~No ResourceQuotas')}
      </div>
    );
  }

  return <>{body || children}</>;
};

export default ResourceQuotaBody;

type ResourceQuotaBodyProps = {
  error: boolean;
  isLoading: boolean;
  noText?: string;
  children?: ReactNode;
};
