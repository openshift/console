import * as React from 'react';
import { useTranslation } from 'react-i18next';
import { useParams } from 'react-router-dom-v5-compat';
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
import { DocumentTitle } from '@console/shared/src/components/document-title/DocumentTitle';
import CreateHelmChartRepository from './CreateHelmChartRepository';

const CreateHelmChartRepositoryPage: React.FC = () => {
  const { t } = useTranslation();
  const params = useParams();
  const queryParams = useQueryParams();
  const resourceKind: K8sResourceKindReference = queryParams.get('kind');
  const existingRepo = params.name;
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
      <DocumentTitle>
        {isEditForm
          ? t('helm-plugin~Edit Helm Chart Repository')
          : t('helm-plugin~Create Helm Chart Repository')}
      </DocumentTitle>
      <CreateHelmChartRepository
        showScopeType={canCreateHCR && canCreatePHCR}
        existingRepoName={params.name}
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
