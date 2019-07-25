import * as React from 'react';
import { NormalizedBuilderImages } from '../../../utils/imagestream-utils';
import { ImageData } from '../import-types';
import FormSection from '../section/FormSection';
import BuilderImageSelector from './BuilderImageSelector';
import BuilderImageTagSelector from './BuilderImageTagSelector';

export interface ImageSectionProps {
  image: ImageData;
  builderImages: NormalizedBuilderImages;
}

const BuilderSection: React.FC<ImageSectionProps> = ({ image, builderImages }) => {
  if (!builderImages) {
    return null;
  }

  return (
    <FormSection title="Builder" fullWidth>
      <BuilderImageSelector loadingImageStream={!builderImages} builderImages={builderImages} />
      {image.tag && (
        <BuilderImageTagSelector
          selectedBuilderImage={builderImages[image.selected]}
          selectedImageTag={image.tag}
        />
      )}
    </FormSection>
  );
};

export default BuilderSection;
