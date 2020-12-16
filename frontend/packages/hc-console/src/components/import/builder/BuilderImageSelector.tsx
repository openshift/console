import * as React from 'react';
import * as _ from 'lodash';
import { useFormikContext, FormikValues } from 'formik';
import { LoadingInline } from '@console/internal/components/utils';
import { FormGroup, Alert } from '@patternfly/react-core';
import { StarIcon } from '@patternfly/react-icons';
import { getFieldId, ItemSelectorField } from '@console/shared';
import { NormalizedBuilderImages } from '../../../utils/imagestream-utils';

export interface BuilderImageSelectorProps {
  loadingImageStream: boolean;
  builderImages: NormalizedBuilderImages;
}

const BuilderImageSelector: React.FC<BuilderImageSelectorProps> = ({
  loadingImageStream,
  builderImages,
}) => {
  const { values, setFieldValue, setFieldTouched } = useFormikContext<FormikValues>();
  const { selected, recommended, isRecommending, couldNotRecommend } = values.image;

  React.useEffect(() => {
    if (selected) {
      setFieldValue('image.tag', _.get(builderImages, `${selected}.recentTag.name`, ''));
      setFieldTouched('image.tag', true);
    }
  }, [selected, setFieldValue, setFieldTouched, builderImages]);

  const fieldId = getFieldId('image.name', 'selector');

  if (_.keys(builderImages).length === 1) {
    return (
      <ItemSelectorField
        itemList={builderImages}
        name="image.selected"
        loadingItems={loadingImageStream}
        recommended={recommended}
      />
    );
  }

  return (
    <FormGroup fieldId={fieldId} label="Builder Image">
      {isRecommending && (
        <>
          <LoadingInline /> Detecting recommended builder images...
        </>
      )}
      {recommended && builderImages.hasOwnProperty(recommended) && (
        <>
          <Alert variant="success" title="Builder image(s) detected." isInline>
            Recommended builder images are represented by{' '}
            <StarIcon style={{ color: 'var(--pf-global--primary-color--100)' }} /> icon.
          </Alert>
          <br />
        </>
      )}
      {(couldNotRecommend || (recommended && !builderImages.hasOwnProperty(recommended))) && (
        <>
          <Alert variant="warning" title="Unable to detect the builder image." isInline>
            Select the most appropriate one from the list to continue.
          </Alert>
          <br />
        </>
      )}
      <ItemSelectorField
        itemList={builderImages}
        name="image.selected"
        loadingItems={loadingImageStream}
        recommended={values.image.recommended}
      />
    </FormGroup>
  );
};

export default BuilderImageSelector;
