import { useTranslation } from 'react-i18next';
import { useParams, useLocation } from 'react-router-dom-v5-compat';
import { useActivePerspective } from '@console/dynamic-plugin-sdk';
import { K8sKind } from '@console/internal/module/k8s';
import { useTabbedTableBreadcrumbsFor } from '@console/shared';
import { HelmChartRepositoryModel, ProjectHelmChartRepositoryModel } from '../models';

export const getHelmChartRepositoriesModel = () => [
  HelmChartRepositoryModel,
  ProjectHelmChartRepositoryModel,
];

export const useHelmChartRepositoriesBreadcrumbs = (kindObj: K8sKind) => {
  const { t } = useTranslation();
  const params = useParams();
  const location = useLocation();
  const isAdminPerspective = useActivePerspective()[0] === 'admin';
  return useTabbedTableBreadcrumbsFor(
    kindObj,
    location,
    params,
    'helm-releases',
    'repositories',
    isAdminPerspective ? undefined : t('helm-plugin~Repositories'),
    !isAdminPerspective,
  );
};
