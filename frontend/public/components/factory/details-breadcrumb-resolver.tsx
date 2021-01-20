import * as React from 'react';
import { DetailsPageBreadCrumbsHook } from '@console/plugin-sdk';
import { match } from 'react-router';

type DetailsBreadcrumbResolverType = {
  useBreadcrumbs: DetailsPageBreadCrumbsHook;
  onBreadcrumbsResolved: (
    breadcrumbs: {
      name: string;
      path: string;
    }[],
  ) => void;
  kind: string;
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
    onBreadcrumbsResolved(breadcrumbs);
  }, [breadcrumbs, onBreadcrumbsResolved]);
  return null;
};

export default DetailsBreadcrumbResolver;
