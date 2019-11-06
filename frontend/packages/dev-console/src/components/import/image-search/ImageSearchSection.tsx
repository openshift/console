import * as React from 'react';
import { useFormikContext, FormikValues } from 'formik';
import { K8sResourceKind } from '@console/internal/module/k8s';
import { RadioButtonField } from '../../formik-fields';
import FormSection from '../section/FormSection';
import { imageRegistryType } from '../../../utils/imagestream-utils';
import ImageStream from './ImageStream';
import ImageSearch from './ImageSearch';
import SearchStatus from './SearchStatus';
import SearchResults from './SearchResults';

export interface ImageSearchSectionProps {
  projects: K8sResourceKind[];
  imageStreams: K8sResourceKind[];
}
const ImageSearchSection: React.FC<ImageSearchSectionProps> = ({ projects, imageStreams }) => {
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
        label="Image Section"
        options={[
          {
            label: imageRegistryType.External.label,
            value: imageRegistryType.External.value,
            displayField: <ImageSearch />,
          },
          {
            label: imageRegistryType.Internal.label,
            value: imageRegistryType.Internal.value,
            displayField: <ImageStream projects={projects} imageStreams={imageStreams} />,
          },
        ]}
      />
      <SearchStatus />
      <SearchResults />
    </FormSection>
  );
};

export default ImageSearchSection;
