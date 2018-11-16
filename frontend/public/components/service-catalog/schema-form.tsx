/* eslint-disable no-undef, no-unused-vars */

import * as React from 'react';
import * as _ from 'lodash-es';
import * as classNames from 'classnames';
import { JSONSchema6 } from 'json-schema';
import Form, { FieldTemplateProps, FormProps, UiSchema } from 'react-jsonschema-form';

import { SecretModel } from '../../models';
import { k8sCreate, K8sResourceKind } from '../../module/k8s';

const getSchema = (plan: K8sResourceKind, path: string): JSONSchema6 => {
  const schema = _.get(plan, path);
  // Make sure there is `properties` in the schema, even if empty, or `Form` displays an error.
  return _.assign({ type: 'object', properties: {}}, schema);
};

export const getInstanceCreateSchema = (plan: K8sResourceKind) => getSchema(plan, 'spec.instanceCreateParameterSchema');
export const getInstanceCreateParametersForm = (plan: K8sResourceKind) => _.get(plan, 'spec.externalMetadata.schemas.service_instance.create.openshift_form_definition');

export const getBindingCreateSchema = (plan: K8sResourceKind) => getSchema(plan, 'spec.serviceBindingCreateParameterSchema');
export const getBindingParametersForm = (plan: K8sResourceKind) => _.get(plan, 'spec.externalMetadata.schemas.service_binding.create.openshift_form_definition');

// Flatten items from fieldsets into a single list of parameters. Fieldsets aren't supported.
const flattenParameters = (parametersForm: ParameterFormItem[]): ParameterFormItem[] => {
  return parametersForm.reduce((result: ParameterFormItem[], param: ParameterFormItem) => {
    // If param has an `items` array, it's a fieldset. Add the fieldset parameters to the top-level array (preserving order).
    const fieldsetItems = _.get(param, 'items');
    const values = _.isEmpty(fieldsetItems) ? param : fieldsetItems;
    return result.concat(values);
  }, []);
};

const UI_ORDER = 'ui:order';
const UI_WIDGET = 'ui:widget';

// The whitelist of types for openshift_form_defintion items are textarea, password, checkbox, select.
// Map these to the `ui:widget` value expected by react-jsonschema-form.
const widgetForType = Object.freeze({
  'checkbox': 'checkboxes',
  'password': 'password',
  'select': 'select',
  'textarea': 'textarea',
});

// Convert from the broker parameters form definition to the UI schema expected by react-jsonschema-form:
// https://github.com/mozilla-services/react-jsonschema-form#form-customization
//
// The parameters form definition is a small subset of what was supported by angular-schema-form in the previous AngularJS catalog implementation:
// https://github.com/json-schema-form/angular-schema-form
export const getUISchema = (parametersForm: ParameterFormItem[]): UiSchema => {
  if (_.isEmpty(parametersForm)) {
    return {};
  }

  const flatParams = flattenParameters(parametersForm);
  return flatParams.reduce((result: UiSchema, param: ParameterFormItem) => {
    if (_.isString(param)) {
      result[UI_ORDER].push(param);
    } else if (param.key) {
      result[UI_ORDER].push(param.key);
      const widget = widgetForType[param.type];
      if (widget) {
        _.set(result, [param.key, UI_WIDGET], widget);
      }
    }
    return result;
  }, {[UI_ORDER]: []});
};

export const createParametersSecret = (secretName: string, key: string, parameters: any, owner: K8sResourceKind): Promise<K8sResourceKind> => {
  const secret = {
    apiVersion: 'v1',
    kind: 'Secret',
    metadata: {
      name: secretName,
      namespace: owner.metadata.namespace,
      ownerReferences: [{
        apiVersion: owner.apiVersion,
        kind: owner.kind,
        name: owner.metadata.name,
        uid: owner.metadata.uid,
        controller: false,
        blockOwnerDeletion: false,
      }],
    },
    stringData: {
      [key]: JSON.stringify(parameters),
    },
  };

  return k8sCreate(SecretModel, secret);
};

// Override react-jsonschema-form rendering of fields so we can use different required and description styles.
// https://github.com/mozilla-services/react-jsonschema-form#field-template
const CustomFieldTemplate: React.SFC<FieldTemplateProps> = ({id, classNames: klass, displayLabel, label, help, required, description, errors, children}) => <div className={klass}>
  {displayLabel && <label htmlFor={id} className={classNames('control-label', {'co-required': required})}>{label}</label>}
  {children}
  <div className="help-block">{description}</div>
  {help}
  {errors}
</div>;

// Create a custom checkbox widget to prevent any checkbox from receiving a `required` attribute.
// With HTML5 form validation, a required checkbox has to be checked to submit the form.
const CustomCheckbox = ({onChange, label, value}) => <div className="checkbox">
  <label className="control-label">
    <input type="checkbox" onClick={() => onChange(!value)} checked={value} />
    {label}
  </label>
</div>;

const widgets: any = {
  CheckboxWidget: CustomCheckbox,
};

export const ServiceCatalogParametersForm: React.SFC<FormProps<any>> = props =>
  <Form className="co-service-catalog-parameters" FieldTemplate={CustomFieldTemplate} widgets={widgets} {...props} />;

export type ParameterFormItem = {
  key: string;
  type?: string;
  items?: any[];
} | string;
