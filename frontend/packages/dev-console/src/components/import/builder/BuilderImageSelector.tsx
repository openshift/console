import * as React from 'react';
import * as _ from 'lodash';
import { useFormikContext, FormikValues } from 'formik';
import { NormalizedBuilderImages } from '../../../utils/imagestream-utils';
import { ItemSelectorField } from '@console/shared';

export interface BuilderImageSelectorProps {
  loadingImageStream: boolean;
  builderImages: NormalizedBuilderImages;
}

const BuilderImageSelector: React.FC<BuilderImageSelectorProps> = ({
  loadingImageStream,
  builderImages,
}) => {
  const { values, setFieldValue, setFieldTouched } = useFormikContext<FormikValues>();
  const { isRecommending, recommended, couldNotRecommend } = values?.image;

  React.useEffect(() => {
    if (values.image.selected) {
      setFieldValue(
        'image.tag',
        _.get(builderImages, `${values.image.selected}.recentTag.name`, ''),
      );
      setFieldTouched('image.tag', true);
    }
  }, [values.image.selected, setFieldValue, setFieldTouched, builderImages]);

  return (
    <ItemSelectorField
      itemList={builderImages}
      name="image.selected"
      label="builder images"
      loadingItems={loadingImageStream}
      isRecommending={isRecommending}
      recommended={recommended}
      couldNotRecommend={couldNotRecommend}
    />
  );
};

export default BuilderImageSelector;
