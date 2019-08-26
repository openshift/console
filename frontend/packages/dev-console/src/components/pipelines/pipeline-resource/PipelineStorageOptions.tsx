import * as React from 'react';
import { TextInputTypes } from '@patternfly/react-core';
import { InputField } from '../../formik-fields';

const PipelineStorageOptions: React.FC = () => (
  <React.Fragment>
    <InputField
      type={TextInputTypes.text}
      name="params.type"
      label="Type"
      helpText="Represents the type of blob storage i.e gcs"
      required
    />
    <InputField
      type={TextInputTypes.text}
      name="params.location"
      label="Location"
      helpText="Represents the location of the blob storage i.e gs://some-private-bucket"
      required
    />
    <InputField
      type={TextInputTypes.text}
      name="params.dir"
      label="Directory"
      helpText="Represents whether the blob storage is a directory or not"
    />
  </React.Fragment>
);

export default PipelineStorageOptions;
