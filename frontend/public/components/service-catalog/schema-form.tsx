/* eslint-disable no-undef, no-unused-vars */

import * as React from 'react';
import * as _ from 'lodash-es';
import * as classNames from 'classnames';
import { JSONSchema6 } from 'json-schema';
import Form, { FieldTemplateProps, FormProps } from 'react-jsonschema-form';

import { SecretModel } from '../../models';
import { k8sCreate, K8sResourceKind } from '../../module/k8s';

const getSchema = (plan: K8sResourceKind, path: string): JSONSchema6 => {
  const schema = _.get(plan, path);
  // Make sure there is `properties` in the schema, even if empty, or `Form` displays an error.
  return _.assign({ type: 'object', properties: {}}, schema);
};

export const getInstanceCreateSchema = (plan: K8sResourceKind) => getSchema(plan, 'spec.instanceCreateParameterSchema');
export const getBindingCreateSchema = (plan: K8sResourceKind) => getSchema(plan, 'spec.serviceBindingCreateParameterSchema');

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
        blockOwnerDeletion: false
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
const CustomFieldTemplate: React.SFC<FieldTemplateProps> = ({id, classNames: klass, label, help, required, description, errors, children}) => <div className={klass}>
  <label htmlFor={id} className={classNames('control-label', {'co-required': required})}>{label}</label>
  {children}
  <div className="help-block">{description}</div>
  {help}
  {errors}
</div>;

export const ServiceCatalogParametersForm: React.SFC<FormProps<any>> = props =>
  <Form className="co-service-catalog-parameters" FieldTemplate={CustomFieldTemplate} {...props} />;
