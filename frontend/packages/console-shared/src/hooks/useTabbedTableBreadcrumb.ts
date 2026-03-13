import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { useSelector } from 'react-redux';
import type { Location } from 'react-router';
import { createPath } from 'react-router';
import { getBreadcrumbPath } from '@console/internal/components/utils/breadcrumbs';
import type { K8sKind } from '@console/internal/module/k8s';
import { getActiveNamespace } from '@console/internal/reducers/ui';
import type { RootState } from '@console/internal/redux';
import { ALL_NAMESPACES_KEY } from '../constants/common';

export const useTabbedTableBreadcrumbsFor = (
  kindObj: K8sKind,
  location: Location,
  params: { [key: string]: string },
  navOption: string,
  subTab: string = null,
  customBreadcrumbName?: string,
  customBreadcrumbURLRequired?: boolean,
  customBreadCrumbDetailsPrefix?: string,
) => {
  const { t } = useTranslation();
  const { label, labelKey, labelPlural, labelPluralKey } = kindObj;
  const currentNamespace = useSelector((state: RootState) => getActiveNamespace(state));
  const nsURL =
    ALL_NAMESPACES_KEY === currentNamespace ? 'all-namespaces' : `ns/${currentNamespace}`;
  return useMemo(
    () =>
      subTab === null
        ? []
        : [
            {
              name: customBreadcrumbName || (labelPluralKey ? t(labelPluralKey) : labelPlural),
              path: customBreadcrumbURLRequired
                ? `/${navOption}/${nsURL}/${subTab}`
                : getBreadcrumbPath(params),
            },
            {
              name: t('console-shared~{{label}} details', {
                label: customBreadCrumbDetailsPrefix || (labelKey ? t(labelKey) : label),
              }),
              path: createPath(location),
            },
          ],
    [
      subTab,
      customBreadcrumbName,
      customBreadcrumbURLRequired,
      customBreadCrumbDetailsPrefix,
      labelPluralKey,
      t,
      labelPlural,
      navOption,
      nsURL,
      location,
      params,
      labelKey,
      label,
    ],
  );
};
