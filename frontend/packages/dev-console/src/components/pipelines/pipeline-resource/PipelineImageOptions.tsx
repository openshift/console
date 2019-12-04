import * as React from 'react';
import { TextInputTypes } from '@patternfly/react-core';
import { InputField } from '@console/shared';

const PipelineImageOptions: React.FC = () => (
  <InputField
    type={TextInputTypes.text}
    name="params.url"
    label="URL"
    helpText="Please provide Image URL."
    required
  />
);

export default PipelineImageOptions;
