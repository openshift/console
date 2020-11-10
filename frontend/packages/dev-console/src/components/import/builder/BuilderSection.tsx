import * as React from 'react';
import { useTranslation } from 'react-i18next';
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
  const { t } = useTranslation();
  if (!builderImages) {
    return null;
  }

  return (
    <>
      <FormSection title={t('devconsole~Builder')} fullWidth>
        <BuilderImageSelector loadingImageStream={!builderImages} builderImages={builderImages} />
      </FormSection>
      {builderImages[image.selected] && image.tag && (
        <FormSection>
          <BuilderImageTagSelector
            selectedBuilderImage={builderImages[image.selected]}
            selectedImageTag={image.tag}
          />
        </FormSection>
      )}
    </>
  );
};

export default BuilderSection;
