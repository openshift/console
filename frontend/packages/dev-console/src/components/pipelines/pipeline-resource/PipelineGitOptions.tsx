import * as React from 'react';
import { TextInputTypes } from '@patternfly/react-core';
import { InputField } from '@console/shared/src/components/formik-fields';

const PipelineGitOptions: React.FC = () => (
  <>
    <InputField
      type={TextInputTypes.text}
      name="params.url"
      label="URL"
      helpText="Please provide git URL."
      required
    />
    <InputField
      type={TextInputTypes.text}
      name="params.revision"
      label="Revision"
      helpText="Please provide Revisions. i.e master"
    />
  </>
);

export default PipelineGitOptions;
