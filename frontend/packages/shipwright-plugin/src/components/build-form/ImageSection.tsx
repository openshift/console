import * as React from 'react';
import { TextInputTypes } from '@patternfly/react-core';
import { useTranslation } from 'react-i18next';
import FormSection from '@console/dev-console/src/components/import/section/FormSection';
import { InputField } from '@console/shared/src';
import PushSecretSelector from './PushSecretSelector';

const ImageSection: React.FC<{ namespace: string }> = ({ namespace }) => {
  const { t } = useTranslation();
  return (
    <FormSection title={t('shipwright-plugin~Image')}>
      <InputField
        name="formData.outputImage.image"
        type={TextInputTypes.text}
        label={t('shipwright-plugin~Output image')}
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
