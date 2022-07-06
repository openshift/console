import * as React from 'react';
import * as _ from 'lodash';
import { useTranslation } from 'react-i18next';
import { match } from 'react-router';
import { useAccessReview } from '@console/dynamic-plugin-sdk/src';
import { MultiListPage } from '@console/internal/components/factory';
import { AccessDenied } from '@console/internal/components/utils';
import { referenceForModel } from '@console/internal/module/k8s';
import { HelmChartRepositoryModel, ProjectHelmChartRepositoryModel } from '../../models';
import RepositoriesList from './RepositoriesList';

interface RepositoriesPageProps {
  match: match<{ ns?: string }>;
}

const RepositoriesPage: React.FC<RepositoriesPageProps> = (props) => {
  const { t } = useTranslation();
  const namespace = props.match.params.ns;
  const [projectHelmChartAccess, loadingPHCR] = useAccessReview({
    group: ProjectHelmChartRepositoryModel.apiGroup,
    resource: ProjectHelmChartRepositoryModel.plural,
    verb: 'list',
    namespace,
  });
  const [helmChartAccess, loadingHCR] = useAccessReview({
    group: HelmChartRepositoryModel.apiGroup,
    resource: HelmChartRepositoryModel.plural,
    verb: 'list',
  });
  let resources = [];
  if (projectHelmChartAccess && helmChartAccess) {
    resources = [
      {
        prop: 'helmChartRepository',
        kind: referenceForModel(HelmChartRepositoryModel),
        namespaced: false,
        isList: true,
      },
      {
        prop: 'projectHelmChartRepository',
        kind: referenceForModel(ProjectHelmChartRepositoryModel),
        namespaced: true,
        namespace,
        isList: true,
      },
    ];
  } else if (projectHelmChartAccess && !helmChartAccess) {
    resources = [
      {
        prop: 'projectHelmChartRepository',
        kind: referenceForModel(ProjectHelmChartRepositoryModel),
        namespaced: true,
        namespace,
        isList: true,
      },
    ];
  } else if (!projectHelmChartAccess && helmChartAccess) {
    resources = [
      {
        prop: 'helmChartRepository',
        kind: referenceForModel(HelmChartRepositoryModel),
        namespaced: false,
        isList: true,
      },
    ];
  }

  const flatten = (resourceLists) => {
    const projectHelmChartRepositoryData = _.get(
      resourceLists?.projectHelmChartRepository,
      'data',
      [],
    );
    const helmChartRepositoryData = _.get(resourceLists?.helmChartRepository, 'data', []);
    const repositoriesListData = _.concat(projectHelmChartRepositoryData, helmChartRepositoryData);
    return repositoriesListData;
  };

  return projectHelmChartAccess || helmChartAccess ? (
    <MultiListPage
      namespace={namespace}
      flatten={flatten}
      resources={resources}
      label={t('helm-plugin~Repositories')}
      ListComponent={RepositoriesList}
    />
  ) : !loadingPHCR && !loadingHCR ? (
    <AccessDenied />
  ) : null;
};
export default RepositoriesPage;
