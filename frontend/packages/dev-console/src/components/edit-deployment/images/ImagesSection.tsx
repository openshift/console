import * as React from 'react';
import { useTranslation } from 'react-i18next';
import { CheckboxField } from '@console/shared/src';
import { Resources } from '../../import/import-types';
import { FormikValues, useFormikContext } from 'formik';
import ContainerImageField from './ContainerImageField';
import FormSection from '../../import/section/FormSection';
import AdvancedImageOptions from './AdvancedImageOptions';
import ContainerField from '../ContainerField';

const ImagesSection: React.FC<{ resourceType: string }> = ({ resourceType }) => {
  const { t } = useTranslation();
  const {
    values: {
      formData: { fromImageStreamTag },
    },
  } = useFormikContext<FormikValues>();
  return (
    <FormSection title={t('devconsole~Images')}>
      <ContainerField />
      <ContainerImageField />
      {fromImageStreamTag && (
        <CheckboxField
          name="formData.triggers.image"
          label={t('devconsole~Auto deploy when new Image is available')}
        />
      )}
      {resourceType === Resources.OpenShift && (
        <CheckboxField
          name="formData.triggers.config"
          label={t('devconsole~Auto deploy when deployment configuration changes')}
        />
      )}
      <AdvancedImageOptions />
    </FormSection>
  );
};

export default ImagesSection;
