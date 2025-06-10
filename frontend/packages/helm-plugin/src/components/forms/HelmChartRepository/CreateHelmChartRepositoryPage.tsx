import * as React from 'react';
import { useTranslation } from 'react-i18next';
import { useParams } from 'react-router-dom-v5-compat';
import NamespacedPage, {
  NamespacedPageVariants,
} from '@console/dev-console/src/components/NamespacedPage';
import {
  K8sResourceKindReference,
  useAccessReview,
  useActivePerspective,
} from '@console/dynamic-plugin-sdk/src';
import {
  HelmChartRepositoryModel,
  ProjectHelmChartRepositoryModel,
} from '@console/helm-plugin/src/models';
import { history } from '@console/internal/components/utils';
import { kindForReference } from '@console/internal/module/k8s';
import { ALL_NAMESPACES_KEY, useQueryParams } from '@console/shared/src';
import { DocumentTitle } from '@console/shared/src/components/document-title/DocumentTitle';
import CreateHelmChartRepository from './CreateHelmChartRepository';

const CreateHelmChartRepositoryPage: React.FC = () => {
  const { t } = useTranslation();
  const params = useParams();
  const queryParams = useQueryParams();
  const [activePerspective] = useActivePerspective();
  const namespace = params.ns;
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

  const handleNamespaceChange = (ns: string) => {
    if (ns === ALL_NAMESPACES_KEY) {
      history.push(`/helm-repositories/all-namespaces`);
    } else if (ns !== namespace) {
      history.push(`/helm-repositories/ns/${ns}`);
    }
  };

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
    <NamespacedPage
      variant={NamespacedPageVariants.light}
      hideApplications
      disabled={activePerspective === 'dev'}
      onNamespaceChange={handleNamespaceChange}
    >
      {renderForm()}
    </NamespacedPage>
  );
};

export default CreateHelmChartRepositoryPage;
