import * as React from 'react';
import { LoadingInline } from '@console/internal/components/utils';

export const ResourceProvidersBody: React.FC<ResourceProvidersBodyProps> = ({
  isLoading,
  hasProviders,
  children,
  error,
}) => {
  let body;
  if (isLoading) {
    body = <LoadingInline />;
  }
  if (error || !hasProviders) {
    body = (
      <div className="nb-resource-providers-card__not-available text-secondary">Unavailable</div>
    );
  }
  return <div className="co-dashboard-card__body--no-padding">{body || children}</div>;
};

type ResourceProvidersBodyProps = {
  children: React.ReactNode;
  hasProviders: boolean;
  isLoading: boolean;
  error: boolean;
};
