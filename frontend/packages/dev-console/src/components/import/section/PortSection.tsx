import * as React from 'react';
import { useFormikContext } from 'formik';
import { useTranslation } from 'react-i18next';
import { DeployImageFormData, GitImportFormData } from '../import-types';
import PortInputField from '../route/PortInputField';
import FormSection from './FormSection';

const PortSection: React.FC = () => {
  const { t } = useTranslation();
  const {
    values: {
      image: { ports: imagePorts },
      route: { defaultUnknownPort },
    },
  } = useFormikContext<DeployImageFormData | GitImportFormData>();
  const ports = imagePorts.map((port) => port.containerPort.toString());
  const availablePorts: string[] = ports.some((port) => port === defaultUnknownPort.toString())
    ? ports
    : [...ports, defaultUnknownPort.toString()];
  const placeholderPort = imagePorts[0]?.containerPort || defaultUnknownPort;

  return (
    <FormSection title={t('devconsole~Port')} fullWidth>
      <PortInputField
        name="servicePort"
        label={t('devconsole~Target port')}
        placeholderText={placeholderPort.toString()}
        helpText={t('devconsole~Port exposed by the service.')}
        options={availablePorts}
      />
    </FormSection>
  );
};

export default PortSection;
