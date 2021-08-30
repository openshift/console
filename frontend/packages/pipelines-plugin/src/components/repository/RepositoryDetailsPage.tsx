import * as React from 'react';
import { useTranslation } from 'react-i18next';
import { DetailsPageProps, DetailsPage } from '@console/internal/components/factory';
import { navFactory, Kebab } from '@console/internal/components/utils';
import { useActivePerspective, useTabbedTableBreadcrumbsFor } from '@console/shared';
import { pipelinesTab } from '../../utils/pipeline-utils';
import RepositoryDetails from './RepositoryDetails';
import RepositoryPipelineRunListPage from './RepositoryPipelineRunListPage';

const RepositoryDetailsPage: React.FC<DetailsPageProps> = (props) => {
  const { t } = useTranslation();
  const { kindObj, match } = props;
  const isAdminPerspective = useActivePerspective()[0] === 'admin';
  const breadcrumbs = useTabbedTableBreadcrumbsFor(
    kindObj,
    match,
    isAdminPerspective ? 'pipelines' : 'dev-pipelines',
    pipelinesTab(kindObj),
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
