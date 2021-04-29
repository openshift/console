import * as React from 'react';
import { useTranslation } from 'react-i18next';
import { LoadingInline } from '@console/internal/components/utils';

export const ResourceProvidersBody: React.FC<ResourceProvidersBodyProps> = ({
  isLoading,
  hasProviders,
  children,
  error,
}) => {
  const { t } = useTranslation();

  let body: React.ReactNode;

  if (isLoading) {
    body = <LoadingInline />;
  }
  if (error || !hasProviders) {
    body = (
      <div className="nb-resource-providers-card__not-available text-secondary">
        {t('ceph-storage-plugin~Not available')}
      </div>
    );
  }
  return <>{body || children}</>;
};

type ResourceProvidersBodyProps = {
  children: React.ReactNode;
  hasProviders: boolean;
  isLoading: boolean;
  error: boolean;
};
