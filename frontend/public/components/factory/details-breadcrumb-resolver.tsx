import * as React from 'react';
import { match } from 'react-router';
import { DetailsPageBreadCrumbsHook } from '@console/plugin-sdk';
import { K8sKind } from '@console/internal/module/k8s';

type DetailsBreadcrumbResolverType = {
  useBreadcrumbs: DetailsPageBreadCrumbsHook;
  onBreadcrumbsResolved: (
    breadcrumbs: {
      name: string;
      path: string;
    }[],
  ) => void;
  kind: K8sKind;
  urlMatch: match<any>;
};

const DetailsBreadcrumbResolver: React.FC<DetailsBreadcrumbResolverType> = ({
  useBreadcrumbs,
  onBreadcrumbsResolved,
  kind,
  urlMatch,
}) => {
  const breadcrumbs = useBreadcrumbs(kind, urlMatch);
  React.useEffect(() => {
    if (breadcrumbs?.length > 0) {
      onBreadcrumbsResolved(breadcrumbs);
    }
  }, [breadcrumbs, onBreadcrumbsResolved]);
  return null;
};

export default DetailsBreadcrumbResolver;
