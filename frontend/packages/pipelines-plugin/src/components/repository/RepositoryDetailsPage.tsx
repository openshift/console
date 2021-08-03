import * as React from 'react';
import { useTranslation } from 'react-i18next';
import { DetailsPageProps, DetailsPage } from '@console/internal/components/factory';
import { navFactory, Kebab } from '@console/internal/components/utils';
import { getInlineBadgeFromType } from '@console/shared';
import { RepositoryModel } from '../../models';
import RepositoryDetails from './RepositoryDetails';
import RepositoryPipelineRunListPage from './RepositoryPipelineRunListPage';

const RepositoryDetailsPage: React.FC<DetailsPageProps> = (props) => {
  const { t } = useTranslation();
  const title = (
    <>
      {props.name} {getInlineBadgeFromType(RepositoryModel.badge)}
    </>
  );

  return (
    <DetailsPage
      {...props}
      title={title}
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
