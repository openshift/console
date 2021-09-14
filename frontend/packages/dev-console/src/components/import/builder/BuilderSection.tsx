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
      import: { showEditImportStrategy, strategies, recommendedStrategy },
    },
    setFieldValue,
  } = useFormikContext<FormikValues>();

  const handleBuilderImageSelection = React.useCallback(
    async (detectedBuildTypes?: DetectedBuildType[]) => {
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
    if (builderImages && recommendedStrategy && recommendedStrategy.type !== ImportStrategy.S2I) {
      const s2iStrategy = strategies.find((s) => s.type === ImportStrategy.S2I);
      if (s2iStrategy) {
        setFieldValue('image.isRecommending', true);
        setFieldValue('import.selectedStrategy.detectedCustomData', s2iStrategy.detectedCustomData);
        handleBuilderImageSelection(s2iStrategy.detectedCustomData);
      }
      image.selected
        ? setFieldValue('import.strategyChanged', true)
        : setFieldValue('import.strategyChanged', false);
    }
  }, [
    builderImages,
    handleBuilderImageSelection,
    image.selected,
    recommendedStrategy,
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
