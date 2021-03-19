import * as React from 'react';
import { useFormikContext } from 'formik';
import { useTranslation } from 'react-i18next';
import { GitImportFormData, DeployImageFormData, UploadJarFormData } from '../import-types';
import PortInputField from '../route/PortInputField';

const ServerlessRouteSection: React.FC = () => {
  const { t } = useTranslation();
  const {
    values: {
      image: { ports },
      route: { defaultUnknownPort },
    },
  } = useFormikContext<DeployImageFormData | GitImportFormData | UploadJarFormData>();
  const placeholderPort = defaultUnknownPort;
  const portOptions = ports.map((port) => port?.containerPort.toString());
  return (
    <PortInputField
      name="route.unknownTargetPort"
      label={t('devconsole~Target port')}
      placeholderText={placeholderPort.toString()}
      helpText={t('devconsole~Target port for traffic.')}
      options={portOptions}
    />
  );
};

export default ServerlessRouteSection;
