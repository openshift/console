import type { FC } from 'react';
import type { FormikValues } from 'formik';
import { useFormikContext } from 'formik';
import { useTranslation } from 'react-i18next';
import { CheckboxField } from '@console/shared/src/components/formik-fields/CheckboxField';
import { InputField } from '@console/shared/src/components/formik-fields/InputField';
import ImageStream from '../../import/image-search/ImageStream';

const ContainerImageField: FC = () => {
  const { t } = useTranslation('devconsole');
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
        label={t('Deploy image from an image stream tag')}
      />
      {fromImageStreamTag ? (
        <ImageStream
          label={t('Image stream tag')}
          formContextField="formData"
          reloadCount={formReloadCount}
          dataTest="image-stream-tag"
          required
        />
      ) : (
        <InputField
          name="formData.imageName"
          label={t('Image Name')}
          helpText={t('Container image name')}
          data-test="image-name"
          required
        />
      )}
    </>
  );
};

export default ContainerImageField;
