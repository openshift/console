import * as React from 'react';
import { useTranslation } from 'react-i18next';
import { ResourceLink, Timestamp } from '@console/internal/components/utils';
import { PodModel } from '@console/internal/models';
import { referenceForModel } from '@console/internal/module/k8s';
import { Status } from '@console/shared';
import { PipelineRunModel } from '../../models';
import { TaskRunKind } from '../../types';
import {
  taskRunFilterReducer,
  taskRunFilterTitleReducer,
} from '../../utils/pipeline-filter-reducer';
import { pipelineRunDuration } from '../../utils/pipeline-utils';
import RunDetailsErrorLog from '../pipelineruns/logs/RunDetailsErrorLog';
import { TektonResourceLabel } from '../pipelines/const';
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
          <Status
            status={taskRunFilterReducer(taskRun)}
            title={taskRunFilterTitleReducer(taskRun)}
          />
        </dd>
      </dl>
      {taskRun.metadata?.labels?.[TektonResourceLabel.pipelinerun] && (
        <dl data-test="pipelineRun">
          <dt>{t('pipelines-plugin~PipelineRun')}</dt>
          <dd>
            <ResourceLink
              kind={referenceForModel(PipelineRunModel)}
              name={taskRun.metadata.labels[TektonResourceLabel.pipelinerun]}
              namespace={taskRun.metadata.namespace}
            />
          </dd>
        </dl>
      )}
      <dl>
        <dt>{t('pipelines-plugin~Started')}</dt>
        <dd>
          <Timestamp timestamp={taskRun?.status?.startTime} />
        </dd>
      </dl>
      <dl>
        <dt>{t('pipelines-plugin~Duration')}</dt>
        <dd>{pipelineRunDuration(taskRun)}</dd>
      </dl>
      <RunDetailsErrorLog
        logDetails={getTRLogSnippet(taskRun)}
        namespace={taskRun.metadata?.namespace}
      />
      {taskRun?.status?.podName && (
        <dl data-test="pod">
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
