import * as React from 'react';
import { useTranslation } from 'react-i18next';
import { useActivePerspective, DetailsPageProps } from '@console/dynamic-plugin-sdk';
import { DetailsPage } from '@console/internal/components/factory';
import { navFactory, Kebab } from '@console/internal/components/utils';
import { useTabbedTableBreadcrumbsFor } from '@console/shared';
import { useK8sModel } from '@console/shared/src/hooks/useK8sModel';
import { pipelinesTab } from '../../utils/pipeline-utils';
import RepositoryDetails from './RepositoryDetails';
import RepositoryPipelineRunListPage from './RepositoryPipelineRunListPage';

const RepositoryDetailsPage: React.FC<DetailsPageProps> = (props) => {
  const { t } = useTranslation();
  const { kind, match } = props;
  const [model] = useK8sModel(kind);

  const isAdminPerspective = useActivePerspective()[0] === 'admin';
  const breadcrumbs = useTabbedTableBreadcrumbsFor(
    model,
    match,
    isAdminPerspective ? 'pipelines' : 'dev-pipelines',
    pipelinesTab(model),
    undefined,
    true,
  );

  return (
    <DetailsPage
      {...props}
      breadcrumbsFor={() => breadcrumbs}
      title={props.name}
      menuActions={Kebab.factory.common}
      pages={[
        navFactory.details(RepositoryDetails),
        navFactory.editYaml(),
        {
          href: 'Runs',
          name: t('pipelines-plugin~Pipeline Runs'),
          component: RepositoryPipelineRunListPage,
        },
      ]}
    />
  );
};

export default RepositoryDetailsPage;
