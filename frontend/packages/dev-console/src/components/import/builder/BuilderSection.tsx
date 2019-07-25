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
    <React.Fragment>
      <FormSection title="Builder" fullWidth>
        <BuilderImageSelector loadingImageStream={!builderImages} builderImages={builderImages} />
      </FormSection>
      {image.tag && (
        <FormSection>
          <BuilderImageTagSelector
            selectedBuilderImage={builderImages[image.selected]}
            selectedImageTag={image.tag}
          />
        </FormSection>
      )}
    </React.Fragment>
  );
};

export default BuilderSection;
