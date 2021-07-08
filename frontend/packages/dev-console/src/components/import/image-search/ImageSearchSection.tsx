import * as React from 'react';
import { useFormikContext, FormikValues } from 'formik';
import * as _ from 'lodash';
import { useTranslation } from 'react-i18next';
import { ResourceLink } from '@console/internal/components/utils';
import { RadioGroupField } from '@console/shared';
import { imageRegistryType } from '../../../utils/imagestream-utils';
import FormSection from '../section/FormSection';
import ImageSearch from './ImageSearch';
import ImageStream from './ImageStream';

const ImageSearchSection: React.FC<{ disabled?: boolean }> = ({ disabled = false }) => {
  const { t } = useTranslation();
  const { values, setFieldValue, initialValues } = useFormikContext<FormikValues>();
  const [registry, setRegistry] = React.useState(values.registry);
  React.useEffect(() => {
    if (values.registry !== registry) {
      setRegistry(values.registry);
      setFieldValue('searchTerm', initialValues.searchTerm);
      setFieldValue('isi', initialValues.isi);
      setFieldValue('imageStream', initialValues.imageStream);
    }
  }, [
    initialValues.imageStream,
    initialValues.isi,
    initialValues.searchTerm,
    registry,
    setFieldValue,
    values,
  ]);

  return (
    <FormSection
      title={t('devconsole~Image')}
      subTitle={t('devconsole~Deploy an existing Image from an Image Stream or Image registry.')}
    >
      {!_.isEmpty(values.containers) && (
        <div className="co-section-heading-tertiary">
          {t('devconsole~Container')}
          <ResourceLink kind="Container" name={values.containers[0].name} linkTo={false} />
        </div>
      )}
      <RadioGroupField
        name="registry"
        options={[
          {
            label: imageRegistryType(t).External.label,
            value: imageRegistryType(t).External.value,
            isDisabled: (values.formType === 'edit' && values.registry === 'internal') || disabled,
            activeChildren: <ImageSearch />,
          },
          {
            label: imageRegistryType(t).Internal.label,
            value: imageRegistryType(t).Internal.value,
            isDisabled: (values.formType === 'edit' && values.registry === 'external') || disabled,
            activeChildren: <ImageStream disabled={disabled} />,
          },
        ]}
      />
    </FormSection>
  );
};

export default ImageSearchSection;
