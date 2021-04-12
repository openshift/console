import * as React from 'react';
import { useTranslation } from 'react-i18next';
import { Status } from '@console/shared';
import { PipelineRunKind } from '../../../types';
import { pipelineRunFilterReducer } from '../../../utils/pipeline-filter-reducer';
import DynamicResourceLinkList from '../../pipelines/resource-overview/DynamicResourceLinkList';
import {
  convertBackingPipelineToPipelineResourceRefProps,
  getPipelineResourceLinks,
} from '../../pipelines/detail-page-tabs';
import WorkspaceResourceLinkList from '../../shared/workspaces/WorkspaceResourceLinkList';
import RunDetailsErrorLog from '../logs/RunDetailsErrorLog';
import TriggeredBySection from './TriggeredBySection';
import { getPLRLogSnippet } from '../logs/pipelineRunLogSnippet';
import PipelineResourceRef from '../../shared/common/PipelineResourceRef';

export type PipelineRunCustomDetailsProps = {
  pipelineRun: PipelineRunKind;
};

const PipelineRunCustomDetails: React.FC<PipelineRunCustomDetailsProps> = ({ pipelineRun }) => {
  const { t } = useTranslation();
  const pipelineResourceLinks = getPipelineResourceLinks(
    pipelineRun.status?.pipelineSpec?.resources,
    pipelineRun.spec.resources,
    t,
  );

  return (
    <>
      <dl>
        <dt>{t('pipelines-plugin~Status')}</dt>
        <dd>
          <Status
            status={pipelineRunFilterReducer(pipelineRun)}
            title={pipelineRunFilterReducer(pipelineRun, t)}
          />
        </dd>
      </dl>
      <RunDetailsErrorLog
        logDetails={getPLRLogSnippet(pipelineRun, t)}
        namespace={pipelineRun.metadata.namespace}
      />
      <dl>
        <dt>{t('pipelines-plugin~Pipeline')}</dt>
        <dd>
          <PipelineResourceRef
            {...convertBackingPipelineToPipelineResourceRefProps(pipelineRun, t)}
          />
        </dd>
      </dl>
      <TriggeredBySection pipelineRun={pipelineRun} />
      <DynamicResourceLinkList
        links={pipelineResourceLinks}
        title={t('pipelines-plugin~Pipeline Resources')}
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
