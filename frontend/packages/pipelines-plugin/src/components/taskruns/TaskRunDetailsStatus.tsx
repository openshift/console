import * as React from 'react';
import { useTranslation } from 'react-i18next';
import { ResourceLink } from '@console/internal/components/utils';
import { PodModel } from '@console/internal/models';
import { Status } from '@console/shared';
import { TaskRunKind } from '../../types';
import { taskRunFilterReducer } from '../../utils/pipeline-filter-reducer';
import RunDetailsErrorLog from '../pipelineruns/logs/RunDetailsErrorLog';
import WorkspaceResourceLinkList from '../shared/workspaces/WorkspaceResourceLinkList';
import { getTRLogSnippet } from './logs/taskRunLogSnippet';

export interface TaskRunDetailsStatusProps {
  taskRun: TaskRunKind;
}

const TaskRunDetailsStatus = ({ taskRun }) => {
  const { t } = useTranslation();

  return (
    <>
      <dl>
        <dt>{t('pipelines-plugin~Status')}</dt>
        <dd>
          <Status status={taskRunFilterReducer(taskRun)} title={taskRunFilterReducer(taskRun)} />
        </dd>
      </dl>
      <RunDetailsErrorLog
        logDetails={getTRLogSnippet(taskRun)}
        namespace={taskRun.metadata?.namespace}
      />
      {taskRun?.status?.podName && (
        <dl>
          <dt>{t('pipelines-plugin~Pod')}</dt>
          <dd>
            <ResourceLink
              kind={PodModel.kind}
              name={taskRun.status.podName}
              namespace={taskRun.metadata.namespace}
            />
          </dd>
        </dl>
      )}
      <WorkspaceResourceLinkList
        workspaces={taskRun.spec.workspaces}
        namespace={taskRun.metadata.namespace}
        ownerResourceName={taskRun.metadata.name}
        ownerResourceKind={taskRun.kind}
      />
    </>
  );
};

export default TaskRunDetailsStatus;
