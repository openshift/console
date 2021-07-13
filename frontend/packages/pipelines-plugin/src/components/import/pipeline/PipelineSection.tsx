import * as React from 'react';
import { Alert, Split, SplitItem } from '@patternfly/react-core';
import { useFormikContext, FormikValues } from 'formik';
import { useTranslation } from 'react-i18next';
import FormSection from '@console/dev-console/src/components/import/section/FormSection';
import { NormalizedBuilderImages } from '@console/dev-console/src/utils/imagestream-utils';
import { getActiveNamespace } from '@console/internal/actions/ui';
import { useAccessReview } from '@console/internal/components/utils';
import { connectToFlags } from '@console/internal/reducers/connectToFlags';
import { FlagsObject } from '@console/internal/reducers/features';
import { TechPreviewBadge } from '@console/shared';
import { FLAG_OPENSHIFT_PIPELINE, CLUSTER_PIPELINE_NS } from '../../../const';
import { PipelineModel, PipelineResourceModel } from '../../../models';
import { PipelineKind } from '../../../types';
import { usePipelineTechPreviewBadge } from '../../../utils/hooks';
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

  const canCreatePipelineResource = useAccessReview({
    group: PipelineResourceModel.apiGroup,
    resource: PipelineResourceModel.plural,
    namespace: getActiveNamespace(),
    verb: 'create',
  });

  return canListPipelines && canCreatePipelines && canCreatePipelineResource;
};

const PipelineSection: React.FC<PipelineSectionProps> = ({
  flags,
  builderImages,
  existingPipeline,
}) => {
  const { t } = useTranslation();
  const { values } = useFormikContext<FormikValues>();

  const hasCreatePipelineAccess = usePipelineAccessReview();
  const badge = usePipelineTechPreviewBadge(values.project.name);
  if (flags[FLAG_OPENSHIFT_PIPELINE] && hasCreatePipelineAccess) {
    const title = (
      <Split className="odc-form-section-pipeline" hasGutter>
        <SplitItem className="odc-form-section__heading">
          {t('pipelines-plugin~Pipelines')}
        </SplitItem>
        {badge && (
          <SplitItem>
            <TechPreviewBadge />
          </SplitItem>
        )}
      </Split>
    );
    return (
      <FormSection title={title}>
        {values.image.selected || values.build.strategy === 'Docker' ? (
          <PipelineTemplate builderImages={builderImages} existingPipeline={existingPipeline} />
        ) : (
          <Alert
            isInline
            variant="info"
            title={t(
              'pipelines-plugin~Select a Builder Image and resource to see if there is a pipeline template available for this runtime.',
            )}
          />
        )}
      </FormSection>
    );
  }

  return null;
};

export default connectToFlags<PipelineSectionProps>(FLAG_OPENSHIFT_PIPELINE)(PipelineSection);
