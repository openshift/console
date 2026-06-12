import type { FC } from 'react';
import { TextInputTypes } from '@patternfly/react-core';
import { useTranslation } from 'react-i18next';
import { InputField } from '@console/shared/src/components/formik-fields/InputField';

const CreateRoute: FC = () => {
  const { t } = useTranslation('devconsole');
  return (
    <>
      <InputField
        type={TextInputTypes.text}
        name="route.hostname"
        label={t('Hostname')}
        helpText={t(
          'devconsole~Public hostname for the route. If not specified, a hostname is generated.',
        )}
      />
      <InputField
        type={TextInputTypes.text}
        name="route.path"
        label={t('Path')}
        placeholder="/"
        helpText={t('Path that the router watches to route traffic to the service.')}
      />
    </>
  );
};

export default CreateRoute;
