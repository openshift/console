import * as React from 'react';
import { Accordion, ActionGroup, Button, Alert } from '@patternfly/react-core';
import Form, { FormProps } from '@rjsf/core';
import * as _ from 'lodash';
import { useTranslation } from 'react-i18next';
import { ErrorBoundaryFallbackProps } from '@console/dynamic-plugin-sdk';
import { history } from '@console/internal/components/utils';
import { ErrorBoundary } from '@console/shared/src/components/error';
import { K8S_UI_SCHEMA } from './const';
import defaultFields from './fields';
import {
  FieldTemplate as DefaultFieldTemplate,
  ObjectFieldTemplate as DefaultObjectFieldTemplate,
  ArrayFieldTemplate as DefaultArrayFieldTemplate,
  ErrorTemplate as DefaultErrorTemplate,
} from './templates';
import { getSchemaErrors } from './utils';
import defaultWidgets from './widgets';
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
  onCancel,
  schema,
  uiSchema = {},
  widgets = {},
  customUISchema,
  noActions,
  showAlert = true,
  ...restProps
}) => {
  const { t } = useTranslation();
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
        title={t(
          'console-shared~A form is not available for this resource. Please use the YAML view.',
        )}
      />
    );
  }
  const FormErrorFallbackComponent: React.FC<ErrorBoundaryFallbackProps> = () => {
    return (
      <Alert
        isInline
        className="co-alert co-break-word"
        variant="danger"
        title={t(
          'console-shared~There is some issue in this form view. Please select "YAML view" for full control.',
        )}
      />
    );
  };

  return (
    <>
      {showAlert && (
        <Alert
          isInline
          className="co-alert co-break-word"
          variant="info"
          title={t(
            'console-shared~Note: Some fields may not be represented in this form view. Please select "YAML view" for full control.',
          )}
        />
      )}
      <Accordion asDefinitionList={false} className="co-dynamic-form__accordion">
        <ErrorBoundary FallbackComponent={FormErrorFallbackComponent}>
          <Form
            {...restProps}
            className="co-dynamic-form"
            noValidate={noValidate}
            ArrayFieldTemplate={ArrayFieldTemplate}
            fields={{ ...defaultFields, ...fields }}
            FieldTemplate={FieldTemplate}
            formContext={{ ...formContext, formData }}
            formData={formData}
            noHtml5Validate
            ObjectFieldTemplate={ObjectFieldTemplate}
            onChange={(next) => onChange(next.formData)}
            onError={(newErrors) => onError(_.map(newErrors, (error) => error.stack))}
            onSubmit={onSubmit}
            schema={schema}
            // Don't show the react-jsonschema-form error list at top
            showErrorList={false}
            uiSchema={customUISchema ? uiSchema : _.defaultsDeep({}, K8S_UI_SCHEMA, uiSchema)}
            widgets={{ ...defaultWidgets, ...widgets }}
          >
            {errors.length > 0 && <ErrorTemplate errors={errors} />}
            {!noActions && (
              <div style={{ paddingBottom: '30px' }}>
                <ActionGroup className="pf-c-form">
                  <Button type="submit" variant="primary" data-test="create-dynamic-form">
                    {t('console-shared~Create')}
                  </Button>
                  <Button onClick={onCancel || history.goBack} variant="secondary">
                    {t('console-shared~Cancel')}
                  </Button>
                </ActionGroup>
              </div>
            )}
          </Form>
        </ErrorBoundary>
      </Accordion>
    </>
  );
};

type DynamicFormProps = FormProps<any> & {
  errors?: string[];
  ErrorTemplate?: React.FC<{ errors: string[] }>;
  noActions?: boolean;
  customUISchema?: boolean;
  showAlert?: boolean;
  onCancel?: () => void;
};

export * from './types';
export * from './const';
