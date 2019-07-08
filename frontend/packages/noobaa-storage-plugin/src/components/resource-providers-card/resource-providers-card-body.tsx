import * as React from 'react';
import { LoadingInline } from '@console/internal/components/utils';

export const ResourceProvidersBody: React.FC<ResourceProvidersBodyProps> = ({
  isLoading,
  hasProviders,
  children,
}) => {
  if (isLoading) {
    return <LoadingInline />;
  }
  if (!hasProviders) {
    return <div className="text-secondary">Unavailable</div>;
  }
  return <div>{children}</div>;
};

type ResourceProvidersBodyProps = {
  children: React.ReactNode;
  hasProviders: boolean;
  isLoading: boolean;
};
