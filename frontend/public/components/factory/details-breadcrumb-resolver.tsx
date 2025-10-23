import { DetailsPageBreadCrumbsHook } from '@console/dynamic-plugin-sdk/src/extensions/breadcrumbs';
import { useEffect } from 'react';
import { K8sKind } from '../../module/k8s';

type DetailsBreadcrumbResolverType = {
  useBreadcrumbs: DetailsPageBreadCrumbsHook;
  onBreadcrumbsResolved: (breadcrumbs: { name: string; path: string }[]) => void;
  kind: K8sKind;
  urlMatch: any;
};

const DetailsBreadcrumbResolver: React.FC<DetailsBreadcrumbResolverType> = ({
  useBreadcrumbs,
  onBreadcrumbsResolved,
  kind,
  urlMatch,
}) => {
  const breadcrumbs = useBreadcrumbs(kind, urlMatch);
  useEffect(() => {
    if (breadcrumbs?.length > 0) {
      onBreadcrumbsResolved(breadcrumbs);
    }
  }, [breadcrumbs, onBreadcrumbsResolved]);
  return null;
};

export default DetailsBreadcrumbResolver;
