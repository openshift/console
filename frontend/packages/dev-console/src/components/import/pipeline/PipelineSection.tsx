import * as React from 'react';
import { connectToFlags, FlagsObject } from '@console/internal/reducers/features';
import { getBadgeFromType } from '@console/shared';
import { Split, SplitItem, Alert } from '@patternfly/react-core';
import { useFormikContext, FormikValues } from 'formik';
import { PipelineModel } from '../../../models';
import { FLAG_OPENSHIFT_PIPELINE } from '../../../const';
import FormSection from '../section/FormSection';
import PipelineTemplate from './PipelineTemplate';

type PipelineSectionProps = {
  flags: FlagsObject;
};

const PipelineSection: React.FC<PipelineSectionProps> = ({ flags }) => {
  const { values } = useFormikContext<FormikValues>();

  if (flags[FLAG_OPENSHIFT_PIPELINE]) {
    const title = (
      <Split gutter="md">
        <SplitItem className="odc-form-section__heading">Pipelines</SplitItem>
        <SplitItem>{getBadgeFromType(PipelineModel.badge)}</SplitItem>
      </Split>
    );
    return (
      <FormSection title={title}>
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
