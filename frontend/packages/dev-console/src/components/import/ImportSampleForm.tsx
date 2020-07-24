import * as React from 'react';
import * as _ from 'lodash';
import { FormikProps, FormikValues } from 'formik';
import { FormFooter } from '@console/shared/src/components/form-utils';
import { Form, TextInputTypes } from '@patternfly/react-core';
import { BuilderImage } from '../../utils/imagestream-utils';
import BuilderImageTagSelector from './builder/BuilderImageTagSelector';
import { InputField } from '@console/shared';
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
  dirty,
}) => {
  const {
    image: { tag: selectedImagetag },
  } = values;
  return (
    <Form onSubmit={handleSubmit}>
      <FormSection>
        <InputField
          type={TextInputTypes.text}
          name="name"
          label="Name"
          helpText="A unique name given to the component that will be used to name associated resources."
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
          label="Git Repo URL"
          data-test-id="git-form-input-url"
          isDisabled
        />
      </FormSection>
      <FormFooter
        handleReset={handleReset}
        errorMessage={status && status.submitError}
        isSubmitting={isSubmitting}
        submitLabel="Create"
        disableSubmit={!dirty || !_.isEmpty(errors)}
        resetLabel="Cancel"
        sticky
      />
    </Form>
  );
};

export default ImportSampleForm;
