import * as React from 'react';
import { useActivePerspective } from '@console/dynamic-plugin-sdk';
import { DetailsPageProps, DetailsPage } from '@console/internal/components/factory';
import { navFactory, Kebab } from '@console/internal/components/utils';
import { useTabbedTableBreadcrumbsFor } from '@console/shared';
import { pipelinesTab } from '../../utils/pipeline-utils';
import RepositoryDetails from './RepositoryDetails';
import RepositoryPipelineRunListPage from './RepositoryPipelineRunListPage';

const RepositoryDetailsPage: React.FC<DetailsPageProps> = (props) => {
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
          // t('pipelines-plugin~PipelineRuns')
          nameKey: 'pipelines-plugin~PipelineRuns',
          component: RepositoryPipelineRunListPage,
        },
      ]}
    />
  );
};

export default RepositoryDetailsPage;
