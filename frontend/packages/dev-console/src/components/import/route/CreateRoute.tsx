import * as React from 'react';
import { TextInputTypes } from '@patternfly/react-core';
import { useTranslation } from 'react-i18next';
import { InputField } from '@console/shared';

const CreateRoute: React.FC = () => {
  const { t } = useTranslation();
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
    </>
  );
};

export default CreateRoute;
