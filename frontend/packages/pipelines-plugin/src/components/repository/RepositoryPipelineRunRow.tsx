import * as React from 'react';
import { Tooltip } from '@patternfly/react-core';
import { ArchiveIcon } from '@patternfly/react-icons';
import { useTranslation } from 'react-i18next';
import { TableData, RowFunctionArgs } from '@console/internal/components/factory';
import {
  ResourceLink,
  Timestamp,
  truncateMiddle,
  ExternalLink,
} from '@console/internal/components/utils';
import { referenceForModel } from '@console/internal/module/k8s';
import {
  DELETED_RESOURCE_IN_K8S_ANNOTATION,
  RESOURCE_LOADED_FROM_RESULTS_ANNOTATION,
} from '../../const';
import SignedPipelinerunIcon from '../../images/signed-badge.svg';
import { PipelineRunModel } from '../../models';
import { PipelineRunKind, TaskRunKind } from '../../types';
import { getPipelineRunKebabActions } from '../../utils/pipeline-actions';
import {
  pipelineRunFilterReducer,
  pipelineRunTitleFilterReducer,
} from '../../utils/pipeline-filter-reducer';
import { pipelineRunDuration } from '../../utils/pipeline-utils';
import LinkedPipelineRunTaskStatus from '../pipelineruns/status/LinkedPipelineRunTaskStatus';
import PipelineRunStatus from '../pipelineruns/status/PipelineRunStatus';
import PipelineRunVulnerabilities from '../pipelineruns/status/PipelineRunVulnerabilities';
import { ResourceKebabWithUserLabel } from '../pipelineruns/triggered-by';
import { chainsSignedAnnotation } from '../pipelines/const';
import { getTaskRunsOfPipelineRun } from '../taskruns/useTaskRuns';
import {
  RepoAnnotationFields,
  RepositoryAnnotations,
  RepositoryFields,
  RepositoryLabels,
} from './consts';
import { sanitizeBranchName } from './repository-utils';
import { tableColumnClasses } from './RepositoryPipelineRunHeader';

const pipelinerunReference = referenceForModel(PipelineRunModel);

type PLRStatusProps = {
  obj: PipelineRunKind;
  taskRuns: TaskRunKind[];
  taskRunsLoaded?: boolean;
};

const PLRStatus: React.FC<PLRStatusProps> = ({ obj, taskRuns, taskRunsLoaded }) => {
  return (
    <PipelineRunStatus
      status={pipelineRunFilterReducer(obj)}
      title={pipelineRunTitleFilterReducer(obj)}
      pipelineRun={obj}
      taskRuns={taskRuns}
      taskRunsLoaded={taskRunsLoaded}
    />
  );
};

const RepositoryPipelineRunRow: React.FC<RowFunctionArgs<PipelineRunKind>> = ({
  obj,
  customData,
}) => {
  const { t } = useTranslation();
  const plrLabels = obj.metadata.labels;
  const plrAnnotations = obj.metadata.annotations;
  const { operatorVersion, taskRuns, taskRunsLoaded } = customData;
  const PLRTaskRuns = getTaskRunsOfPipelineRun(taskRuns, obj?.metadata?.name);
  const branchName =
    plrLabels?.[RepositoryAnnotations[RepoAnnotationFields.BRANCH]] ||
    plrAnnotations?.[RepositoryAnnotations[RepoAnnotationFields.BRANCH]];
  return (
    <>
      <TableData className={tableColumnClasses[0]}>
        <ResourceLink
          kind={pipelinerunReference}
          name={obj.metadata.name}
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
      <TableData className={tableColumnClasses[1]} columnID="sha">
        <Tooltip
          data-test="tooltip-msg"
          content={
            <>
              {plrAnnotations?.[RepositoryAnnotations[RepoAnnotationFields.SHA_MESSAGE]] ??
                plrLabels?.[RepositoryLabels[RepositoryFields.SHA]]}
            </>
          }
        >
          <ExternalLink
            href={plrAnnotations?.[RepositoryAnnotations[RepoAnnotationFields.SHA_URL]]}
          >
            {truncateMiddle(plrLabels?.[RepositoryLabels[RepositoryFields.SHA]], {
              length: 7,
              truncateEnd: true,
              omission: '',
            })}
          </ExternalLink>
        </Tooltip>
      </TableData>
      <TableData className={tableColumnClasses[2]} columnID="namespace">
        <ResourceLink kind="Namespace" name={obj.metadata.namespace} />
      </TableData>
      <TableData className={tableColumnClasses[3]}>
        <PipelineRunVulnerabilities pipelineRun={obj} condensed />
      </TableData>
      <TableData className={tableColumnClasses[3]}>
        <PLRStatus obj={obj} taskRuns={PLRTaskRuns} taskRunsLoaded={taskRunsLoaded} />
      </TableData>
      <TableData className={tableColumnClasses[4]}>
        <LinkedPipelineRunTaskStatus
          pipelineRun={obj}
          taskRuns={PLRTaskRuns}
          taskRunsLoaded={taskRunsLoaded}
        />
      </TableData>
      <TableData className={tableColumnClasses[5]}>
        <Timestamp timestamp={obj.status && obj.status.startTime} />
      </TableData>
      <TableData className={tableColumnClasses[6]}>{pipelineRunDuration(obj)}</TableData>
      <TableData className={tableColumnClasses[7]}>{sanitizeBranchName(branchName)}</TableData>
      <TableData className={tableColumnClasses[8]}>
        <ResourceKebabWithUserLabel
          actions={getPipelineRunKebabActions(operatorVersion, PLRTaskRuns)}
          kind={pipelinerunReference}
          resource={obj}
        />
      </TableData>
    </>
  );
};

export default RepositoryPipelineRunRow;
