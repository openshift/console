import { useTranslation } from 'react-i18next';
import { useParams, useLocation } from 'react-router-dom-v5-compat';
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
  return useTabbedTableBreadcrumbsFor(
    kindObj,
    location,
    params,
    'helm',
    'repositories',
    t('helm-plugin~Repositories'),
    true,
  );
};
