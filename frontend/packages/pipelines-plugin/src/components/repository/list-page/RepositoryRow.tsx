import * as React from 'react';
import { Link } from 'react-router-dom';
import { TableData, RowFunctionArgs } from '@console/internal/components/factory';
import {
  Kebab,
  LoadingInline,
  ResourceIcon,
  ResourceKebab,
  ResourceLink,
  resourcePath,
  Timestamp,
} from '@console/internal/components/utils';
import { useK8sWatchResource } from '@console/internal/components/utils/k8s-watch-hook';
import { referenceFor, referenceForModel } from '@console/internal/module/k8s';
import { getLatestRun } from '@console/pipelines-plugin/src/utils/pipeline-augment';
import { PipelineRunModel, RepositoryModel } from '../../../models';
import { PipelineRunKind } from '../../../types';
import {
  pipelineRunFilterReducer,
  pipelineRunTitleFilterReducer,
} from '../../../utils/pipeline-filter-reducer';
import { pipelineRunDuration } from '../../../utils/pipeline-utils';
import LinkedPipelineRunTaskStatus from '../../pipelineruns/status/LinkedPipelineRunTaskStatus';
import PipelineRunStatus from '../../pipelineruns/status/PipelineRunStatus';
import { RepositoryFields, RepositoryLabels } from '../consts';
import { RepositoryKind } from '../types';
import { repositoriesTableColumnClasses } from './RepositoryHeader';

const RepositoryRow: React.FC<RowFunctionArgs<RepositoryKind>> = ({ obj }) => {
  const {
    metadata: { name, namespace },
  } = obj;

  const [pipelineRun, loaded] = useK8sWatchResource<PipelineRunKind[]>({
    kind: referenceForModel(PipelineRunModel),
    namespace,
    isList: true,
    selector: { matchLabels: { [RepositoryLabels[RepositoryFields.REPOSITORY]]: name } },
  });

  const latestRun = loaded && getLatestRun(pipelineRun, 'creationTimestamp');

  const latestPLREventType =
    latestRun && latestRun?.metadata?.labels[RepositoryLabels[RepositoryFields.EVENT_TYPE]];
  return (
    <>
      <TableData className={repositoriesTableColumnClasses[0]}>
        <ResourceIcon kind={referenceForModel(RepositoryModel)} />
        <Link
          to={`${resourcePath(referenceForModel(RepositoryModel), name, namespace)}/Runs`}
          className="co-resource-item__resource-name"
          data-test-id={name}
        >
          {name}
        </Link>
      </TableData>
      <TableData className={repositoriesTableColumnClasses[1]} columnID="namespace">
        <ResourceLink kind="Namespace" name={obj.metadata.namespace} />
      </TableData>
      <TableData className={repositoriesTableColumnClasses[2]}>
        {latestPLREventType || '-'}
      </TableData>
      <TableData className={repositoriesTableColumnClasses[3]}>
        {loaded ? (
          latestRun ? (
            <ResourceLink
              kind={referenceForModel(PipelineRunModel)}
              name={latestRun?.metadata.name}
              namespace={namespace}
            />
          ) : (
            '-'
          )
        ) : (
          <LoadingInline />
        )}
      </TableData>
      <TableData className={repositoriesTableColumnClasses[4]}>
        {}
        {loaded ? (
          latestRun ? (
            <LinkedPipelineRunTaskStatus pipelineRun={latestRun} />
          ) : (
            '-'
          )
        ) : (
          <LoadingInline />
        )}
      </TableData>
      <TableData className={repositoriesTableColumnClasses[5]}>
        {loaded ? (
          <PipelineRunStatus
            status={pipelineRunFilterReducer(latestRun)}
            title={pipelineRunTitleFilterReducer(latestRun)}
            pipelineRun={latestRun}
          />
        ) : (
          <LoadingInline />
        )}
      </TableData>
      <TableData className={repositoriesTableColumnClasses[6]}>
        {loaded ? <Timestamp timestamp={latestRun?.status.startTime} /> : <LoadingInline />}
      </TableData>
      <TableData className={repositoriesTableColumnClasses[7]}>
        {loaded ? pipelineRunDuration(latestRun) : <LoadingInline />}
      </TableData>
      <TableData className={repositoriesTableColumnClasses[8]}>
        <ResourceKebab actions={Kebab.factory.common} kind={referenceFor(obj)} resource={obj} />
      </TableData>
    </>
  );
};

export default RepositoryRow;
