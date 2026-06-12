import type { FC } from 'react';
import { TextInputTypes } from '@patternfly/react-core';
import { useField } from 'formik';
import { useTranslation } from 'react-i18next';
import { DropdownField } from '@console/shared/src/components/formik-fields/DropdownField';
import { InputField } from '@console/shared/src/components/formik-fields/InputField';
import type { TriggersAndImageStreamFormData } from '../../deployments/utils/deployment-types';
import ImageStream from '../../import/image-search/ImageStream';
import FormSection from '../../import/section/FormSection';
import { BuildStrategyType } from '../types';

export type ImageOptionType = 'none' | 'imageStreamTag' | 'imageStreamImage' | 'dockerImage';

export type ImageOptionFormData = {
  type: ImageOptionType;
  imageStreamTag: TriggersAndImageStreamFormData;
  imageStreamImage: string;
  dockerImage: string;
};

export type ImagesSectionFormData = {
  formData: {
    images: {
      strategyType?: BuildStrategyType;
      buildFrom: ImageOptionFormData;
      pushTo: ImageOptionFormData;
    };
  };
};

const ImageOption: FC<{
  fieldPrefix: string;
  label: string;
  fallbackTitle: string;
  items: Record<string, string>;
  dataTest: string;
  required?: boolean;
}> = ({ fieldPrefix, label, fallbackTitle, items, dataTest, required }) => {
  const { t } = useTranslation('devconsole');
  const [{ value: type }] = useField<ImageOptionType>(`${fieldPrefix}.type`);

  return (
    <FormSection data-test={dataTest}>
      <DropdownField
        name={`${fieldPrefix}.type`}
        label={label}
        items={items}
        title={items[type] || fallbackTitle}
        dataTest={`${dataTest} type`}
        required={required}
      />

      {type === 'imageStreamTag' ? (
        <ImageStream
          label={t('Image stream tag')}
          formContextField={`${fieldPrefix}.imageStreamTag`}
          dataTest={`${dataTest} image-stream-tag`}
          required
        />
      ) : null}

      {type === 'imageStreamImage' ? (
        <InputField
          label={t('Image stream image')}
          name={`${fieldPrefix}.imageStreamImage`}
          type={TextInputTypes.text}
          data-test={`${dataTest} image-stream-image`}
          required
        />
      ) : null}

      {type === 'dockerImage' ? (
        <InputField
          label={t('Image registry')}
          name={`${fieldPrefix}.dockerImage`}
          type={TextInputTypes.text}
          data-test={`${dataTest} docker-image`}
          required
        />
      ) : null}
    </FormSection>
  );
};

const ImagesSection: FC<{}> = () => {
  const { t } = useTranslation('devconsole');
  const [{ value: strategyType }] = useField<BuildStrategyType>('formData.images.strategyType');

  const buildFromItems: Record<string, string> =
    strategyType === BuildStrategyType.Docker
      ? {
          none: t('None'),
          imageStreamTag: t('Image Stream Tag'),
          imageStreamImage: t('Image Stream Image'),
          dockerImage: t('External container image'),
        }
      : {
          imageStreamTag: t('Image Stream Tag'),
          imageStreamImage: t('Image Stream Image'),
          dockerImage: t('External container image'),
        };

  const pushToItems = {
    none: t('None'),
    imageStreamTag: t('Image Stream Tag'),
    dockerImage: t('External container image'),
  };

  return (
    <FormSection title={t('Images')} dataTest="section images">
      <ImageOption
        fieldPrefix="formData.images.buildFrom"
        label={t('Build from')}
        fallbackTitle={t('Please select')}
        items={buildFromItems}
        dataTest="build-from"
        required
      />
      <ImageOption
        fieldPrefix="formData.images.pushTo"
        label={t('Push to')}
        fallbackTitle={t('Please select')}
        items={pushToItems}
        dataTest="push-to"
      />
    </FormSection>
  );
};

export default ImagesSection;
