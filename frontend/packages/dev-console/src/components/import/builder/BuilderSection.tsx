import * as React from 'react';
import { FormikValues, useFormikContext } from 'formik';
import { PipelineKind } from '@console/pipelines-plugin/src/types';
import { NormalizedBuilderImages } from '../../../utils/imagestream-utils';
import FormSection from '../section/FormSection';
import BuilderImageSelector from './BuilderImageSelector';
import BuilderImageTagSelector from './BuilderImageTagSelector';

export interface ImageSectionProps {
  builderImages: NormalizedBuilderImages;
  existingPipeline?: PipelineKind;
}

const BuilderSection: React.FC<ImageSectionProps> = ({ builderImages, existingPipeline }) => {
  const {
    values: {
      image,
      import: { showEditImportStrategy },
    },
  } = useFormikContext<FormikValues>();
  if (!builderImages) {
    return null;
  }

  return (
    <>
      <FormSection fullWidth style={!showEditImportStrategy ? { display: 'none' } : {}}>
        <BuilderImageSelector
          loadingImageStream={!builderImages}
          builderImages={builderImages}
          existingPipeline={existingPipeline}
        />
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
