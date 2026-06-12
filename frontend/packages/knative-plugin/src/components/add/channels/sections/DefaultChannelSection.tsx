import type { FC } from 'react';
import { TextInputTypes } from '@patternfly/react-core';
import { useTranslation } from 'react-i18next';
import FormSection from '@console/dev-console/src/components/import/section/FormSection';
import { InputField } from '@console/shared/src/components/formik-fields/InputField';
import ApplicationSelector from '@console/topology/src/components/dropdowns/ApplicationSelector';

type DefaultChannelSectionProps = {
  namespace: string;
};

const DefaultChannelSection: FC<DefaultChannelSectionProps> = ({ namespace }) => {
  const { t } = useTranslation('knative-plugin');
  return (
    <FormSection extraMargin>
      <ApplicationSelector namespace={namespace} subPath="formData" />
      <InputField
        type={TextInputTypes.text}
        data-test-id="channel-name"
        name="formData.name"
        label={t('Name')}
        helpText={t('A unique name for the component/channel')}
        required
      />
    </FormSection>
  );
};

export default DefaultChannelSection;
