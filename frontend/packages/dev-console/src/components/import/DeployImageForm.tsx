import * as React from 'react';
import * as _ from 'lodash';
import { Form, Button } from 'patternfly-react';
import { FormikProps, FormikValues } from 'formik';
import { ButtonBar } from '@console/internal/components/utils';
import { NormalizedBuilderImages } from '../../utils/imagestream-utils';
import ImageSearchSection from './image-search/ImageSearchSection';
import AppSection from './app/AppSection';
import AdvancedSection from './advanced/AdvancedSection';
import ServerlessSection from './serverless/ServerlessSection';
import RouteCheckbox from './route/RouteCheckbox';

export interface DeployImageFormProps {
  builderImages?: NormalizedBuilderImages;
}

const DeployImageForm: React.FC<FormikProps<FormikValues> & DeployImageFormProps> = ({
  values,
  errors,
  handleSubmit,
  handleReset,
  status,
  isSubmitting,
  dirty,
}) => (
  <Form
    className="co-deploy-image"
    onSubmit={handleSubmit}
    onReset={handleReset}
    onKeyPress={(event: KeyboardEvent) => {
      if (event.which === 13 /* Enter */) {
        event.preventDefault();
      }
    }}
  >
    <div className="co-m-pane__form">
      <AppSection project={values.project} />
      <ImageSearchSection />
      <ServerlessSection />
      <RouteCheckbox />
      <AdvancedSection values={values} />
    </div>
    <br />
    <ButtonBar errorMessage={status && status.submitError} inProgress={isSubmitting}>
      <Button
        type="submit"
        disabled={!dirty || !_.isEmpty(errors)}
        bsStyle="primary"
        data-test-id="deploy-image-form-submit-btn"
      >
        Deploy
      </Button>
      <Button type="reset">Cancel</Button>
    </ButtonBar>
  </Form>
);

export default DeployImageForm;
