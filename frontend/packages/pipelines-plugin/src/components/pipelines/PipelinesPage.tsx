import * as React from 'react';
import { useTranslation } from 'react-i18next';
import { RouteComponentProps } from 'react-router';
import { getBadgeFromType } from '@console/shared';
import { withStartGuide } from '@console/internal/components/start-guide';
import CreateProjectListPage from '@console/dev-console/src/components/projects/CreateProjectListPage';
import { PipelineModel } from '../../models';
import PipelinesResourceList from './PipelinesResourceList';

type PipelinesPageProps = RouteComponentProps<{ ns: string }>;

export const PipelinesPage: React.FC<PipelinesPageProps> = (props) => {
  const { t } = useTranslation();
  const {
    match: {
      params: { ns: namespace },
    },
  } = props;
  return namespace ? (
    <div>
      <PipelinesResourceList
        {...props}
        badge={getBadgeFromType(PipelineModel.badge)}
        namespace={namespace}
        title={t('pipelines-plugin~Pipelines')}
      />
    </div>
  ) : (
    <CreateProjectListPage
      title={t('pipelines-plugin~Pipelines')}
      badge={getBadgeFromType(PipelineModel.badge)}
    >
      {t('pipelines-plugin~Select a Project to view the list of Pipelines')}
    </CreateProjectListPage>
  );
};

export default withStartGuide(PipelinesPage);
