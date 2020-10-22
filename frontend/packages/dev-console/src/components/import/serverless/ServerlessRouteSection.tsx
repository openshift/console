import * as React from 'react';
import { useFormikContext } from 'formik';
import FormSection from '../section/FormSection';
import { RouteData, GitImportFormData, DeployImageFormData } from '../import-types';
import PortInputField from '../route/PortInputField';

export interface ServerlessRouteSectionProps {
  route: RouteData;
}

const ServerlessRouteSection: React.FC<ServerlessRouteSectionProps> = ({ route }) => {
  const {
    values: {
      image: { ports },
      route: { defaultUnknownPort },
    },
  } = useFormikContext<DeployImageFormData | GitImportFormData>();
  const placeholderPort = defaultUnknownPort;
  const portOptions = ports.map((port) => port?.containerPort.toString());
  return (
    <FormSection title="Routing">
      {route.create && (
        <PortInputField
          name="route.unknownTargetPort"
          label="Target Port"
          placeholderText={placeholderPort.toString()}
          helpText="Target port for traffic."
          options={portOptions}
        />
      )}
    </FormSection>
  );
};

export default ServerlessRouteSection;
