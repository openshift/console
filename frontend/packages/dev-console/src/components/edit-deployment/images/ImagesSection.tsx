import * as React from 'react';
import { FormikValues, useFormikContext } from 'formik';
import { useTranslation } from 'react-i18next';
import { CheckboxField } from '@console/shared/src';
import { Resources } from '../../import/import-types';
import FormSection from '../../import/section/FormSection';
import ContainerField from '../ContainerField';
import AdvancedImageOptions from './AdvancedImageOptions';
import ContainerImageField from './ContainerImageField';

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
