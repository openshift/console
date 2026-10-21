import type { FC } from 'react';
import { useFormikContext } from 'formik';
import { useTranslation } from 'react-i18next';
import type { NameValueFromPair, NameValuePair } from '@console/shared/src';
import { EnvironmentField } from '@console/shared/src';
import FormSection from '../../import/section/FormSection';

export type EnvironmentVariablesSectionFormData = {
  formData: {
    environmentVariables: (NameValuePair | NameValueFromPair)[];
  };
};

const EnvironmentVariablesSection: FC<{ namespace: string }> = ({ namespace }) => {
  const { t } = useTranslation();
  const {
    values: {
      formData: { environmentVariables },
    },
  } = useFormikContext<EnvironmentVariablesSectionFormData>();
  return (
    <FormSection
      title={t('devconsole~Environment Variables')}
      dataTest="section environment-variables"
    >
      <EnvironmentField
        name="formData.environmentVariables"
        envs={environmentVariables}
        obj={{ metadata: { namespace } }}
      />
    </FormSection>
  );
};

export default EnvironmentVariablesSection;
