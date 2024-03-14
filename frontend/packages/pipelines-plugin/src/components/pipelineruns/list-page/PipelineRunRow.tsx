import * as React from 'react';
import { Tooltip } from '@patternfly/react-core';
import { ArchiveIcon } from '@patternfly/react-icons';
import { useTranslation } from 'react-i18next';
import { TableData, RowFunctionArgs } from '@console/internal/components/factory';
import { Timestamp, ResourceLink, truncateMiddle } from '@console/internal/components/utils';
import { referenceForModel } from '@console/internal/module/k8s';
import {
  DELETED_RESOURCE_IN_K8S_ANNOTATION,
  RESOURCE_LOADED_FROM_RESULTS_ANNOTATION,
} from '../../../const';
import * as SignedPipelinerunIcon from '../../../images/signed-badge.svg';
import { PipelineRunModel } from '../../../models';
import { PipelineRunKind, TaskRunKind } from '../../../types';
import { getPipelineRunKebabActions } from '../../../utils/pipeline-actions';
import {
  pipelineRunFilterReducer,
  pipelineRunTitleFilterReducer,
} from '../../../utils/pipeline-filter-reducer';
import { pipelineRunDuration } from '../../../utils/pipeline-utils';
import { chainsSignedAnnotation } from '../../pipelines/const';
import { getTaskRunsOfPipelineRun } from '../../taskruns/useTaskRuns';
import LinkedPipelineRunTaskStatus from '../status/LinkedPipelineRunTaskStatus';
import PipelineRunStatus from '../status/PipelineRunStatus';
import PipelineRunVulnerabilities from '../status/PipelineRunVulnerabilities';
import { ResourceKebabWithUserLabel } from '../triggered-by';
import { tableColumnClasses } from './pipelinerun-table';

const pipelinerunReference = referenceForModel(PipelineRunModel);

type PLRStatusProps = {
  obj: PipelineRunKind;
  taskRuns: TaskRunKind[];
  iconOnly?: boolean;
};

const PLRStatus: React.FC<PLRStatusProps> = ({ obj, taskRuns, iconOnly = false }) => {
  return (
    <PipelineRunStatus
      status={pipelineRunFilterReducer(obj)}
      title={pipelineRunTitleFilterReducer(obj)}
      pipelineRun={obj}
      taskRuns={taskRuns}
      iconOnly={iconOnly}
    />
  );
};

const PipelineRunRow: React.FC<RowFunctionArgs<PipelineRunKind>> = ({ obj, customData }) => {
  const { t } = useTranslation();
  const { operatorVersion, taskRuns } = customData;
  const PLRTaskRuns = getTaskRunsOfPipelineRun(taskRuns, obj?.metadata?.name);

  return (
    <>
      <TableData className={tableColumnClasses.name}>
        <ResourceLink
          kind={pipelinerunReference}
          name={truncateMiddle(obj.metadata.name, { length: 12 })}
          namespace={obj.metadata.namespace}
          data-test-id={obj.metadata.name}
          nameSuffix={
            <>
              {obj?.metadata?.annotations?.[chainsSignedAnnotation] === 'true' ? (
                <Tooltip content={t('pipelines-plugin~Signed')}>
                  <div className="opp-pipeline-run-list__signed-indicator">
                    <img src={SignedPipelinerunIcon} alt={t('pipelines-plugin~Signed')} />
                  </div>
                </Tooltip>
              ) : null}
              {obj?.metadata?.annotations?.[DELETED_RESOURCE_IN_K8S_ANNOTATION] === 'true' ||
              obj?.metadata?.annotations?.[RESOURCE_LOADED_FROM_RESULTS_ANNOTATION] === 'true' ? (
                <Tooltip content={t('pipelines-plugin~Archived in Tekton results')}>
                  <div className="opp-pipeline-run-list__results-indicator">
                    <ArchiveIcon />
                  </div>
                </Tooltip>
              ) : null}
            </>
          }
        />
      </TableData>
      <TableData className={tableColumnClasses.namespace} columnID="namespace">
        <ResourceLink kind="Namespace" name={obj.metadata.namespace} />
      </TableData>
      <TableData className={tableColumnClasses.vulnerabilities}>
        <PipelineRunVulnerabilities pipelineRun={obj} condensed />
      </TableData>
      <TableData className={tableColumnClasses.status}>
        <PLRStatus obj={obj} taskRuns={PLRTaskRuns} iconOnly />
      </TableData>
      <TableData className={tableColumnClasses.taskStatus}>
        <LinkedPipelineRunTaskStatus pipelineRun={obj} taskRuns={PLRTaskRuns} />
      </TableData>
      <TableData className={tableColumnClasses.started}>
        <div className="opp-pipeline-run-list__started-timestamp">
          <Timestamp timestamp={obj.status && obj.status.startTime} omitSuffix />{' '}
          <div>&nbsp; {t('pipelines-plugin~ago')}</div>
        </div>
      </TableData>
      <TableData className={tableColumnClasses.duration}>
        {pipelineRunDuration(obj, false)}
      </TableData>
      <TableData className={tableColumnClasses.actions}>
        <ResourceKebabWithUserLabel
          actions={getPipelineRunKebabActions(operatorVersion, taskRuns)}
          kind={pipelinerunReference}
          resource={obj}
        />
      </TableData>
    </>
  );
};

export default PipelineRunRow;
