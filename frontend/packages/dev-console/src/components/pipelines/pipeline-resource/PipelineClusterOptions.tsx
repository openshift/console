import * as React from 'react';
import { TextInputTypes } from '@patternfly/react-core';
import { InputField, DroppableFileInputField } from '@console/shared';

const PipelineClusterOptions: React.FC = () => (
  <>
    <InputField
      type={TextInputTypes.text}
      name="params.name"
      label="Name"
      helpText="Name of the cluster."
      required
    />
    <InputField
      type={TextInputTypes.text}
      name="params.url"
      label="URL"
      helpText="Host URL of the master node."
      required
    />
    <InputField
      type={TextInputTypes.text}
      name="params.username"
      label="Username"
      helpText="The user with access to the cluster."
      required
    />
    <InputField
      type={TextInputTypes.password}
      name="params.password"
      label="Password"
      helpText="Please provide Password."
    />
    <InputField
      type={TextInputTypes.text}
      name="params.insecure"
      label="Insecure"
      helpText="Indicate server should be accessed without verifying the TLS certificate."
    />
    <DroppableFileInputField
      name="secrets.cadata"
      label="Cadata"
      helpText="The PEM format certificate. Upload file by dragging &amp; dropping, selecting it, or pasting from the clipboard."
      required
    />
    <DroppableFileInputField
      name="secrets.token"
      label="Token"
      helpText="Upload file by dragging &amp; dropping, selecting it, or pasting from the clipboard."
      required
    />
  </>
);

export default PipelineClusterOptions;
