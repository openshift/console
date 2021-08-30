import * as React from 'react';
import { FormikValues, useFormikContext } from 'formik';
import { ImportStrategy, DetectedBuildType } from '@console/git-service';
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
      import: { showEditImportStrategy, strategies, selectedStrategy },
    },
    setFieldValue,
  } = useFormikContext<FormikValues>();

  const handleBuilderImageSelection = React.useCallback(
    async (detectedBuildTypes: DetectedBuildType[]) => {
      setFieldValue('image.isRecommending', false);
      const recommendedBuildType =
        builderImages &&
        detectedBuildTypes?.find(
          ({ type: recommended }) => recommended && builderImages.hasOwnProperty(recommended),
        );
      if (recommendedBuildType && recommendedBuildType.type) {
        setFieldValue('image.couldNotRecommend', false);
        setFieldValue('image.recommended', recommendedBuildType.type);
      } else {
        setFieldValue('image.couldNotRecommend', true);
        setFieldValue('image.recommended', '');
      }
    },
    [builderImages, setFieldValue],
  );

  React.useEffect(() => {
    if (builderImages && selectedStrategy.type === ImportStrategy.S2I) {
      strategies.forEach((s) => {
        if (s.type === ImportStrategy.S2I) {
          setFieldValue('image.isRecommending', true);
          setFieldValue('import.selectedStrategy.detectedCustomData', s.detectedCustomData);
          handleBuilderImageSelection(s.detectedCustomData);
        }
      });
    }
  }, [
    builderImages,
    handleBuilderImageSelection,
    selectedStrategy.type,
    setFieldValue,
    strategies,
  ]);

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
