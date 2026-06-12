import type { FC } from 'react';
import { TextInputTypes } from '@patternfly/react-core';
import { useTranslation } from 'react-i18next';
import FormSection from '@console/dev-console/src/components/import/section/FormSection';
import { InputField } from '@console/shared/src/components/formik-fields/InputField';
import PushSecretSelector from './PushSecretSelector';

const ImageSection: FC<{ namespace: string }> = ({ namespace }) => {
  const { t } = useTranslation('shipwright-plugin');
  return (
    <FormSection title={t('Image')}>
      <InputField
        name="formData.outputImage.image"
        type={TextInputTypes.text}
        label={t('Output image')}
        required
        autoComplete="off"
        helpText={t(
          'shipwright-plugin~Example for OpenShift internal registry: image-registry.openshift-image-registry.svc:5000/<image-namespace>/<image-name>:latest',
        )}
      />
      <PushSecretSelector formContextField="formData.outputImage.secret" namespace={namespace} />
    </FormSection>
  );
};

export default ImageSection;
