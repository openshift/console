import * as React from 'react';
import * as _ from 'lodash';
import { useField, useFormikContext, FormikValues } from 'formik';
import { LoadingInline } from '@console/internal/components/utils';
import { FormGroup, Alert } from '@patternfly/react-core';
import { StarIcon } from '@patternfly/react-icons';
import { getFieldId } from '@console/shared';
import { NormalizedBuilderImages } from '../../../utils/imagestream-utils';
import SelectorCard from './SelectorCard';
import './BuilderImageSelector.scss';

export interface BuilderImageSelectorProps {
  loadingImageStream: boolean;
  builderImages: NormalizedBuilderImages;
}

const BuilderImageSelector: React.FC<BuilderImageSelectorProps> = ({
  loadingImageStream,
  builderImages,
}) => {
  const [selected, { error: selectedError, touched: selectedTouched }] = useField('image.selected');
  const { values, setFieldValue, setFieldTouched, validateForm } = useFormikContext<FormikValues>();
  const builderImageCount = _.keys(builderImages).length;

  const handleImageChange = React.useCallback(
    (image: string) => {
      setFieldValue('image.selected', image);
      setFieldValue('image.tag', _.get(builderImages, `${image}.recentTag.name`, ''));
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
    if (!selected.value && values.image.recommended) {
      handleImageChange(values.image.recommended);
    }
  }, [
    builderImageCount,
    builderImages,
    handleImageChange,
    selected.value,
    values.image.recommended,
  ]);

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
      {values.image.isRecommending && (
        <>
          <LoadingInline /> Detecting recommended builder images...
        </>
      )}
      {values.image.recommended && (
        <Alert variant="success" title="Builder image(s) detected." isInline>
          Recommended builder images are represented by{' '}
          <StarIcon style={{ color: 'var(--pf-global--primary-color--100)' }} /> icon.
        </Alert>
      )}
      {values.image.couldNotRecommend && (
        <Alert variant="warning" title="Unable to detect the builder image." isInline>
          Select the most appropriate one from the list to continue.
        </Alert>
      )}
      <br />
      {loadingImageStream ? (
        <LoadingInline />
      ) : (
        <div id="builder-image-selector-field" className="odc-builder-image-selector">
          {_.values(builderImages).map((image) => (
            <SelectorCard
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
