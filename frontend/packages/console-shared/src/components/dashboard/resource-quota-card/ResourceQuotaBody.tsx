import * as React from 'react';
import { useTranslation } from 'react-i18next';

import './resource-quota-card.scss';

const ResourceQuotaBody: React.FC<ResourceQuotaBodyProps> = ({ error, isLoading, children }) => {
  let body: React.ReactNode;
  const { t } = useTranslation();
  if (error) {
    body = <div className="text-secondary">{t('console-shared~Not available')}</div>;
  } else if (isLoading) {
    body = <div className="skeleton-quota" />;
  } else if (!React.Children.count(children)) {
    body = <div className="text-secondary">{t('console-shared~No resource quotas')}</div>;
  }

  return <div className="co-dashboard-card__body--top-margin">{body || children}</div>;
};

export default ResourceQuotaBody;

type ResourceQuotaBodyProps = {
  error: boolean;
  isLoading: boolean;
};
