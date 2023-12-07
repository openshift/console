import * as React from 'react';
import { ClipboardCopy } from '@patternfly/react-core';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import { ExternalLink, Timestamp } from '@console/internal/components/utils';
import { referenceForModel } from '@console/internal/module/k8s';
import { Status } from '@console/shared';
import { TaskRunModel } from '../../../models';
import { PipelineRunKind } from '../../../types';
import {
  pipelineRunFilterReducer,
  pipelineRunTitleFilterReducer,
} from '../../../utils/pipeline-filter-reducer';
import {
  getImageUrl,
  getSbomLink,
  getSbomTaskRun,
  hasExternalLink,
  pipelineRunDuration,
} from '../../../utils/pipeline-utils';
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
import PipelineRunVulnerabilities from '../status/PipelineRunVulnerabilities';
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

  const sbomTaskRun = taskRunsLoaded ? getSbomTaskRun(taskRuns) : null;
  const buildImage = getImageUrl(pipelineRun);
  const linkToSbom = getSbomLink(sbomTaskRun);
  const isExternalLink = hasExternalLink(sbomTaskRun);
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
        <dt>{t('pipelines-plugin~Vulnerabilities')}</dt>
        <dd>
          <PipelineRunVulnerabilities pipelineRun={pipelineRun} />
        </dd>
      </dl>
      <dl>
        <dt>{t('pipelines-plugin~Pipeline')}</dt>
        <dd>
          <PipelineResourceRef {...convertBackingPipelineToPipelineResourceRefProps(pipelineRun)} />
        </dd>
        {buildImage && sbomTaskRun && (
          <>
            <dt data-test="download-sbom">{t('pipelines-plugin~Download SBOM')}</dt>
            <dd>
              <ClipboardCopy
                isReadOnly
                hoverTip={t('pipelines-plugin~Copy')}
                clickTip={t('pipelines-plugin~Copied')}
              >
                {`cosign download sbom ${buildImage}`}
              </ClipboardCopy>
              <ExternalLink href="https://docs.sigstore.dev/cosign/installation">
                {t('pipelines-plugin~Install Cosign')}
              </ExternalLink>
            </dd>
          </>
        )}
        {sbomTaskRun && (
          <>
            <dt data-test="view-sbom">{t('pipelines-plugin~SBOM')}</dt>
            <dd>
              {isExternalLink &&
              linkToSbom &&
              (linkToSbom.startsWith('http://') || linkToSbom.startsWith('https://')) ? (
                <ExternalLink href={linkToSbom}>{t('pipelines-plugin~View SBOM')}</ExternalLink>
              ) : (
                <Link
                  to={`/k8s/ns/${sbomTaskRun.metadata.namespace}/${referenceForModel(
                    TaskRunModel,
                  )}/${sbomTaskRun.metadata.name}/logs`}
                >
                  {t('pipelines-plugin~View SBOM')}
                </Link>
              )}
            </dd>
          </>
        )}
      </dl>

      <dl>
        <dt>{t('pipelines-plugin~Start time')}</dt>
        <dd>
          <Timestamp timestamp={pipelineRun?.status?.startTime} />
        </dd>
        <dt>{t('pipelines-plugin~Completion time')}</dt>
        <dd>
          <Timestamp timestamp={pipelineRun?.status?.completionTime} />
        </dd>
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
