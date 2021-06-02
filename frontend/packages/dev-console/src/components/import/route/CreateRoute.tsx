import * as React from 'react';
import { TextInputTypes } from '@patternfly/react-core';
import { useFormikContext } from 'formik';
import { useTranslation } from 'react-i18next';
import { InputField } from '@console/shared';
import { DeployImageFormData, GitImportFormData, UploadJarFormData } from '../import-types';
import PortInputField from './PortInputField';

const CreateRoute: React.FC = () => {
  const { t } = useTranslation();
  const {
    values: {
      image: { ports },
      route: { defaultUnknownPort },
    },
  } = useFormikContext<DeployImageFormData | GitImportFormData | UploadJarFormData>();
  const portOptions = ports.map((port) => port.containerPort.toString());
  const placeholderPort = ports[0]?.containerPort || defaultUnknownPort;

  return (
    <>
      <InputField
        type={TextInputTypes.text}
        name="route.hostname"
        label={t('devconsole~Hostname')}
        helpText={t(
          'devconsole~Public hostname for the route. If not specified, a hostname is generated.',
        )}
      />
      <InputField
        type={TextInputTypes.text}
        name="route.path"
        label={t('devconsole~Path')}
        placeholder="/"
        helpText={t('devconsole~Path that the router watches to route traffic to the service.')}
      />
      <PortInputField
        name="route.unknownTargetPort"
        label={t('devconsole~Target port')}
        placeholderText={placeholderPort.toString()}
        helpText={t('devconsole~Target port for traffic.')}
        options={portOptions}
      />
    </>
  );
};

export default CreateRoute;
