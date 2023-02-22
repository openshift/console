import * as React from 'react';
import Helmet from 'react-helmet';
import { useTranslation } from 'react-i18next';
import { TaskRunKind } from '../../../types';
import TaskRunsListPage from '../../taskruns/list-page/TaskRunsListPage';

interface TaskRunsProps {
  obj: TaskRunKind;
}

const TaskRuns: React.FC<TaskRunsProps> = ({ obj }) => {
  const { t } = useTranslation();
  return (
    <>
      <Helmet>
        <title>{t('pipelines-plugin~TaskRuns')}</title>
      </Helmet>
      <TaskRunsListPage
        showTitle={false}
        selector={{ matchLabels: { 'tekton.dev/pipelineRun': obj.metadata.name } }}
        showPipelineColumn={false}
        namespace={obj.metadata.namespace}
        hideBadge
      />
    </>
  );
};

export default TaskRuns;
