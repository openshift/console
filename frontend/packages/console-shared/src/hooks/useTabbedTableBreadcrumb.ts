import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
// FIXME upgrading redux types is causing many errors at this time
// eslint-disable-next-line @typescript-eslint/ban-ts-ignore
// @ts-ignore
import { useSelector } from 'react-redux';
import { match as RMatch } from 'react-router-dom';
import { getBreadcrumbPath } from '@console/internal/components/utils/breadcrumbs';
import { K8sKind } from '@console/internal/module/k8s';
import { getActiveNamespace } from '@console/internal/reducers/ui';
import { RootState } from '@console/internal/redux';
import { ALL_NAMESPACES_KEY } from '../constants/common';
import { useActivePerspective } from './useActivePerspective';

type Match = RMatch<{ url: string }>;

export const useTabbedTableBreadcrumbsFor = (
  kindObj: K8sKind,
  match: Match,
  navOption: string,
  subTab: string = null,
  customBreadcrumbName?: string,
) => {
  const { t } = useTranslation();
  const { label, labelKey, labelPlural, labelPluralKey } = kindObj;
  const currentNamespace = useSelector((state: RootState) => getActiveNamespace(state));
  const isAdminPerspective = useActivePerspective()[0] === 'admin';
  const nsURL =
    ALL_NAMESPACES_KEY === currentNamespace ? 'all-namespaces' : `ns/${currentNamespace}`;
  return useMemo(
    () =>
      subTab === null
        ? []
        : [
            {
              name: customBreadcrumbName || (labelPluralKey ? t(labelPluralKey) : labelPlural),
              path: isAdminPerspective
                ? `/${navOption}/${nsURL}/${subTab}`
                : getBreadcrumbPath(match),
            },
            {
              name: t('console-shared~{{label}} details', {
                label: labelKey ? t(labelKey) : label,
              }),
              path: match.url,
            },
          ],
    [
      subTab,
      customBreadcrumbName,
      labelPluralKey,
      t,
      labelPlural,
      isAdminPerspective,
      navOption,
      nsURL,
      match,
      labelKey,
      label,
    ],
  );
};
