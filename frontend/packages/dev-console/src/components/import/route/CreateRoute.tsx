import * as React from 'react';
import { FormGroup } from 'patternfly-react';
import { useFormikContext, FormikValues } from 'formik';
import { InputField, DropdownField } from '../../formik-fields';
import { makePortName } from '../../../utils/imagestream-utils';

const CreateRoute: React.FC = () => {
  const {
    values: {
      image: { ports },
      route: { targetPort },
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

  return (
    <FormGroup>
      <InputField
        type="text"
        name="route.hostname"
        label="Hostname"
        helpText="Public hostname for the route. If not specified, a hostname is generated."
      />
      <InputField
        type="text"
        name="route.path"
        label="Path"
        placeholder="/"
        helpText="Path that the router watches to route traffic to the service."
      />
      <DropdownField
        name="route.targetPort"
        label="Target Port"
        items={portOptions}
        selectedKey={targetPort}
        title={portOptions[targetPort] || 'Select target port'}
        helpText="Target port for traffic."
        fullWidth
      />
    </FormGroup>
  );
};

export default CreateRoute;
