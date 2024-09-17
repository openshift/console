import * as React from 'react';
import { useFormikContext } from 'formik';
import { useTranslation } from 'react-i18next';
import { SingleTypeaheadField, SelectInputOption } from '@console/shared';
import { DeployImageFormData, GitImportFormData, UploadJarFormData } from '../import-types';

interface PortInputFieldProps {
  defaultPort: number;
}

const PortInputField: React.FC<PortInputFieldProps> = ({ defaultPort }) => {
  const { t } = useTranslation();
  const {
    values: {
      image: { ports },
    },
  } = useFormikContext<DeployImageFormData | GitImportFormData | UploadJarFormData>();
  const portOptions: SelectInputOption[] = Array.from(
    new Set(ports.map((port) => port.containerPort.toString())),
  ).map((value) => ({
    value,
    disabled: false,
  }));
  const placeholderPort = ports[0]?.containerPort || defaultPort;

  return (
    <SingleTypeaheadField
      data-test-id="target-port-field"
      name="route.unknownTargetPort"
      label={t('devconsole~Target port')}
      ariaLabel={t('devconsole~Target port')}
      placeholderText={placeholderPort.toString()}
      helpText={t('devconsole~Target port for traffic.')}
      options={portOptions}
      toggleOnSelection
    />
  );
};

export default PortInputField;
