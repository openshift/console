import * as React from 'react';
import { TextInputTypes } from '@patternfly/react-core';
import { FormikProps, FormikValues } from 'formik';
import * as _ from 'lodash';
import { useTranslation } from 'react-i18next';
import { InputField, FormBody } from '@console/shared';
import { FormFooter } from '@console/shared/src/components/form-utils';
import { BuilderImage } from '../../utils/imagestream-utils';
import BuilderImageTagSelector from './builder/BuilderImageTagSelector';
import FormSection from './section/FormSection';

type ImportSampleFormProps = {
  builderImage: BuilderImage;
};

type Props = FormikProps<FormikValues> & ImportSampleFormProps;

const ImportSampleForm: React.FC<Props> = ({
  values,
  errors,
  handleSubmit,
  handleReset,
  builderImage,
  status,
  isSubmitting,
}) => {
  const { t } = useTranslation();
  const {
    image: { tag: selectedImagetag },
  } = values;
  return (
    <form onSubmit={handleSubmit}>
      <FormBody style={{ marginTop: 0 }}>
        <FormSection>
          <InputField
            type={TextInputTypes.text}
            name="name"
            label={t('devconsole~Name')}
            helpText={t(
              'devconsole~A unique name given to the component that will be used to name associated resources.',
            )}
            data-test-id="application-form-app-name"
            required
          />
          <BuilderImageTagSelector
            selectedBuilderImage={builderImage}
            selectedImageTag={selectedImagetag}
          />
          <InputField
            type={TextInputTypes.text}
            name="git.url"
            label={t('devconsole~Git repo URL')}
            data-test-id="git-form-input-url"
            isDisabled
          />
        </FormSection>
      </FormBody>
      <FormFooter
        handleReset={handleReset}
        errorMessage={status && status.submitError}
        isSubmitting={isSubmitting}
        submitLabel={t('devconsole~Create')}
        disableSubmit={!_.isEmpty(errors) || isSubmitting}
        resetLabel={t('devconsole~Cancel')}
        sticky
      />
    </form>
  );
};

export default ImportSampleForm;
