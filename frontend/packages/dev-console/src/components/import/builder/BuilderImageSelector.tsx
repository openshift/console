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

  React.useEffect(() => {
    if (values.image.selected) {
      setFieldValue(
        'image.tag',
        _.get(builderImages, `${values.image.selected}.recentTag.name`, ''),
      );
      setFieldTouched('image.tag', true);
    }
  }, [values.image.selected, setFieldValue, setFieldTouched, builderImages]);

  const fieldId = getFieldId('image.name', 'selector');

  if (_.keys(builderImages).length === 1) {
    return (
      <ItemSelectorField
        itemList={builderImages}
        name="image.selected"
        loadingItems={loadingImageStream}
        recommended={values.image.recommended}
      />
    );
  }

  return (
    <FormGroup fieldId={fieldId} label="Builder Image">
      {values.image.isRecommending && (
        <>
          <LoadingInline /> Detecting recommended builder images...
        </>
      )}
      {values.image.recommended && (
        <>
          <Alert variant="success" title="Builder image(s) detected." isInline>
            Recommended builder images are represented by{' '}
            <StarIcon style={{ color: 'var(--pf-global--primary-color--100)' }} /> icon.
          </Alert>
          <br />
        </>
      )}
      {values.image.couldNotRecommend && (
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
