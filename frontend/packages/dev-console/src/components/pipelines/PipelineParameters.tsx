import * as React from 'react';
import { Form, Button } from 'patternfly-react';
import { Formik } from 'formik';
import { Alert } from '@patternfly/react-core';
import * as yup from 'yup';
import * as _ from 'lodash';
import { ButtonBar } from '@console/internal/components/utils';
import { history } from '@console/internal/components/utils';
import { MultiColumnField, InputField } from '../formik-fields';
import { FormikProps, FormikValues } from 'formik';

export interface GitImportFormProps {}

const PipelineParameterForm: React.FC<FormikProps<FormikValues> & GitImportFormProps> = (props) => {
  console.log('form', props);
  const errorMessage = 'All fields are required';
  const success = 'hoechhe';
  return (
    <Form onReset={props.handleReset} onSubmit={props.handleSubmit}>
      <div className="co-m-pane__form">
        <MultiColumnField
          name="params"
          addLabel="Add Pipeline Params"
          headers={['Name', 'Description', 'Default Value']}
          emptyValues={{ name: '', description: '', default: '' }}
        >
          <InputField name="name" type="text" placeholder="Name" />
          <InputField name="description" type="text" placeholder="Description" />
          <InputField name="default" type="text" placeholder="Default Value" />
        </MultiColumnField>
        <hr />
        <ButtonBar inProgress={props.isSubmitting}>
          {props.dirty && !_.isEmpty(props.errors) && (
            <Alert isInline className="co-alert" variant="danger" title={errorMessage} />
          )}
          {props.dirty && _.isEmpty(props.errors) && (
            <Alert
              isInline
              className="co-alert"
              variant="info"
              title="The information on this page is no longer current."
            >
              Click Reload to update and lose edits, or Save Changes to overwrite.
            </Alert>
          )}
          {props.dirty && props.status === 'submitted' && (
            <Alert isInline className="co-alert" variant="success" title={success} />
          )}
          <Button
            disabled={!props.dirty || !_.isEmpty(props.errors)}
            type="submit"
            bsStyle="primary"
          >
            Save
          </Button>
          <Button type="reset">Reload</Button>
        </ButtonBar>
      </div>
    </Form>
  );
};

const PipelineParameters = ({ obj }) => {
  const initialValues = {
    name: 'pipeline-param',
    resources: _.get(obj.spec, 'params', []),
  };
  const handleSubmit = (values) => {
    console.log('mnk', values);
  };
  const validationSchema = yup.object().shape({
    name: yup.string().required('Required'),
    resources: yup.array().of(
      yup.object().shape({
        name: yup.string().required('Required'),
        description: yup.string().required('Required'),
        default: yup.string().required('Required'),
      }),
    ),
  });
  return (
    <div className="co-m-pane__body">
      <Formik
        initialValues={initialValues}
        onSubmit={handleSubmit}
        onReset={history.goBack}
        validationSchema={validationSchema}
        render={PipelineParameterForm}
      />
    </div>
  );
};

export default PipelineParameters;
