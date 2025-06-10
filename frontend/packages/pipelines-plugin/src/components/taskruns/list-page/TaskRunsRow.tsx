import * as React from 'react';
import { Tooltip } from '@patternfly/react-core';
import { ArchiveIcon } from '@patternfly/react-icons';
import { useTranslation } from 'react-i18next';
import { TableData, RowFunctionArgs } from '@console/internal/components/factory';
import { ResourceLink } from '@console/internal/components/utils';
import { referenceForModel } from '@console/internal/module/k8s';
import { Timestamp } from '@console/shared/src/components/datetime/Timestamp';
import {
  DELETED_RESOURCE_IN_K8S_ANNOTATION,
  RESOURCE_LOADED_FROM_RESULTS_ANNOTATION,
} from '../../../const';
import { TaskRunModel, PipelineModel } from '../../../models';
import { TaskRunKind } from '../../../types';
import { getTaskRunKebabActions } from '../../../utils/pipeline-actions';
import { getModelReferenceFromTaskKind } from '../../../utils/pipeline-augment';
import { taskRunFilterReducer } from '../../../utils/pipeline-filter-reducer';
import { pipelineRunDuration } from '../../../utils/pipeline-utils';
import { ResourceKebab } from '../../pipelineruns/triggered-by/ResourceKebab';
import { TektonResourceLabel } from '../../pipelines/const';
import TaskRunStatus from '../status/TaskRunStatus';
import { tableColumnClasses } from './taskruns-table';

import './TaskRunsRow.scss';

const taskRunsReference = referenceForModel(TaskRunModel);
const pipelineReference = referenceForModel(PipelineModel);

const TaskRunsRow: React.FC<RowFunctionArgs<TaskRunKind>> = ({ obj, customData }) => {
  const { t } = useTranslation();
  const { selectedColumns } = customData;
  return (
    <>
      <TableData className={tableColumnClasses[0]}>
        <ResourceLink
          kind={taskRunsReference}
          name={obj.metadata.name}
          namespace={obj.metadata.namespace}
          data-test-id={obj.metadata.name}
          nameSuffix={
            <>
              {obj?.metadata?.annotations?.[DELETED_RESOURCE_IN_K8S_ANNOTATION] === 'true' ||
              obj?.metadata?.annotations?.[RESOURCE_LOADED_FROM_RESULTS_ANNOTATION] === 'true' ? (
                <Tooltip content={t('pipelines-plugin~Archived in Tekton results')}>
                  <div className="opp-task-run-list__results-indicator">
                    <ArchiveIcon />
                  </div>
                </Tooltip>
              ) : null}
            </>
          }
        />
      </TableData>
      {selectedColumns?.has('namespace') && (
        <TableData className={tableColumnClasses[1]} columnID="namespace">
          <ResourceLink kind="Namespace" name={obj.metadata.namespace} />
        </TableData>
      )}
      {customData?.showPipelineColumn && selectedColumns?.has('pipeline') && (
        <TableData className={tableColumnClasses[2]}>
          {obj.metadata.labels[TektonResourceLabel.pipeline] ? (
            <ResourceLink
              kind={pipelineReference}
              name={obj.metadata.labels[TektonResourceLabel.pipeline]}
              namespace={obj.metadata.namespace}
            />
          ) : (
            '-'
          )}
        </TableData>
      )}
      {selectedColumns?.has('task') && (
        <TableData className={tableColumnClasses[3]}>
          {obj.spec.taskRef?.name ? (
            <ResourceLink
              kind={getModelReferenceFromTaskKind(obj.spec.taskRef?.kind)}
              displayName={obj.metadata.labels[TektonResourceLabel.pipelineTask]}
              name={obj.spec.taskRef.name}
              namespace={obj.metadata.namespace}
            />
          ) : (
            '-'
          )}
        </TableData>
      )}
      {selectedColumns?.has('pod') && (
        <TableData className={tableColumnClasses[4]}>
          {obj.status?.podName ? (
            <ResourceLink kind="Pod" name={obj.status.podName} namespace={obj.metadata.namespace} />
          ) : (
            '-'
          )}
        </TableData>
      )}
      {selectedColumns?.has('status') && (
        <TableData className={tableColumnClasses[5]}>
          <TaskRunStatus status={taskRunFilterReducer(obj)} taskRun={obj} />
        </TableData>
      )}
      {selectedColumns?.has('started') && (
        <TableData className={tableColumnClasses[6]}>
          <Timestamp timestamp={obj?.status?.startTime} />
        </TableData>
      )}
      {selectedColumns?.has('duration') && (
        <TableData className={tableColumnClasses[7]}>{pipelineRunDuration(obj)}</TableData>
      )}
      <TableData className={tableColumnClasses[8]}>
        <ResourceKebab actions={getTaskRunKebabActions()} kind={taskRunsReference} resource={obj} />
      </TableData>
    </>
  );
};

export default TaskRunsRow;
