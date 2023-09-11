import * as React from 'react';
import { SelectVariant as SelectVariantDeprecated } from '@patternfly/react-core/deprecated';
import { useFormikContext } from 'formik';
import { useTranslation } from 'react-i18next';
import { SelectInputField, SelectInputOption } from '@console/shared';
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
  const portOptions: SelectInputOption[] = ports.map((port) => ({
    value: port.containerPort.toString(),
    disabled: false,
  }));
  const placeholderPort = ports[0]?.containerPort || defaultPort;

  return (
    <SelectInputField
      data-test-id="target-port-field"
      name="route.unknownTargetPort"
      label={t('devconsole~Target port')}
      ariaLabel={t('devconsole~Target port')}
      placeholderText={placeholderPort.toString()}
      helpText={t('devconsole~Target port for traffic.')}
      options={portOptions}
      variant={SelectVariantDeprecated.typeahead}
      isInputValuePersisted
      noResultsFoundText={t('devconsole~No results found')}
      toggleOnSelection
    />
  );
};

export default PortInputField;
