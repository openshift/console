import * as React from 'react';
import { useTranslation } from 'react-i18next';
import { Status } from '@console/shared';
import { PipelineRunKind } from '../../../types';
import { pipelineRunFilterReducer } from '../../../utils/pipeline-filter-reducer';
import {
  convertBackingPipelineToPipelineResourceRefProps,
  getPipelineResourceLinks,
} from '../../pipelines/detail-page-tabs';
import DynamicResourceLinkList from '../../pipelines/resource-overview/DynamicResourceLinkList';
import PipelineResourceRef from '../../shared/common/PipelineResourceRef';
import WorkspaceResourceLinkList from '../../shared/workspaces/WorkspaceResourceLinkList';
import { getPLRLogSnippet } from '../logs/pipelineRunLogSnippet';
import RunDetailsErrorLog from '../logs/RunDetailsErrorLog';
import TriggeredBySection from './TriggeredBySection';

export type PipelineRunCustomDetailsProps = {
  pipelineRun: PipelineRunKind;
};

const PipelineRunCustomDetails: React.FC<PipelineRunCustomDetailsProps> = ({ pipelineRun }) => {
  const { t } = useTranslation();
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
            title={pipelineRunFilterReducer(pipelineRun)}
          />
        </dd>
      </dl>
      <RunDetailsErrorLog
        logDetails={getPLRLogSnippet(pipelineRun)}
        namespace={pipelineRun.metadata.namespace}
      />
      <dl>
        <dt>{t('pipelines-plugin~Pipeline')}</dt>
        <dd>
          <PipelineResourceRef {...convertBackingPipelineToPipelineResourceRefProps(pipelineRun)} />
        </dd>
      </dl>
      <TriggeredBySection pipelineRun={pipelineRun} />
      <DynamicResourceLinkList
        links={pipelineResourceLinks}
        title={t('pipelines-plugin~PipelineResources')}
        namespace={pipelineRun.metadata.namespace}
      />
      <WorkspaceResourceLinkList
        workspaces={pipelineRun.spec.workspaces}
        namespace={pipelineRun.metadata.namespace}
        ownerResourceName={pipelineRun.metadata.name}
      />
    </>
  );
};

export default PipelineRunCustomDetails;
