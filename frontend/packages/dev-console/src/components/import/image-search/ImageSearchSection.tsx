import * as React from 'react';
import { useFormikContext, FormikValues } from 'formik';
import { RadioButtonField } from '@console/shared';
import FormSection from '../section/FormSection';
import { imageRegistryType } from '../../../utils/imagestream-utils';
import ImageStream from './ImageStream';
import ImageSearch from './ImageSearch';
import SearchStatus from './SearchStatus';
import SearchResults from './SearchResults';

const ImageSearchSection: React.FC = () => {
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
      title="Image"
      subTitle="Deploy an existing image from an image stream or image registry."
    >
      <RadioButtonField
        name="registry"
        options={[
          {
            label: imageRegistryType.External.label,
            value: imageRegistryType.External.value,
            isDisabled: values.formType === 'edit' && values.registry === 'internal',
            activeChildren: <ImageSearch />,
          },
          {
            label: imageRegistryType.Internal.label,
            value: imageRegistryType.Internal.value,
            isDisabled: values.formType === 'edit' && values.registry === 'external',
            activeChildren: <ImageStream />,
          },
        ]}
      />
      <SearchStatus />
      <SearchResults />
    </FormSection>
  );
};

export default ImageSearchSection;
