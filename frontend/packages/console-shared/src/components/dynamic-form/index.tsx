import * as _ from 'lodash';
import * as React from 'react';
import Form, { FormProps } from 'react-jsonschema-form';
import { Accordion, ActionGroup, Button, Alert } from '@patternfly/react-core';
import { history } from '@console/internal/components/utils';
import defaultWidgets from './widgets';
import defaultFields from './fields';
import {
  FieldTemplate as DefaultFieldTemplate,
  ObjectFieldTemplate as DefaultObjectFieldTemplate,
  ArrayFieldTemplate as DefaultArrayFieldTemplate,
  ErrorTemplate as DefaultErrorTemplate,
} from './templates';
import { K8S_UI_SCHEMA } from './const';
import { getSchemaErrors } from './utils';
import './styles.scss';

export const DynamicForm: React.FC<DynamicFormProps> = ({
  ArrayFieldTemplate = DefaultArrayFieldTemplate,
  errors = [],
  ErrorTemplate = DefaultErrorTemplate,
  fields = {},
  FieldTemplate = DefaultFieldTemplate,
  formContext,
  formData = {},
  noValidate = false,
  ObjectFieldTemplate = DefaultObjectFieldTemplate,
  onChange = _.noop,
  onError = _.noop,
  onSubmit = _.noop,
  schema,
  uiSchema = {},
  widgets = {},
}) => {
  const schemaErrors = getSchemaErrors(schema);
  // IF the top level schema is unsupported, don't render a form at all.
  if (schemaErrors.length) {
    // eslint-disable-next-line no-console
    console.warn('A form could not be generated for this resource.', schemaErrors);
    return (
      <Alert
        isInline
        className="co-alert co-break-word"
        variant="info"
        title={'A form is not available for this resource. Please use the YAML View.'}
      />
    );
  }
  return (
    <>
      <Alert
        isInline
        className="co-alert co-break-word"
        variant="info"
        title={
          'Note: Some fields may not be represented in this form. Please select "YAML View" for full control of object creation.'
        }
      />
      <Accordion asDefinitionList={false} className="co-dynamic-form__accordion">
        <Form
          className="co-dynamic-form"
          noValidate={noValidate}
          ArrayFieldTemplate={ArrayFieldTemplate}
          fields={{ ...defaultFields, ...fields }}
          FieldTemplate={FieldTemplate}
          formContext={formContext}
          formData={formData}
          noHtml5Validate
          ObjectFieldTemplate={ObjectFieldTemplate}
          onChange={(next) => onChange(next.formData)}
          onError={(newErrors) => onError(_.map(newErrors, (error) => error.stack))}
          onSubmit={onSubmit}
          schema={schema}
          // Don't show the react-jsonschema-form error list at top
          showErrorList={false}
          uiSchema={_.defaultsDeep({}, K8S_UI_SCHEMA, uiSchema)}
          widgets={{ ...defaultWidgets, ...widgets }}
        >
          {errors.length > 0 && <ErrorTemplate errors={errors} />}
          <div style={{ paddingBottom: '30px' }}>
            <ActionGroup className="pf-c-form">
              <Button type="submit" variant="primary">
                Create
              </Button>
              <Button onClick={history.goBack} variant="secondary">
                Cancel
              </Button>
            </ActionGroup>
          </div>
        </Form>
      </Accordion>
    </>
  );
};

type DynamicFormProps = FormProps<any> & {
  errors?: string[];
  ErrorTemplate?: React.FC<{ errors: string[] }>;
};

export * from './types';
export * from './const';
