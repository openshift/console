import * as React from 'react';
import { TextInputTypes } from '@patternfly/react-core';
import FormSection from '../section/FormSection';
import { RouteData } from '../import-types';
import { InputField } from '../../formik-fields';

export interface ServerlessRouteSectionProps {
  route: RouteData;
}

const ServerlessRouteSection: React.FC<ServerlessRouteSectionProps> = ({ route }) => {
  return (
    <FormSection title="Routing">
      {route.create && (
        <InputField
          type={TextInputTypes.text}
          name="serverlessRoute.targetPort"
          label="Target Port"
          placeholder="8080"
          helpText="Target port for traffic."
        />
      )}
    </FormSection>
  );
};

export default ServerlessRouteSection;
