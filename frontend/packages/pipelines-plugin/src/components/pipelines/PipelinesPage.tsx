import * as React from 'react';
import { useTranslation } from 'react-i18next';
import { RouteComponentProps } from 'react-router';
import { withStartGuide } from '@console/internal/components/start-guide';
import CreateProjectListPage from '@console/dev-console/src/components/projects/CreateProjectListPage';
import PipelinesResourceList from './PipelinesResourceList';
import { usePipelineTechPreviewBadge } from '../../utils/hooks';

type PipelinesPageProps = RouteComponentProps<{ ns: string }>;

export const PipelinesPage: React.FC<PipelinesPageProps> = (props) => {
  const { t } = useTranslation();
  const {
    match: {
      params: { ns: namespace },
    },
  } = props;
  const badge = usePipelineTechPreviewBadge(namespace);

  return namespace ? (
    <div>
      <PipelinesResourceList
        {...props}
        badge={badge}
        namespace={namespace}
        title={t('pipelines-plugin~Pipelines')}
      />
    </div>
  ) : (
    <CreateProjectListPage title={t('pipelines-plugin~Pipelines')} badge={badge}>
      {t('pipelines-plugin~Select a Project to view the list of Pipelines')}
    </CreateProjectListPage>
  );
};

export default withStartGuide(PipelinesPage);
