import * as React from 'react';
import { useTranslation } from 'react-i18next';
import { SectionHeading, ResourceSummary, ResourceLink } from '@console/internal/components/utils';
import { referenceForModel } from '@console/internal/module/k8s';
import { Status } from '@console/shared';
import { pipelineRunFilterReducer } from '../../../utils/pipeline-filter-reducer';
import {
  PipelineRun,
  PipelineRunReferenceResource,
  pipelineRefExists,
} from '../../../utils/pipeline-augment';
import { PipelineModel, PipelineResourceModel } from '../../../models';
import ResourceLinkList from '../../pipelines/resource-overview/ResourceLinkList';
import RunDetailsErrorLog from '../logs/RunDetailsErrorLog';
import PipelineRunVisualization from './PipelineRunVisualization';
import TriggeredBySection from './TriggeredBySection';
import { getPLRLogSnippet } from '../logs/pipelineRunLogSnippet';

import './TriggeredBySection.scss';

export interface PipelineRunDetailsProps {
  obj: PipelineRun;
}

export const PipelineRunDetails: React.FC<PipelineRunDetailsProps> = ({ obj: pipelineRun }) => {
  const { t } = useTranslation();
  // FIXME: If they are inline resources, we are not going to render them
  const unfilteredResources = pipelineRun.spec.resources as PipelineRunReferenceResource[];
  const renderResources =
    unfilteredResources
      ?.filter(({ resourceRef }) => !!resourceRef)
      .map((resource) => resource.resourceRef.name) || [];

  return (
    <div className="co-m-pane__body odc-pipeline-run-details">
      <SectionHeading text={t('pipelines-plugin~Pipeline run details')} />
      <PipelineRunVisualization pipelineRun={pipelineRun} />
      <div className="row">
        <div className="col-sm-6">
          <ResourceSummary resource={pipelineRun} />
        </div>
        <div className="col-sm-6 odc-pipeline-run-details__customDetails">
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
        </div>
      </div>
    </div>
  );
};
