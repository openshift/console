import * as React from 'react';
import {
  ClipboardCopy,
  DescriptionList,
  DescriptionListDescription,
  DescriptionListGroup,
  DescriptionListTerm,
} from '@patternfly/react-core';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import { referenceForModel } from '@console/internal/module/k8s';
import { Status } from '@console/shared';
import { Timestamp } from '@console/shared/src/components/datetime/Timestamp';
import { ExternalLink } from '@console/shared/src/components/links/ExternalLink';
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
      <DescriptionList>
        <DescriptionListGroup>
          <DescriptionListTerm>{t('pipelines-plugin~Status')}</DescriptionListTerm>
          <DescriptionListDescription>
            <Status
              status={pipelineRunFilterReducer(pipelineRun)}
              title={pipelineRunTitleFilterReducer(pipelineRun)}
            />
          </DescriptionListDescription>
        </DescriptionListGroup>
        {taskRunsLoaded && (
          <RunDetailsErrorLog
            logDetails={getPLRLogSnippet(pipelineRun, taskRuns)}
            namespace={pipelineRun.metadata.namespace}
          />
        )}
        <DescriptionListGroup>
          <DescriptionListTerm>{t('pipelines-plugin~Vulnerabilities')}</DescriptionListTerm>
          <DescriptionListDescription>
            <PipelineRunVulnerabilities pipelineRun={pipelineRun} />
          </DescriptionListDescription>
        </DescriptionListGroup>

        <DescriptionListGroup>
          <DescriptionListTerm>{t('pipelines-plugin~Pipeline')}</DescriptionListTerm>
          <DescriptionListDescription>
            <PipelineResourceRef
              {...convertBackingPipelineToPipelineResourceRefProps(pipelineRun)}
            />
          </DescriptionListDescription>
        </DescriptionListGroup>
        {buildImage && sbomTaskRun && (
          <DescriptionListGroup>
            <DescriptionListTerm data-test="download-sbom">
              {t('pipelines-plugin~Download SBOM')}
            </DescriptionListTerm>
            <DescriptionListDescription>
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
            </DescriptionListDescription>
          </DescriptionListGroup>
        )}
        {sbomTaskRun && (
          <DescriptionListGroup>
            <DescriptionListTerm data-test="view-sbom">
              {t('pipelines-plugin~SBOM')}
            </DescriptionListTerm>
            <DescriptionListDescription>
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
            </DescriptionListDescription>
          </DescriptionListGroup>
        )}

        <DescriptionListGroup>
          <DescriptionListTerm>{t('pipelines-plugin~Start time')}</DescriptionListTerm>
          <DescriptionListDescription>
            <Timestamp timestamp={pipelineRun?.status?.startTime} />
          </DescriptionListDescription>
        </DescriptionListGroup>
        <DescriptionListGroup>
          <DescriptionListTerm>{t('pipelines-plugin~Completion time')}</DescriptionListTerm>
          <DescriptionListDescription>
            <Timestamp timestamp={pipelineRun?.status?.completionTime} />
          </DescriptionListDescription>
        </DescriptionListGroup>
        <DescriptionListGroup>
          <DescriptionListTerm>{t('pipelines-plugin~Duration')}</DescriptionListTerm>
          <DescriptionListDescription>
            {pipelineRunDuration(pipelineRun)}
          </DescriptionListDescription>
        </DescriptionListGroup>
      </DescriptionList>
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
