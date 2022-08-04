import * as React from 'react';
import * as _ from 'lodash';
import { useTranslation } from 'react-i18next';
import { match } from 'react-router';
import { useAccessReview } from '@console/dynamic-plugin-sdk/src';
import { MultiListPage } from '@console/internal/components/factory';
import { referenceForModel } from '@console/internal/module/k8s';
import { HelmChartRepositoryModel, ProjectHelmChartRepositoryModel } from '../../models';
import RepositoriesList from './RepositoriesList';

interface RepositoriesPageProps {
  match: match<{ ns?: string }>;
}

const RepositoriesPage: React.FC<RepositoriesPageProps> = (props) => {
  const { t } = useTranslation();
  const namespace = props.match.params.ns;
  const [projectHelmChartListAccess] = useAccessReview({
    group: ProjectHelmChartRepositoryModel.apiGroup,
    resource: ProjectHelmChartRepositoryModel.plural,
    verb: 'list',
    namespace,
  });

  const [helmChartListAccess] = useAccessReview({
    group: HelmChartRepositoryModel.apiGroup,
    resource: HelmChartRepositoryModel.plural,
    verb: 'list',
  });
  const [projectHelmChartEditAccess] = useAccessReview({
    group: ProjectHelmChartRepositoryModel.apiGroup,
    resource: ProjectHelmChartRepositoryModel.plural,
    verb: 'update',
    namespace,
  });

  const [helmChartEditAccess] = useAccessReview({
    group: HelmChartRepositoryModel.apiGroup,
    resource: HelmChartRepositoryModel.plural,
    verb: 'update',
  });

  let resources = [];
  if (
    projectHelmChartListAccess &&
    projectHelmChartEditAccess &&
    helmChartListAccess &&
    helmChartEditAccess
  ) {
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
  } else if (projectHelmChartListAccess && projectHelmChartEditAccess) {
    resources = [
      {
        prop: 'projectHelmChartRepository',
        kind: referenceForModel(ProjectHelmChartRepositoryModel),
        namespaced: true,
        namespace,
        isList: true,
      },
    ];
  } else if (helmChartListAccess && helmChartEditAccess) {
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

  return (
    <MultiListPage
      namespace={namespace}
      flatten={flatten}
      resources={resources}
      label={t('helm-plugin~Repositories')}
      ListComponent={RepositoriesList}
    />
  );
};
export default RepositoriesPage;
