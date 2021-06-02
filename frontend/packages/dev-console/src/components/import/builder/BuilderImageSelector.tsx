import * as React from 'react';
import { FormGroup, Alert } from '@patternfly/react-core';
import { StarIcon } from '@patternfly/react-icons';
import { useFormikContext, FormikValues } from 'formik';
import * as _ from 'lodash';
import { Trans, useTranslation } from 'react-i18next';
import { LoadingInline } from '@console/internal/components/utils';
import { PIPELINE_RUNTIME_LABEL } from '@console/pipelines-plugin/src/const';
import { PipelineKind } from '@console/pipelines-plugin/src/types';
import { getFieldId, ItemSelectorField } from '@console/shared';
import { NormalizedBuilderImages } from '../../../utils/imagestream-utils';

export interface BuilderImageSelectorProps {
  loadingImageStream: boolean;
  builderImages: NormalizedBuilderImages;
  existingPipeline?: PipelineKind;
}

const PipelineChangeAlert = (alertMessage: string) => (
  <>
    <Alert isInline variant="info" title={alertMessage} />
    <br />
  </>
);

const BuilderImageSelector: React.FC<BuilderImageSelectorProps> = ({
  loadingImageStream,
  builderImages,
  existingPipeline,
}) => {
  const { t } = useTranslation();
  const {
    values: { pipeline, image },
    setFieldValue,
    setFieldTouched,
    validateForm,
  } = useFormikContext<FormikValues>();
  const { selected, recommended, isRecommending, couldNotRecommend, tag } = image;
  const [showPipelineWarning, setShowPipelineWarning] = React.useState(false);

  const isPipelineAttached = !_.isEmpty(existingPipeline);

  React.useEffect(() => {
    if (selected && !tag) {
      setFieldValue('image.tag', builderImages?.[selected]?.recentTag?.name ?? '');
      setFieldTouched('image.tag', true);
    }
  }, [selected, setFieldValue, setFieldTouched, builderImages, tag]);

  const fieldId = getFieldId('image.name', 'selector');
  const imageName = builderImages?.[selected]?.title || t('devconsole~this Builder Image');

  const changedPipelineWarning = pipeline.template
    ? pipeline.template.metadata?.labels[PIPELINE_RUNTIME_LABEL] !==
        existingPipeline?.metadata?.labels[PIPELINE_RUNTIME_LABEL] &&
      PipelineChangeAlert(
        t(
          'devconsole~Changing to this builder image will update your associated Pipeline and remove any customization you may have applied.',
        ),
      )
    : PipelineChangeAlert(
        t(
          'devconsole~There are no supported pipelines available for {{builderImage}}. Changing to this builder image will disconnect your associated Pipeline.',
          { builderImage: imageName },
        ),
      );

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
    <FormGroup fieldId={fieldId} label={t('devconsole~Builder Image')}>
      {isRecommending && !recommended && (
        <>
          <LoadingInline /> {t('devconsole~Detecting recommended Builder Images...')}
        </>
      )}
      {recommended && builderImages.hasOwnProperty(recommended) && (
        <>
          <Alert variant="success" title={t('devconsole~Builder Image(s) detected.')} isInline>
            <Trans ns="devconsole" t={t}>
              Recommended Builder Images are represented by{' '}
              <StarIcon style={{ color: 'var(--pf-global--primary-color--100)' }} /> icon.
            </Trans>
          </Alert>
          <br />
        </>
      )}
      {(couldNotRecommend || (recommended && !builderImages.hasOwnProperty(recommended))) && (
        <>
          <Alert
            variant="warning"
            title={t('devconsole~Unable to detect the Builder Image.')}
            isInline
          >
            {t('devconsole~Select the most appropriate one from the list to continue.')}
          </Alert>
          <br />
        </>
      )}
      {showPipelineWarning && changedPipelineWarning}
      <ItemSelectorField
        itemList={builderImages}
        name="image.selected"
        loadingItems={loadingImageStream}
        recommended={image.recommended}
        onSelect={() => {
          setFieldValue('image.tag', '', false);
          setFieldTouched('image.tag', true);
          if (isPipelineAttached) {
            setShowPipelineWarning(true);
          }
          validateForm();
        }}
      />
    </FormGroup>
  );
};

export default BuilderImageSelector;
