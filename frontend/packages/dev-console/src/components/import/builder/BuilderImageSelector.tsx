import * as React from 'react';
import * as _ from 'lodash';
import { useField, useFormikContext, FormikValues } from 'formik';
import { LoadingInline } from '@console/internal/components/utils';
import { FormGroup, FormHelperText } from '@patternfly/react-core';
import { CheckCircleIcon, StarIcon } from '@patternfly/react-icons';
import { NormalizedBuilderImages } from '../../../utils/imagestream-utils';
import { getFieldId } from '../../formik-fields/field-utils';
import BuilderImageCard from './BuilderImageCard';
import './BuilderImageSelector.scss';

export interface BuilderImageSelectorProps {
  loadingImageStream: boolean;
  loadingRecommendedImage?: boolean;
  builderImages: NormalizedBuilderImages;
}

const BuilderImageSelector: React.FC<BuilderImageSelectorProps> = ({
  loadingImageStream,
  loadingRecommendedImage,
  builderImages,
}) => {
  const [selected, { error: selectedError, touched: selectedTouched }] = useField('image.selected');
  const { values, setFieldValue, setFieldTouched, validateForm } = useFormikContext<FormikValues>();
  const builderImageCount = _.keys(builderImages).length;

  const handleImageChange = React.useCallback(
    (image: string) => {
      setFieldValue('image.selected', image);
      setFieldValue('image.tag', builderImages[image].recentTag.name);
      setFieldTouched('image.selected', true);
      setFieldTouched('image.tag', true);
      validateForm();
    },
    [setFieldValue, setFieldTouched, validateForm, builderImages],
  );

  React.useEffect(() => {
    if (!selected.value && builderImageCount === 1) {
      const image = _.find(builderImages);
      handleImageChange(image.name);
    }
  }, [builderImageCount, builderImages, handleImageChange, selected.value]);

  if (builderImageCount === 1) {
    return null;
  }

  const fieldId = getFieldId('image.name', 'selector');
  const isValid = !(selectedTouched && selectedError);
  const errorMessage = !isValid ? selectedError : '';
  return (
    <FormGroup
      fieldId={fieldId}
      label="Builder Image"
      helperTextInvalid={errorMessage}
      isValid={isValid}
      isRequired
    >
      {loadingRecommendedImage && <LoadingInline />}
      {values.image.recommended && (
        <React.Fragment>
          <CheckCircleIcon className="odc-builder-image-selector__success-icon" />
          <FormHelperText>
            Recommended builder images are represented by{' '}
            <StarIcon style={{ color: 'var(--pf-global--success-color--100)' }} /> icon
          </FormHelperText>
        </React.Fragment>
      )}
      {loadingImageStream ? (
        <LoadingInline />
      ) : (
        <div id="builder-image-selector-field" className="odc-builder-image-selector">
          {_.values(builderImages).map((image) => (
            <BuilderImageCard
              key={image.name}
              image={image}
              selected={selected.value === image.name}
              recommended={values.image.recommended === image.name}
              onChange={handleImageChange}
            />
          ))}
        </div>
      )}
    </FormGroup>
  );
};

export default BuilderImageSelector;
