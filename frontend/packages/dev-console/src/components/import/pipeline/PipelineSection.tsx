import * as React from 'react';
import { connectToFlags, FlagsObject } from '@console/internal/reducers/features';
import { Alert, Split, SplitItem } from '@patternfly/react-core';
import { getActiveNamespace } from '@console/internal/actions/ui';
import { useAccessReview } from '@console/internal/components/utils';
import { TechPreviewBadge } from '@console/shared';
import { useFormikContext, FormikValues } from 'formik';
import { PipelineModel, PipelineResourceModel } from '../../../models';
import { FLAG_OPENSHIFT_PIPELINE, CLUSTER_PIPELINE_NS } from '../../../const';
import { NormalizedBuilderImages } from '../../../utils/imagestream-utils';
import FormSection from '../section/FormSection';
import PipelineTemplate from './PipelineTemplate';

type PipelineSectionProps = {
  flags: FlagsObject;
  builderImages: NormalizedBuilderImages;
};

const usePipelineAccessReview = (): boolean => {
  const canListPipelines = useAccessReview({
    group: PipelineModel.apiGroup,
    resource: PipelineModel.plural,
    namespace: CLUSTER_PIPELINE_NS,
    verb: 'list',
  });

  const canCreatePipelines = useAccessReview({
    group: PipelineModel.apiGroup,
    resource: PipelineModel.plural,
    namespace: getActiveNamespace(),
    verb: 'create',
  });

  const canCreatePipelineResource = useAccessReview({
    group: PipelineResourceModel.apiGroup,
    resource: PipelineResourceModel.plural,
    namespace: getActiveNamespace(),
    verb: 'create',
  });

  return canListPipelines && canCreatePipelines && canCreatePipelineResource;
};

const PipelineSection: React.FC<PipelineSectionProps> = ({ flags, builderImages }) => {
  const { values } = useFormikContext<FormikValues>();

  const hasCreatePipelineAccess = usePipelineAccessReview();

  if (flags[FLAG_OPENSHIFT_PIPELINE] && hasCreatePipelineAccess) {
    const title = (
      <Split hasGutter>
        <SplitItem className="odc-form-section__heading">Pipelines</SplitItem>
        <SplitItem>
          <TechPreviewBadge />
        </SplitItem>
      </Split>
    );
    return (
      <FormSection title={title}>
        {values.image.selected || values.build.strategy === 'Docker' ? (
          <PipelineTemplate builderImages={builderImages} />
        ) : (
          <Alert
            isInline
            variant="info"
            title="Select a builder image and resource to see if there is a pipeline template available for this runtime."
          />
        )}
      </FormSection>
    );
  }

  return null;
};

export default connectToFlags<PipelineSectionProps>(FLAG_OPENSHIFT_PIPELINE)(PipelineSection);
