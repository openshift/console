import * as React from 'react';
import { connectToFlags, FlagsObject } from '@console/internal/reducers/features';
import { getBadgeFromType } from '@console/shared';
import { Split, SplitItem } from '@patternfly/react-core';
import { useFormikContext, FormikValues } from 'formik';
import { PipelineModel } from '../../../models';
import { FLAG_OPENSHIFT_PIPELINE } from '../../../const';
import { CheckboxField } from '../../formik-fields';
import FormSection from '../section/FormSection';
import PipelineTemplate from './PipelineTemplate';

type PipelineSectionProps = {
  flags: FlagsObject;
};

const PipelineSection: React.FC<PipelineSectionProps> = ({ flags }) => {
  const { values } = useFormikContext<FormikValues>();

  if (flags[FLAG_OPENSHIFT_PIPELINE] && values.image.selected) {
    const title = (
      <Split gutter="md">
        <SplitItem className="odc-form-section__heading">Pipeline</SplitItem>
        <SplitItem>{getBadgeFromType(PipelineModel.badge)}</SplitItem>
      </Split>
    );
    return (
      <FormSection title={title}>
        <CheckboxField label="Enable pipelines" name="pipeline.enabled" />
        {values.pipeline.enabled && <PipelineTemplate />}
      </FormSection>
    );
  }

  return null;
};

export default connectToFlags(FLAG_OPENSHIFT_PIPELINE)(PipelineSection);
