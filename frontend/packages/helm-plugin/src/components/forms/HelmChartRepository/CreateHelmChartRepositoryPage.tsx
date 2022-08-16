import * as React from 'react';
import Helmet from 'react-helmet';
import { useTranslation } from 'react-i18next';
import { RouteComponentProps } from 'react-router-dom';
import NamespacedPage, {
  NamespacedPageVariants,
} from '@console/dev-console/src/components/NamespacedPage';
import { K8sResourceKindReference, useAccessReview } from '@console/dynamic-plugin-sdk/src';
import {
  HelmChartRepositoryModel,
  ProjectHelmChartRepositoryModel,
} from '@console/helm-plugin/src/models';
import { kindForReference } from '@console/internal/module/k8s';
import { useQueryParams } from '@console/shared/src';
import CreateHelmChartRepository from './CreateHelmChartRepository';

export type CreateHelmChartRepositoryPageProps = RouteComponentProps<{ ns: string; name: string }>;

const CreateHelmChartRepositoryPage: React.FC<CreateHelmChartRepositoryPageProps> = ({ match }) => {
  const { t } = useTranslation();
  const queryParams = useQueryParams();
  const resourceKind: K8sResourceKindReference = queryParams.get('kind');
  const existingRepo = match.params.name;
  const isEditForm = !!existingRepo;
  const hideNamespacedPage =
    isEditForm && resourceKind && kindForReference(resourceKind) === HelmChartRepositoryModel.kind;
  const [canCreateHCR] = useAccessReview({
    group: HelmChartRepositoryModel.apiGroup,
    resource: HelmChartRepositoryModel.plural,
    verb: 'create',
  });

  const [canCreatePHCR] = useAccessReview({
    group: ProjectHelmChartRepositoryModel.apiGroup,
    resource: ProjectHelmChartRepositoryModel.plural,
    verb: 'create',
  });

  const renderForm = () => (
    <>
      <Helmet data-test={`form-title ${isEditForm ? 'Edit' : 'Create'} Helm Chart Repository`}>
        <title>
          {isEditForm
            ? t('helm-plugin~Edit Helm Chart Repository')
            : t('helm-plugin~Create Helm Chart Repository')}
        </title>
      </Helmet>
      <CreateHelmChartRepository
        showScopeType={canCreateHCR && canCreatePHCR}
        existingRepoName={match.params.name}
      />
    </>
  );

  return hideNamespacedPage ? (
    renderForm()
  ) : (
    <NamespacedPage variant={NamespacedPageVariants.light} hideApplications disabled>
      {renderForm()}
    </NamespacedPage>
  );
};

export default CreateHelmChartRepositoryPage;
