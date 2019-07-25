import * as React from 'react';
import { TextInputTypes } from '@patternfly/react-core';
import { InputField } from '../../formik-fields';
import FormSection from '../section/FormSection';

export interface DockerSectionProps {
  buildStrategy: string;
}

const DockerSection: React.FC<DockerSectionProps> = ({ buildStrategy }) =>
  buildStrategy === 'Docker' && (
    <FormSection title="Docker">
      <InputField
        type={TextInputTypes.text}
        name="docker.dockerfilePath"
        label="Dockerfile Path"
        helpText="Allows the builds to use a different path to locate your Dockerfile, relative to the Context Dir field."
      />
      <InputField
        type={TextInputTypes.number}
        name="docker.containerPort"
        label="Container Port"
        helpText="Port number the container exposes."
        style={{ maxWidth: '100%' }}
      />
    </FormSection>
  );

export default DockerSection;
