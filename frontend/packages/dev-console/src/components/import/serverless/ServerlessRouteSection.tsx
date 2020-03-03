import * as React from 'react';
import * as _ from 'lodash';
import { TextInputTypes } from '@patternfly/react-core';
import { useFormikContext, FormikValues } from 'formik';
import { InputField, DropdownField } from '@console/shared';
import FormSection from '../section/FormSection';
import { RouteData } from '../import-types';
import { makePortName } from '../../../utils/imagestream-utils';

export interface ServerlessRouteSectionProps {
  route: RouteData;
}

const ServerlessRouteSection: React.FC<ServerlessRouteSectionProps> = ({ route }) => {
  const {
    values: {
      image: { ports },
      route: { defaultUnknownPort, targetPort },
    },
  } = useFormikContext<FormikValues>();
  const portOptions = ports.reduce((acc, port) => {
    const name = makePortName(port);
    acc[name] = <>{port.containerPort}</>;
    return acc;
  }, {});
  return (
    <FormSection title="Routing">
      {route.create && (
        <>
          {_.isEmpty(ports) ? (
            <InputField
              type={TextInputTypes.text}
              name="route.unknownTargetPort"
              label="Target Port"
              placeholder={defaultUnknownPort}
              helpText="Target port for traffic."
            />
          ) : (
            <DropdownField
              name="route.targetPort"
              label="Target Port"
              items={portOptions}
              title={portOptions[targetPort] || 'Select target port'}
              helpText="Target port for traffic."
              fullWidth
            />
          )}
        </>
      )}
    </FormSection>
  );
};

export default ServerlessRouteSection;
