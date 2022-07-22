import * as React from 'react';
import Helmet from 'react-helmet';
import { useTranslation } from 'react-i18next';
import NamespacedPage, {
  NamespacedPageVariants,
} from '@console/dev-console/src/components/NamespacedPage';
import { useAccessReview } from '@console/dynamic-plugin-sdk/src';
import {
  HelmChartRepositoryModel,
  ProjectHelmChartRepositoryModel,
} from '@console/helm-plugin/src/models';
import { K8sResourceKindReference } from '@console/internal/module/k8s';
import { useActiveNamespace, useQueryParams } from '@console/shared/src';
import { HelmChartRepositoryType } from '../../../types/helm-types';
import CreateHelmChartRepository from './CreateHelmChartRepository';
import { getDefaultResource } from './helmchartrepository-create-utils';

const CreateHelmChartRepositoryPage: React.FC = () => {
  const queryParams = useQueryParams();
  const [namespace] = useActiveNamespace();
  const { t } = useTranslation();
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
  const resourceKind: K8sResourceKindReference = queryParams.get('kind');
  const actionOrigin = queryParams.get('actionOrigin');

  const newResource: HelmChartRepositoryType = getDefaultResource(namespace, resourceKind);

  return (
    <NamespacedPage variant={NamespacedPageVariants.light} hideApplications disabled>
      <Helmet data-test="form-title Create Helm Chart Repository">
        <title>{t('helm-plugin~Create Helm Chart Repository')}</title>
      </Helmet>
      <CreateHelmChartRepository
        resource={newResource}
        actionOrigin={actionOrigin}
        showScopeType={canCreateHCR && canCreatePHCR}
      />
    </NamespacedPage>
  );
};

export default CreateHelmChartRepositoryPage;
