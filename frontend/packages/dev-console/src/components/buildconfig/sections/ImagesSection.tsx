import * as React from 'react';
import { TextInputTypes } from '@patternfly/react-core';
import { useField } from 'formik';
import { useTranslation } from 'react-i18next';
import { DropdownField, InputField } from '@console/shared';
import { TriggersAndImageStreamFormData } from '../../edit-deployment/utils/edit-deployment-types';
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

const ImageOption: React.FC<{
  fieldPrefix: string;
  label: string;
  fallbackTitle: string;
  items: Record<string, string>;
  dataTest: string;
}> = ({ fieldPrefix, label, fallbackTitle, items, dataTest }) => {
  const { t } = useTranslation();
  const [{ value: type }] = useField<ImageOptionType>(`${fieldPrefix}.type`);

  return (
    <FormSection data-test={dataTest}>
      <DropdownField
        name={`${fieldPrefix}.type`}
        label={label}
        items={items}
        title={items[type] || fallbackTitle}
        dataTest={`${dataTest} type`}
      />

      {type === 'imageStreamTag' ? (
        <ImageStream
          label={t('devconsole~Image stream tag')}
          formContextField={`${fieldPrefix}.imageStreamTag`}
          dataTest={`${dataTest} image-stream-tag`}
          required
        />
      ) : null}

      {type === 'imageStreamImage' ? (
        <InputField
          label={t('devconsole~Image stream image')}
          name={`${fieldPrefix}.imageStreamImage`}
          type={TextInputTypes.text}
          data-test={`${dataTest} image-stream-image`}
          required
        />
      ) : null}

      {type === 'dockerImage' ? (
        <InputField
          label={t('devconsole~Docker image repository')}
          name={`${fieldPrefix}.dockerImage`}
          type={TextInputTypes.text}
          data-test={`${dataTest} docker-image`}
          required
        />
      ) : null}
    </FormSection>
  );
};

const ImagesSection: React.FC<{}> = () => {
  const { t } = useTranslation();
  const [{ value: strategyType }] = useField<BuildStrategyType>('formData.images.strategyType');

  const buildFromItems: Record<string, string> =
    strategyType === BuildStrategyType.Docker
      ? {
          none: t('devconsole~None'),
          imageStreamTag: t('devconsole~Image Stream Tag'),
          imageStreamImage: t('devconsole~Image Stream Image'),
          dockerImage: t('devconsole~Docker image'),
        }
      : {
          imageStreamTag: t('devconsole~Image Stream Tag'),
          imageStreamImage: t('devconsole~Image Stream Image'),
          dockerImage: t('devconsole~Docker image'),
        };

  const pushToItems = {
    none: t('devconsole~None'),
    imageStreamTag: t('devconsole~Image Stream Tag'),
    dockerImage: t('devconsole~Docker image'),
  };

  return (
    <FormSection title={t('devconsole~Images')} dataTest="section images">
      <ImageOption
        fieldPrefix="formData.images.buildFrom"
        label={t('devconsole~Build from')}
        fallbackTitle={t('devconsole~Please select')}
        items={buildFromItems}
        dataTest="build-from"
      />
      <ImageOption
        fieldPrefix="formData.images.pushTo"
        label={t('devconsole~Push to')}
        fallbackTitle={t('devconsole~Please select')}
        items={pushToItems}
        dataTest="push-to"
      />
    </FormSection>
  );
};

export default ImagesSection;
