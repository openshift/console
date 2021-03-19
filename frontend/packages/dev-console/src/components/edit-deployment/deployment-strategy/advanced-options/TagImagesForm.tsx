import * as React from 'react';
import { useTranslation } from 'react-i18next';
import { useFormikContext, FormikValues } from 'formik';
import { DropdownField } from '@console/shared/src';
import ImageStream from '../../../import/image-search/ImageStream';

const TagImagesForm: React.FC<{ lifecycleHook: string }> = ({ lifecycleHook }) => {
  const { t } = useTranslation();
  const {
    values: {
      containers,
      deploymentStrategy: { data },
    },
  } = useFormikContext<FormikValues>();
  const tagImages = 'tagImages[]';
  return (
    <>
      <DropdownField
        name={`deploymentStrategy.data.${lifecycleHook}.${tagImages}.containerName`}
        label={t('devconsole~Container name')}
        items={containers}
        selectedKey={data[lifecycleHook][tagImages].containerName}
        required
      />
      <ImageStream label={t('devconsole~Tag as')} required />
    </>
  );
};

export default TagImagesForm;
