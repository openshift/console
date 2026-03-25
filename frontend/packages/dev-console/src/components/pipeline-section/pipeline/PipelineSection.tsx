import type { FC } from 'react';
import { useEffect } from 'react';
import { Alert } from '@patternfly/react-core';
import type { FormikValues } from 'formik';
import { useFormikContext } from 'formik';
import { useTranslation } from 'react-i18next';
import FormSection from '@console/dev-console/src/components/import/section/FormSection';
import {
  FLAG_OPENSHIFT_BUILDCONFIG,
  FLAG_OPENSHIFT_PIPELINE,
  CLUSTER_PIPELINE_NS,
} from '@console/dev-console/src/const';
import type { NormalizedBuilderImages } from '@console/dev-console/src/utils/imagestream-utils';
import { getActiveNamespace } from '@console/internal/actions/ui';
import { useAccessReview } from '@console/internal/components/utils';
import { connectToFlags } from '@console/internal/reducers/connectToFlags';
import type { FlagsObject } from '@console/internal/reducers/features';
import { PipelineModel } from '../../../models/pipelines';
import type { PipelineKind } from '../../../types/pipeline';
import PipelineTemplate from './PipelineTemplate';

import './PipelineSection.scss';

type PipelineSectionProps = {
  flags: FlagsObject;
  builderImages: NormalizedBuilderImages;
  existingPipeline?: PipelineKind;
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

  return canListPipelines && canCreatePipelines;
};

const PipelineSection: FC<PipelineSectionProps> = ({ flags, builderImages, existingPipeline }) => {
  const { t } = useTranslation();
  const { values, setFieldValue } = useFormikContext<FormikValues>();

  /* Set pipeline.enabled to true if the user has access to create pipelines and the Builds are not installed */
  useEffect(() => {
    if (flags[FLAG_OPENSHIFT_PIPELINE] && !flags[FLAG_OPENSHIFT_BUILDCONFIG]) {
      setFieldValue('pipeline.enabled', true);
    }
  }, [setFieldValue, flags]);

  const hasCreatePipelineAccess = usePipelineAccessReview();
  if (flags[FLAG_OPENSHIFT_PIPELINE] && hasCreatePipelineAccess) {
    return (
      <FormSection>
        {values.image.selected || values.build.strategy === 'Docker' ? (
          <PipelineTemplate builderImages={builderImages} existingPipeline={existingPipeline} />
        ) : (
          <Alert
            isInline
            variant="info"
            title={t(
              'devconsole~Select a Builder Image and resource to see if there is a pipeline template available for this runtime.',
            )}
          />
        )}
      </FormSection>
    );
  }

  return null;
};

export default connectToFlags<PipelineSectionProps>(
  FLAG_OPENSHIFT_PIPELINE,
  FLAG_OPENSHIFT_BUILDCONFIG,
)(PipelineSection);
