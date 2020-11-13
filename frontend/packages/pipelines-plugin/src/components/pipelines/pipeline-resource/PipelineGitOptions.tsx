import * as React from 'react';
import { TextInputTypes } from '@patternfly/react-core';
import { InputField } from '@console/shared';

type PipelineGitOptionsProps = { prefixName: string };

const PipelineGitOptions: React.FC<PipelineGitOptionsProps> = ({ prefixName }) => (
  <>
    <InputField
      type={TextInputTypes.text}
      name={`${prefixName}.params.url`}
      label="URL"
      helpText="Please provide Git URL."
      required
    />
    <InputField
      type={TextInputTypes.text}
      name={`${prefixName}.params.revision`}
      label="Revision"
      helpText="Please provide Revisions. i.e master"
    />
  </>
);

export default PipelineGitOptions;
