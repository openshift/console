import * as React from 'react';
import { useTranslation } from 'react-i18next';
import { ResourceLink } from '@console/internal/components/utils';
import { referenceForModel } from '@console/internal/module/k8s';
import { Status } from '@console/shared';
import { PipelineRunKind, PipelineRunReferenceResource } from '../../../types';
import { pipelineRunFilterReducer } from '../../../utils/pipeline-filter-reducer';
import { pipelineRefExists } from '../../../utils/pipeline-augment';
import { PipelineModel, PipelineResourceModel } from '../../../models';
import ResourceLinkList from '../../pipelines/resource-overview/ResourceLinkList';
import RunDetailsErrorLog from '../logs/RunDetailsErrorLog';
import TriggeredBySection from './TriggeredBySection';
import { getPLRLogSnippet } from '../logs/pipelineRunLogSnippet';
import WorkspaceResourceLinkList from '../../shared/workspaces/WorkspaceResourceLinkList';

export type PipelineRunCustomDetailsProps = {
  pipelineRun: PipelineRunKind;
};

const PipelineRunCustomDetails: React.FC<PipelineRunCustomDetailsProps> = ({ pipelineRun }) => {
  const { t } = useTranslation();
  // FIXME: If they are inline resources, we are not going to render them
  const unfilteredResources = pipelineRun.spec.resources as PipelineRunReferenceResource[];
  const renderResources =
    unfilteredResources
      ?.filter(({ resourceRef }) => !!resourceRef)
      .map((resource) => resource.resourceRef.name) || [];
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
      {pipelineRefExists(pipelineRun) && (
        <dl>
          <dt>{t('pipelines-plugin~Pipeline')}</dt>
          <dd>
            <ResourceLink
              kind={referenceForModel(PipelineModel)}
              name={pipelineRun.spec.pipelineRef.name}
              namespace={pipelineRun.metadata.namespace}
            />
          </dd>
        </dl>
      )}
      <TriggeredBySection pipelineRun={pipelineRun} />
      <ResourceLinkList
        model={PipelineResourceModel}
        links={renderResources}
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
