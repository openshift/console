import * as React from 'react';
import { Tooltip } from '@patternfly/react-core';
import { ArchiveIcon } from '@patternfly/react-icons';
import { useTranslation } from 'react-i18next';
import { SemVer } from 'semver';
import { TableData, RowFunctionArgs } from '@console/internal/components/factory';
import { Timestamp, ResourceLink } from '@console/internal/components/utils';
import { referenceForModel } from '@console/internal/module/k8s';
import {
  DELETED_RESOURCE_IN_K8S_ANNOTATION,
  RESOURCE_LOADED_FROM_RESULTS_ANNOTATION,
} from '../../../const';
import SignedPipelinerunIcon from '../../../images/signed-badge.svg';
import { PipelineRunModel } from '../../../models';
import { ComputedStatus, PipelineRunKind, TaskRunKind } from '../../../types';
import { getPipelineRunKebabActions } from '../../../utils/pipeline-actions';
import { TaskStatus } from '../../../utils/pipeline-augment';
import {
  pipelineRunFilterReducer,
  pipelineRunStatus,
  pipelineRunTitleFilterReducer,
} from '../../../utils/pipeline-filter-reducer';
import { getPipelineRunStatus, pipelineRunDuration } from '../../../utils/pipeline-utils';
import { chainsSignedAnnotation } from '../../pipelines/const';
import { useTaskRuns } from '../hooks/useTaskRuns';
import LinkedPipelineRunTaskStatus from '../status/LinkedPipelineRunTaskStatus';
import PipelineRunStatusContent from '../status/PipelineRunStatusContent';
import PipelineRunVulnerabilities from '../status/PipelineRunVulnerabilities';
import { ResourceKebabWithUserLabel } from '../triggered-by';
import { tableColumnClasses } from './pipelinerun-table';

const pipelinerunReference = referenceForModel(PipelineRunModel);

type PLRStatusProps = {
  obj: PipelineRunKind;
};

type PipelineRunRowWithoutTaskRunsProps = {
  obj: PipelineRunKind;
  operatorVersion: SemVer;
  taskRunStatusObj: TaskStatus;
};

type PipelineRunRowWithTaskRunsProps = {
  obj: PipelineRunKind;
  operatorVersion: SemVer;
};

const TASKRUNSFORPLRCACHE: { [key: string]: TaskRunKind[] } = {};
const InFlightStoreForTaskRunsForPLR: { [key: string]: boolean } = {};

const PLRStatus: React.FC<PLRStatusProps> = React.memo(({ obj }) => {
  return (
    <PipelineRunStatusContent
      status={pipelineRunFilterReducer(obj)}
      title={pipelineRunTitleFilterReducer(obj)}
      pipelineRun={obj}
    />
  );
});

const PipelineRunRowTable = ({
  obj,
  PLRTaskRuns,
  taskRunsLoaded,
  taskRunStatusObj,
  operatorVersion,
}) => {
  const { t } = useTranslation();

  return (
    <>
      <TableData className={tableColumnClasses.name}>
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
      <TableData className={tableColumnClasses.namespace} columnID="namespace">
        <ResourceLink kind="Namespace" name={obj.metadata.namespace} />
      </TableData>
      <TableData className={tableColumnClasses.vulnerabilities}>
        <PipelineRunVulnerabilities pipelineRun={obj} condensed />
      </TableData>
      <TableData className={tableColumnClasses.status}>
        <PLRStatus obj={obj} />
      </TableData>
      <TableData className={tableColumnClasses.taskStatus}>
        <LinkedPipelineRunTaskStatus
          pipelineRun={obj}
          taskRuns={PLRTaskRuns}
          taskRunsLoaded={taskRunsLoaded}
          taskRunStatusObj={taskRunStatusObj}
        />
      </TableData>
      <TableData className={tableColumnClasses.started}>
        <Timestamp timestamp={obj.status && obj.status.startTime} />
      </TableData>
      <TableData className={tableColumnClasses.duration}>{pipelineRunDuration(obj)}</TableData>
      <TableData className={tableColumnClasses.actions}>
        <ResourceKebabWithUserLabel
          actions={getPipelineRunKebabActions(
            operatorVersion,
            PLRTaskRuns,
            undefined,
            taskRunStatusObj,
          )}
          kind={pipelinerunReference}
          resource={obj}
        />
      </TableData>
    </>
  );
};

const PipelineRunRowWithoutTaskRuns: React.FC<PipelineRunRowWithoutTaskRunsProps> = React.memo(
  ({ obj, operatorVersion, taskRunStatusObj }) => {
    return (
      <PipelineRunRowTable
        obj={obj}
        PLRTaskRuns={[]}
        taskRunsLoaded
        operatorVersion={operatorVersion}
        taskRunStatusObj={taskRunStatusObj}
      />
    );
  },
);

const PipelineRunRowWithTaskRunsFetch: React.FC<PipelineRunRowWithTaskRunsProps> = React.memo(
  ({ obj, operatorVersion }) => {
    const cacheKey = `${obj.metadata.namespace}-${obj.metadata.name}`;
    const [PLRTaskRuns, taskRunsLoaded] = useTaskRuns(
      obj.metadata.namespace,
      obj.metadata.name,
      undefined,
      `${obj.metadata.namespace}-${obj.metadata.name}`,
    );
    InFlightStoreForTaskRunsForPLR[cacheKey] = false;
    if (taskRunsLoaded) {
      TASKRUNSFORPLRCACHE[cacheKey] = PLRTaskRuns;
    }
    return (
      <PipelineRunRowTable
        obj={obj}
        PLRTaskRuns={PLRTaskRuns}
        taskRunsLoaded={taskRunsLoaded}
        operatorVersion={operatorVersion}
        taskRunStatusObj={undefined}
      />
    );
  },
);

const PipelineRunRowWithTaskRuns: React.FC<PipelineRunRowWithTaskRunsProps> = React.memo(
  ({ obj, operatorVersion }) => {
    let PLRTaskRuns: TaskRunKind[];
    let taskRunsLoaded: boolean;
    const cacheKey = `${obj.metadata.namespace}-${obj.metadata.name}`;
    const result = TASKRUNSFORPLRCACHE[cacheKey];
    if (result) {
      PLRTaskRuns = result;
      taskRunsLoaded = true;
    } else if (InFlightStoreForTaskRunsForPLR[cacheKey]) {
      PLRTaskRuns = [];
      taskRunsLoaded = true;
      InFlightStoreForTaskRunsForPLR[cacheKey] = true;
    } else {
      return <PipelineRunRowWithTaskRunsFetch obj={obj} operatorVersion={operatorVersion} />;
    }
    return (
      <PipelineRunRowTable
        obj={obj}
        PLRTaskRuns={PLRTaskRuns}
        taskRunsLoaded={taskRunsLoaded}
        operatorVersion={operatorVersion}
        taskRunStatusObj={undefined}
      />
    );
  },
);

const PipelineRunRow: React.FC<RowFunctionArgs<PipelineRunKind>> = ({ obj, customData }) => {
  const { operatorVersion } = customData;
  const plrStatus = pipelineRunStatus(obj);
  if (plrStatus === ComputedStatus.Cancelled && (obj?.status?.childReferences ?? []).length > 0) {
    return <PipelineRunRowWithTaskRuns obj={obj} operatorVersion={operatorVersion} />;
  }
  const taskRunStatusObj = getPipelineRunStatus(obj);
  return (
    <PipelineRunRowWithoutTaskRuns
      obj={obj}
      operatorVersion={operatorVersion}
      taskRunStatusObj={taskRunStatusObj}
    />
  );
};

export default PipelineRunRow;
