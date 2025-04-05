import * as React from 'react';
import { useTranslation } from 'react-i18next';
import { DocumentTitle } from '@console/shared/src/components/document-title/DocumentTitle';
import { TaskRunKind } from '../../../types';
import TaskRunsListPage from '../../taskruns/list-page/TaskRunsListPage';

interface TaskRunsProps {
  obj: TaskRunKind;
}

const TaskRuns: React.FC<TaskRunsProps> = ({ obj }) => {
  const { t } = useTranslation();
  return (
    <>
      <DocumentTitle>{t('pipelines-plugin~TaskRuns')}</DocumentTitle>
      <TaskRunsListPage
        showTitle={false}
        selector={{
          matchLabels: {
            'tekton.dev/pipelineRun': obj.metadata.name,
            'tekton.dev/pipelineRunUID': obj.metadata?.uid,
          },
        }}
        showPipelineColumn={false}
        namespace={obj.metadata.namespace}
        hideBadge
      />
    </>
  );
};

export default TaskRuns;
