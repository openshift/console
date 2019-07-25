import * as React from 'react';
import * as _ from 'lodash';
import { useFormikContext, FormikValues } from 'formik';
import { TextInputTypes } from '@patternfly/react-core';
import { InputField, DropdownField } from '../../formik-fields';
import { makePortName } from '../../../utils/imagestream-utils';

const CreateRoute: React.FC = () => {
  const {
    values: {
      image: { ports },
      route: { targetPort },
      serverless: { enabled: serverlessEnabled },
    },
  } = useFormikContext<FormikValues>();
  const portOptions = ports.reduce((acc, port) => {
    const name = makePortName(port);
    acc[name] = (
      <React.Fragment>
        {port.containerPort} &rarr; {port.containerPort} ({port.protocol})
      </React.Fragment>
    );
    return acc;
  }, {});

  if (serverlessEnabled) {
    return (
      <InputField
        type={TextInputTypes.text}
        name="route.targetPort"
        label="Target Port"
        placeholder="8080"
        helpText="Target port for traffic."
      />
    );
  }
  return (
    <React.Fragment>
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
      {!_.isEmpty(ports) && (
        <DropdownField
          name="route.targetPort"
          label="Target Port"
          items={portOptions}
          title={portOptions[targetPort] || 'Select target port'}
          helpText="Target port for traffic."
          fullWidth
        />
      )}
    </React.Fragment>
  );
};

export default CreateRoute;
