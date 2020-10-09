import * as React from 'react';
import { useTranslation } from 'react-i18next';
import { RouteComponentProps } from 'react-router';
import { getBadgeFromType } from '@console/shared';
import { withStartGuide } from '@console/internal/components/start-guide';
import { PipelineModel } from '../../models';
import CreateProjectListPage from '../projects/CreateProjectListPage';
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
        title={PipelineModel.labelPlural}
      />
    </div>
  ) : (
    <CreateProjectListPage
      title={PipelineModel.labelPlural}
      badge={getBadgeFromType(PipelineModel.badge)}
    >
      {t('devconsole~Select a project to view the list of {{pipelinesPageTitle}}', {
        pipelinesPageTitle: PipelineModel.labelPlural,
      })}
    </CreateProjectListPage>
  );
};

export default withStartGuide(PipelinesPage);
