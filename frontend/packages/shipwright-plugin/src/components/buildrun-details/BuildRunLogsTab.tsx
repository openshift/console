import * as React from 'react';
import { useTranslation } from 'react-i18next';
import { useParams } from 'react-router-dom-v5-compat';
import { useK8sWatchResource } from '@console/dynamic-plugin-sdk/src/utils/k8s/hooks/useK8sWatchResource';
import { getGroupVersionKindForModel } from '@console/dynamic-plugin-sdk/src/utils/k8s/k8s-ref';
import { LoadingBox } from '@console/internal/components/utils';
import { StatusBox } from '@console/internal/components/utils/status-box';
import TaskRunLog from '@console/pipelines-plugin/src/components/taskruns/TaskRunLog';
import { TaskRunModel } from '@console/pipelines-plugin/src/models/pipelines';
import { TaskRunKind } from '@console/pipelines-plugin/src/types';
import { BuildRun } from '../../types';
import { isV1Alpha1Resource } from '../../utils';

type BuildRunLogsTabProps = {
  obj: BuildRun;
};

const BuildRunLogsTab: React.FC<BuildRunLogsTabProps> = ({ obj: buildRun }) => {
  const { t } = useTranslation();
  const { ns: namespace } = useParams();

  const taskRunRef = isV1Alpha1Resource(buildRun)
    ? buildRun.status?.latestTaskRunRef
    : buildRun.status?.taskRunName;
  const [taskRun, taskRunLoaded, taskRunLoadError] = useK8sWatchResource<TaskRunKind>(
    taskRunRef
      ? {
          groupVersionKind: getGroupVersionKindForModel(TaskRunModel),
          namespace,
          name: taskRunRef,
          isList: false,
        }
      : null,
  );

  if (!taskRunRef) {
    return (
      <StatusBox
        label={t('shipwright-plugin~Logs')}
        loadError={
          new Error(t("shipwright-plugin~BuildRun status doesn't contain a TaskRun reference yet."))
        }
      />
    );
  }
  if (!taskRun && taskRunLoadError) {
    return <StatusBox label={t('shipwright-plugin~Logs')} loadError={taskRunLoadError} />;
  }
  if (!taskRun && !taskRunLoaded) {
    return <LoadingBox />;
  }

  return <TaskRunLog obj={taskRun} />;
};

export default BuildRunLogsTab;
