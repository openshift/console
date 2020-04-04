import * as React from 'react';
import { connectToFlags, FlagsObject } from '@console/internal/reducers/features';
import { Alert } from '@patternfly/react-core';
import { getActiveNamespace } from '@console/internal/actions/ui';
import { useAccessReview } from '@console/internal/components/utils';
import { useFormikContext, FormikValues } from 'formik';
import { PipelineModel, PipelineResourceModel } from '../../../models';
import { FLAG_OPENSHIFT_PIPELINE, CLUSTER_PIPELINE_NS } from '../../../const';
import FormSection from '../section/FormSection';
import PipelineTemplate from './PipelineTemplate';

type PipelineSectionProps = {
  flags: FlagsObject;
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

const PipelineSection: React.FC<PipelineSectionProps> = ({ flags }) => {
  const { values } = useFormikContext<FormikValues>();

  const hasCreatePipelineAccess = usePipelineAccessReview();

  if (flags[FLAG_OPENSHIFT_PIPELINE] && hasCreatePipelineAccess) {
    return (
      <FormSection title="Pipelines">
        {values.image.selected || values.build.strategy === 'Docker' ? (
          <PipelineTemplate />
        ) : (
          <Alert
            isInline
            variant="info"
            title="Select a builder image to see if there is a pipeline template available for this runtime."
          />
        )}
      </FormSection>
    );
  }

  return null;
};

export default connectToFlags(FLAG_OPENSHIFT_PIPELINE)(PipelineSection);
