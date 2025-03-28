import * as React from 'react';
import * as _ from 'lodash';
import { useTranslation } from 'react-i18next';
import { useParams } from 'react-router-dom-v5-compat';
import { useAccessReview } from '@console/dynamic-plugin-sdk/src';
import { MultiListPage } from '@console/internal/components/factory';
import { referenceForModel } from '@console/internal/module/k8s';
import { DocumentTitle } from '@console/shared/src/components/document-title/DocumentTitle';
import { HelmChartRepositoryModel, ProjectHelmChartRepositoryModel } from '../../models';
import RepositoriesList from './RepositoriesList';

type RepositoriesPageProps = {
  title?: string;
  canCreate?: boolean;
  createButtonText?: string;
  createProps?: {
    to: string;
  };
};

const RepositoriesPage: React.FC<RepositoriesPageProps> = ({
  title,
  canCreate = false,
  createButtonText,
  createProps,
}) => {
  const { t } = useTranslation();
  const { ns: namespace } = useParams();
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
    <>
      <DocumentTitle>{t('helm-plugin~Helm Repositories')}</DocumentTitle>
      <MultiListPage
        namespace={namespace}
        flatten={flatten}
        resources={resources}
        label={t('helm-plugin~Repositories')}
        ListComponent={RepositoriesList}
        title={title}
        createProps={createProps}
        canCreate={canCreate}
        createButtonText={createButtonText}
      />
    </>
  );
};
export default RepositoriesPage;
