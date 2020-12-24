import { match as RMatch } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { K8sKind } from '@console/internal/module/k8s';
// FIXME upgrading redux types is causing many errors at this time
// eslint-disable-next-line @typescript-eslint/ban-ts-ignore
// @ts-ignore
import { useSelector } from 'react-redux';
import { getBreadcrumbPath } from '@console/internal/components/utils/breadcrumbs';
import { RootState } from '@console/internal/redux';
import { getActiveNamespace } from '@console/internal/reducers/ui';
import { ALL_NAMESPACES_KEY } from '../constants/common';
import { useActivePerspective } from './useActivePerspective';

type Match = RMatch<{ url: string }>;

export const useTabbedTableBreadcrumbsFor = (
  kindObj: K8sKind,
  match: Match,
  navOption: string,
  subTab: string = null,
) => {
  const { t } = useTranslation();
  const currentNamespace = useSelector((state: RootState) => getActiveNamespace(state));
  const isAdminPerspective = useActivePerspective()[0] === 'admin';
  const nsURL =
    ALL_NAMESPACES_KEY === currentNamespace ? 'all-namespaces' : `ns/${currentNamespace}`;

  if (subTab == null) {
    return [];
  }

  return [
    {
      name: kindObj.labelPlural,
      path: isAdminPerspective ? `/${navOption}/${nsURL}/${subTab}` : getBreadcrumbPath(match),
    },
    { name: t('console-shared~{{label}} Details', { label: kindObj.label }), path: match.url },
  ];
};
