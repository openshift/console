import * as React from 'react';
import * as _ from 'lodash';
import { FormikProps, FormikValues } from 'formik';
import { ModalTitle, ModalBody, ModalSubmitFooter } from '@console/internal/components/factory';
import { BuildStrategyType } from '@console/internal/components/build';
import GitSection from '../import/git/GitSection';
import BuilderSection from '../import/builder/BuilderSection';
import DockerSection from '../import/git/DockerSection';
import AdvancedSection from '../import/advanced/AdvancedSection';
import AppSection from '../import/app/AppSection';
import { NormalizedBuilderImages } from '../../utils/imagestream-utils';

export interface EditApplicationFormProps {
  builderImages?: NormalizedBuilderImages;
}

const EditApplicationForm: React.FC<FormikProps<FormikValues> & EditApplicationFormProps> = ({
  handleSubmit,
  handleReset,
  values,
  builderImages,
  dirty,
  errors,
  status,
  isSubmitting,
}) => (
  <form className="modal-content" onSubmit={handleSubmit}>
    <ModalTitle>Edit Application</ModalTitle>
    <ModalBody>
      {!_.isEmpty(values.build.strategy) && <GitSection />}
      {values.build.strategy === BuildStrategyType.Source && (
        <BuilderSection image={values.image} builderImages={builderImages} />
      )}
      {values.build.strategy === BuildStrategyType.Docker && (
        <DockerSection buildStrategy={values.build.strategy} />
      )}
      <AppSection project={values.project} />
      <AdvancedSection values={values} />
    </ModalBody>
    <ModalSubmitFooter
      submitText="Save"
      submitDisabled={!dirty || !_.isEmpty(errors)}
      cancel={handleReset}
      inProgress={isSubmitting}
      errorMessage={status && status.submitError}
    />
  </form>
);

export default EditApplicationForm;
