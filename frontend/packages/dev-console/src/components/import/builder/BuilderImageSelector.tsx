import * as React from 'react';
import * as _ from 'lodash';
import { useField, useFormikContext, FormikValues } from 'formik';
import { LoadingInline } from '@console/internal/components/utils';
import { FormGroup, ControlLabel, HelpBlock } from 'patternfly-react';
import { CheckCircleIcon, StarIcon } from '@patternfly/react-icons';
import { NormalizedBuilderImages } from '../../../utils/imagestream-utils';
import { getValidationState } from '../../formik-fields/field-utils';
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
    if (builderImageCount === 1) {
      const image = _.find(builderImages);
      handleImageChange(image.name);
    }
  }, [builderImageCount, builderImages, handleImageChange]);

  if (builderImageCount === 1) {
    return null;
  }

  return (
    <FormGroup
      controlId="builder-image-selector-field"
      validationState={getValidationState(selectedError, selectedTouched)}
    >
      <ControlLabel className="co-required">Builder Image</ControlLabel>
      {loadingRecommendedImage && <LoadingInline />}
      {values.image.recommended && (
        <React.Fragment>
          <CheckCircleIcon className="odc-builder-image-selector__success-icon" />
          <HelpBlock>
            Recommended builder images are represented by{' '}
            <StarIcon style={{ color: 'var(--pf-global--success-color--100)' }} /> icon
          </HelpBlock>
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
      {selectedTouched && selectedError && <HelpBlock>{selectedError}</HelpBlock>}
    </FormGroup>
  );
};

export default BuilderImageSelector;
