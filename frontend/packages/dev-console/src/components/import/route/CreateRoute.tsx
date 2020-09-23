import * as React from 'react';
import { useFormikContext } from 'formik';
import { TextInputTypes } from '@patternfly/react-core';
import { InputField } from '@console/shared';
import { DeployImageFormData, GitImportFormData } from '../import-types';
import PortInputField from './PortInputField';

const CreateRoute: React.FC = () => {
  const {
    values: {
      image: { ports },
      route: { defaultUnknownPort },
    },
  } = useFormikContext<DeployImageFormData | GitImportFormData>();
  const portOptions = ports.map((port) => port.containerPort.toString());
  const placeholderPort = ports[0]?.containerPort || defaultUnknownPort;

  return (
    <>
      <InputField
        type={TextInputTypes.text}
        name="route.hostname"
        label="Hostname"
        helpText="Public hostname for the route. If not specified, a hostname is generated."
      />
      <InputField
        type={TextInputTypes.text}
        name="route.path"
        label="Path"
        placeholder="/"
        helpText="Path that the router watches to route traffic to the service."
      />
      <PortInputField
        name="route.unknownTargetPort"
        label="Target Port"
        placeholderText={placeholderPort.toString()}
        helpText="Target port for traffic."
        options={portOptions}
      />
    </>
  );
};

export default CreateRoute;
