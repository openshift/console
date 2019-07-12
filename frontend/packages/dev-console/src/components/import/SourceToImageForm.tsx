import * as React from 'react';
import * as _ from 'lodash';
import { Form, Button } from 'patternfly-react';
import { FormikProps, FormikValues } from 'formik';
import { ButtonBar } from '@console/internal/components/utils';
import { NormalizedBuilderImages } from '../../utils/imagestream-utils';
import GitSection from './git/GitSection';
import BuilderSection from './builder/BuilderSection';
import AppSection from './app/AppSection';
import AdvancedSection from './advanced/AdvancedSection';
import ServerlessSection from './serverless/ServerlessSection';

export interface SourceToImageFormProps {
  builderImages?: NormalizedBuilderImages;
}

const SourceToImageForm: React.FC<FormikProps<FormikValues> & SourceToImageFormProps> = ({
  values,
  errors,
  handleSubmit,
  handleReset,
  builderImages,
  status,
  isSubmitting,
  dirty,
}) => (
  <Form onReset={handleReset} onSubmit={handleSubmit}>
    <div className="co-m-pane__form">
      <AppSection project={values.project} />
      <ServerlessSection />
      <BuilderSection image={values.image} builderImages={builderImages} />
      <GitSection project={values.project} showSample />
      <AdvancedSection values={values} />
    </div>
    <br />
    <ButtonBar errorMessage={status && status.submitError} inProgress={isSubmitting}>
      <Button disabled={!dirty || !_.isEmpty(errors)} type="submit" bsStyle="primary">
        Create
      </Button>
      <Button type="reset">Cancel</Button>
    </ButtonBar>
  </Form>
);

export default SourceToImageForm;
