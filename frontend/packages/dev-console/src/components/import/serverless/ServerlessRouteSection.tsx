import * as React from 'react';
import { useFormikContext } from 'formik';
import { useTranslation } from 'react-i18next';
import FormSection from '../section/FormSection';
import { RouteData, GitImportFormData, DeployImageFormData } from '../import-types';
import PortInputField from '../route/PortInputField';

export interface ServerlessRouteSectionProps {
  route: RouteData;
}

const ServerlessRouteSection: React.FC<ServerlessRouteSectionProps> = ({ route }) => {
  const { t } = useTranslation();
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
          label={t('devconsole~Target Port')}
          placeholderText={placeholderPort.toString()}
          helpText={t('devconsole~Target port for traffic.')}
          options={portOptions}
        />
      )}
    </FormSection>
  );
};

export default ServerlessRouteSection;
