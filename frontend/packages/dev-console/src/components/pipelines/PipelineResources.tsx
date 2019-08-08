import * as React from 'react';
import { Form, Button } from 'patternfly-react';
import { Formik } from 'formik';
import { Alert, TextInputTypes } from '@patternfly/react-core';
import * as yup from 'yup';
import * as _ from 'lodash';
import { ButtonBar } from '@console/internal/components/utils';
import { history } from '@console/internal/components/utils';
import { MultiColumnField, InputField, DropdownField } from '../formik-fields';
import { FormikProps, FormikValues } from 'formik';
import { k8sUpdate } from '@console/internal/module/k8s';
import { PipelineModel } from '../../models';

export interface PipelineResourceFormProps {}

const PipelineResourceForm: React.FC<FormikProps<FormikValues> & PipelineResourceFormProps> = (
  props,
) => {
  console.log('form', props);
  const errorMessage = 'All fields are required';
  enum itemTypes {
    '' = 'Please choose Git type',
    git = 'Git',
    image = 'Image',
  }
  return (
    <Form onReset={props.handleReset} onSubmit={props.handleSubmit}>
      <div className="co-m-pane__form">
        <MultiColumnField
          name="resources"
          addLabel="Add Pipeline Resources"
          headers={['Name', 'GitTypes']}
          emptyValues={{ name: '', type: '' }}
        >
          <InputField name="name" type={TextInputTypes.text} placeholder="Name" />
          <DropdownField name="type" items={itemTypes} fullWidth />
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
          {props.dirty && props.isSubmitting && (
            <Alert isInline className="co-alert" variant="success" title={"Saving..."} />
          )}
          {props.dirty && props.status === 'success'&& (
            <Alert isInline className="co-alert" variant="success" title={props.status.success} />
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

const PipelineResources = ({ obj }) => {
  console.log('resource', obj);
  const initialValues = {
    name: 'pipeline-resources',
    resources: _.get(obj.spec, 'resources', []),
  };
  const handleSubmit = (values, actions) => {
    actions.setSubmitting(true);
    k8sUpdate(
      PipelineModel,
      { ...obj, spec: { ...obj.spec, resources: values.resources } },
      obj.metadata.namespace,
      obj.metadata.name,
    ).then(() => {
      actions.setSubmitting(false);
      actions.setStatus({ success: 'Pipeline Resources updated !' });
    });
  };
  const validationSchema = yup.object().shape({
    name: yup.string().required('Required'),
    resources: yup.array().of(
      yup.object().shape({
        name: yup.string().required('Required'),
        type: yup.string().required('Required'),
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
        render={PipelineResourceForm}
      />
    </div>
  );
};

export default PipelineResources;
