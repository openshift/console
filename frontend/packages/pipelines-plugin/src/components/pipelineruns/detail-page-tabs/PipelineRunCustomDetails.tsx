import * as React from 'react';
import { useTranslation } from 'react-i18next';
import { Timestamp } from '@console/internal/components/utils';
import { Status } from '@console/shared';
import { PipelineRunKind } from '../../../types';
import {
  pipelineRunFilterReducer,
  pipelineRunTitleFilterReducer,
} from '../../../utils/pipeline-filter-reducer';
import { pipelineRunDuration } from '../../../utils/pipeline-utils';
import {
  convertBackingPipelineToPipelineResourceRefProps,
  getPipelineResourceLinks,
} from '../../pipelines/detail-page-tabs';
import DynamicResourceLinkList from '../../pipelines/resource-overview/DynamicResourceLinkList';
import RepositoryLinkList from '../../repository/RepositoryLinkList';
import PipelineResourceRef from '../../shared/common/PipelineResourceRef';
import WorkspaceResourceLinkList from '../../shared/workspaces/WorkspaceResourceLinkList';
import { useTaskRuns } from '../../taskruns/useTaskRuns';
import { getPLRLogSnippet } from '../logs/pipelineRunLogSnippet';
import RunDetailsErrorLog from '../logs/RunDetailsErrorLog';
import TriggeredBySection from './TriggeredBySection';

export type PipelineRunCustomDetailsProps = {
  pipelineRun: PipelineRunKind;
};

const PipelineRunCustomDetails: React.FC<PipelineRunCustomDetailsProps> = ({ pipelineRun }) => {
  const { t } = useTranslation();
  const [taskRuns, taskRunsLoaded] = useTaskRuns(
    pipelineRun?.metadata?.namespace,
    pipelineRun?.metadata?.name,
  );
  const pipelineResourceLinks = getPipelineResourceLinks(
    pipelineRun.status?.pipelineSpec?.resources,
    pipelineRun.spec.resources,
  );

  return (
    <>
      <dl>
        <dt>{t('pipelines-plugin~Status')}</dt>
        <dd>
          <Status
            status={pipelineRunFilterReducer(pipelineRun)}
            title={pipelineRunTitleFilterReducer(pipelineRun)}
          />
        </dd>
      </dl>
      {taskRunsLoaded && (
        <RunDetailsErrorLog
          logDetails={getPLRLogSnippet(pipelineRun, taskRuns)}
          namespace={pipelineRun.metadata.namespace}
        />
      )}
      <dl>
        <dt>{t('pipelines-plugin~Pipeline')}</dt>
        <dd>
          <PipelineResourceRef {...convertBackingPipelineToPipelineResourceRefProps(pipelineRun)} />
        </dd>
      </dl>
      <dl>
        <dt>{t('pipelines-plugin~Start time')}</dt>
        <dd>
          <Timestamp timestamp={pipelineRun?.status?.startTime} />
        </dd>
      </dl>
      <dl>
        <dt>{t('pipelines-plugin~Completion time')}</dt>
        <dd>
          <Timestamp timestamp={pipelineRun?.status?.completionTime} />
        </dd>
      </dl>
      <dl>
        <dt>{t('pipelines-plugin~Duration')}</dt>
        <dd>{pipelineRunDuration(pipelineRun)}</dd>
      </dl>
      <TriggeredBySection pipelineRun={pipelineRun} />
      <DynamicResourceLinkList
        links={pipelineResourceLinks}
        title={t('pipelines-plugin~PipelineResources')}
        namespace={pipelineRun.metadata.namespace}
      />
      <RepositoryLinkList pipelineRun={pipelineRun} />
      <WorkspaceResourceLinkList
        workspaces={pipelineRun.spec.workspaces}
        namespace={pipelineRun.metadata.namespace}
        ownerResourceName={pipelineRun.metadata.name}
      />
    </>
  );
};

export default PipelineRunCustomDetails;
