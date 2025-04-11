import {
  DescriptionList,
  DescriptionListDescription,
  DescriptionListGroup,
  DescriptionListTerm,
} from '@patternfly/react-core';
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
    <DescriptionList>
      <DescriptionListGroup>
        <DescriptionListTerm>{t('pipelines-plugin~Status')}</DescriptionListTerm>
        <DescriptionListDescription>
          <Status
            status={taskRunFilterReducer(taskRun)}
            title={taskRunFilterTitleReducer(taskRun)}
          />
        </DescriptionListDescription>
      </DescriptionListGroup>
      {taskRun.metadata?.labels?.[TektonResourceLabel.pipelinerun] && (
        <DescriptionListGroup data-test="pipelineRun">
          <DescriptionListTerm>{t('pipelines-plugin~PipelineRun')}</DescriptionListTerm>
          <DescriptionListDescription>
            <ResourceLink
              kind={referenceForModel(PipelineRunModel)}
              name={taskRun.metadata.labels[TektonResourceLabel.pipelinerun]}
              namespace={taskRun.metadata.namespace}
            />
          </DescriptionListDescription>
        </DescriptionListGroup>
      )}
      <DescriptionListGroup>
        <DescriptionListTerm>{t('pipelines-plugin~Started')}</DescriptionListTerm>
        <DescriptionListDescription>
          <Timestamp timestamp={taskRun?.status?.startTime} />
        </DescriptionListDescription>
      </DescriptionListGroup>
      <DescriptionListGroup>
        <DescriptionListTerm>{t('pipelines-plugin~Duration')}</DescriptionListTerm>
        <DescriptionListDescription>{pipelineRunDuration(taskRun)}</DescriptionListDescription>
      </DescriptionListGroup>
      <RunDetailsErrorLog
        logDetails={getTRLogSnippet(taskRun)}
        namespace={taskRun.metadata?.namespace}
      />
      {taskRun?.status?.podName && (
        <DescriptionListGroup data-test="pod">
          <DescriptionListTerm>{t('pipelines-plugin~Pod')}</DescriptionListTerm>
          <DescriptionListDescription>
            <ResourceLink
              kind={PodModel.kind}
              name={taskRun.status.podName}
              namespace={taskRun.metadata.namespace}
            />
          </DescriptionListDescription>
        </DescriptionListGroup>
      )}
      <WorkspaceResourceLinkList
        workspaces={taskRun.spec.workspaces}
        namespace={taskRun.metadata.namespace}
        ownerResourceName={taskRun.metadata.name}
        ownerResourceKind={taskRun.kind}
      />
    </DescriptionList>
  );
};

export default TaskRunDetailsStatus;
