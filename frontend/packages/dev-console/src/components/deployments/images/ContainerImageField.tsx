import type { FC } from 'react';
import type { FormikValues } from 'formik';
import { useFormikContext } from 'formik';
import { useTranslation } from 'react-i18next';
import { CheckboxField, InputField } from '@console/shared/src';
import ImageStream from '../../import/image-search/ImageStream';

const ContainerImageField: FC = () => {
  const { t } = useTranslation();
  const {
    values: {
      formData: { fromImageStreamTag },
      formReloadCount,
    },
  } = useFormikContext<FormikValues>();
  return (
    <>
      <CheckboxField
        name="formData.fromImageStreamTag"
        label={t('devconsole~Deploy image from an image stream tag')}
      />
      {fromImageStreamTag ? (
        <ImageStream
          label={t('devconsole~Image stream tag')}
          formContextField="formData"
          reloadCount={formReloadCount}
          dataTest="image-stream-tag"
          required
        />
      ) : (
        <InputField
          name="formData.imageName"
          label={t('devconsole~Image Name')}
          helpText={t('devconsole~Container image name')}
          data-test="image-name"
          required
        />
      )}
    </>
  );
};

export default ContainerImageField;
