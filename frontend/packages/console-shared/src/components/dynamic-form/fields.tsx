import * as _ from 'lodash';
import * as React from 'react';
import { FieldProps } from 'react-jsonschema-form';
import { LinkifyExternal, SelectorInput, Dropdown } from '@console/internal/components/utils';
import { ResourceRequirements } from '@console/operator-lifecycle-manager/src/components/descriptors/spec/resource-requirements';
import { FieldSet, FormField } from './templates';
import { ConfigureUpdateStrategy } from '@console/internal/components/modals/configure-update-strategy-modal';
import {
  NodeAffinity,
  PodAffinity,
} from '@console/operator-lifecycle-manager/src/components/descriptors/spec/affinity';
import { MatchExpressions } from '@console/operator-lifecycle-manager/src/components/descriptors/spec/match-expressions';
import { getUiOptions } from 'react-jsonschema-form/lib/utils';
import { Switch } from '@patternfly/react-core';
import SchemaField, {
  SchemaFieldProps,
} from 'react-jsonschema-form/lib/components/fields/SchemaField';
import { getSchemaErrors } from './utils';

export const DescriptionField: React.FC<FieldProps> = ({ id, description }) =>
  description ? (
    <span id={id} className="help-block">
      <LinkifyExternal>
        <div className="co-pre-line">{description}</div>
      </LinkifyExternal>
    </span>
  ) : null;

const FieldWrapper: React.FC<FieldProps> = ({
  children,
  name,
  idSchema,
  required,
  schema,
  uiSchema,
  registry,
}) => {
  const options = getUiOptions(uiSchema);
  const title = (options?.title || schema?.title || name) as string;
  const description = options?.description || schema?.description;
  const DescriptionFieldComponent = _.get(registry, 'DescriptionField', DescriptionField);

  return (
    <FormField id={idSchema.$id} displayTitle title={title} required={required}>
      <>
        {children}
        {description && (
          <DescriptionFieldComponent description={description} id={`${idSchema.$id}_description`} />
        )}
      </>
    </FormField>
  );
};

export const ResourceRequirementsField: React.FC<FieldProps> = (props) => {
  const { formData, idSchema, onChange } = props;
  return (
    <FieldSet {...props}>
      <dl id={idSchema.$id} style={{ marginLeft: '15px' }}>
        <dt>Limits</dt>
        <dd>
          <ResourceRequirements
            cpu={formData?.limits?.cpu || ''}
            memory={formData?.limits?.memory || ''}
            storage={formData?.limits?.['ephemeral-storage'] || ''}
            onChangeCPU={(cpu) => onChange(_.set(_.cloneDeep(formData), 'limits.cpu', cpu))}
            onChangeMemory={(mem) => onChange(_.set(_.cloneDeep(formData), 'limits.memory', mem))}
            onChangeStorage={(sto) =>
              onChange(_.set(_.cloneDeep(formData), 'limits.ephemeral-storage', sto))
            }
            path={`${idSchema.$id}.limits`}
          />
        </dd>
        <dt>Requests</dt>
        <dd>
          <ResourceRequirements
            cpu={formData?.requests?.cpu || ''}
            memory={formData?.requests?.memory || ''}
            storage={formData?.requests?.['ephemeral-storage'] || ''}
            onChangeCPU={(cpu) => onChange(_.set(_.cloneDeep(formData), 'requests.cpu', cpu))}
            onChangeMemory={(mem) => onChange(_.set(_.cloneDeep(formData), 'requests.memory', mem))}
            onChangeStorage={(sto) =>
              onChange(_.set(_.cloneDeep(formData), 'requests.ephemeral-storage', sto))
            }
            path={`${idSchema.$id}.requests`}
          />
        </dd>
      </dl>
    </FieldSet>
  );
};

export const UpdateStrategyField: React.FC<FieldProps> = (props) => {
  const { formData, idSchema, onChange } = props;
  return (
    <FieldWrapper {...props}>
      <ConfigureUpdateStrategy
        strategyType={formData?.type || 'RollingUpdate'}
        maxUnavailable={formData?.rollingUpdate?.maxUnavailable || ''}
        maxSurge={formData?.rollingUpdate?.maxSurge || ''}
        onChangeStrategyType={(type) => onChange(_.set(_.cloneDeep(formData), 'type', type))}
        onChangeMaxUnavailable={(maxUnavailable) =>
          onChange(_.set(_.cloneDeep(formData), 'rollingUpdate.maxUnavailable', maxUnavailable))
        }
        onChangeMaxSurge={(maxSurge) =>
          onChange(_.set(_.cloneDeep(formData), 'rollingUpdate.maxSurge', maxSurge))
        }
        replicas={1}
        uid={idSchema.$id}
      />
    </FieldWrapper>
  );
};

export const NodeAffinityField: React.FC<FieldProps> = (props) => {
  const { formData, idSchema, onChange } = props;
  return (
    <FieldSet {...props}>
      <NodeAffinity
        affinity={formData}
        onChange={(affinity) => onChange(affinity)}
        uid={idSchema.$id}
      />
    </FieldSet>
  );
};

export const PodAffinityField: React.FC<FieldProps> = (props) => {
  const { formData, idSchema, onChange } = props;
  return (
    <FieldSet {...props}>
      <PodAffinity
        affinity={formData}
        onChange={(affinity) => onChange(affinity)}
        uid={idSchema.$id}
      />
    </FieldSet>
  );
};

export const MatchExpressionsField: React.FC<FieldProps> = (props) => {
  const { formData, idSchema, onChange } = props;
  return (
    <FieldSet {...props}>
      <MatchExpressions
        matchExpressions={formData}
        onChange={(v) => onChange(v)}
        uid={idSchema.$id}
      />
    </FieldSet>
  );
};

export const BooleanField: React.FC<FieldProps> = (props) => {
  const { formData, idSchema, name, onChange, uiSchema } = props;
  const { labelOn = 'true', labelOff = 'false' } = getUiOptions(uiSchema);
  return (
    <Switch
      id={idSchema?.$id || name}
      key={idSchema?.$id || name}
      isChecked={_.isNil(formData) ? false : formData}
      onChange={(v) => onChange(v)}
      label={labelOn as string}
      labelOff={labelOff as string}
    />
  );
};

export const LabelsField: React.FC<FieldProps> = (props) => {
  const { idSchema, onChange, formData } = props;
  return (
    <FieldWrapper {...props}>
      <SelectorInput
        inputProps={{ id: idSchema.$id }}
        onChange={(newValue) => onChange(SelectorInput.objectify(newValue))}
        tags={SelectorInput.arrayify(formData)}
      />
    </FieldWrapper>
  );
};

export const DropdownField: React.FC<FieldProps> = ({
  formData,
  idSchema,
  name,
  onChange,
  schema,
  uiSchema = {},
}) => {
  const { items = {}, title } = getUiOptions(uiSchema);
  return (
    <Dropdown
      id={idSchema.$id}
      key={idSchema.$id}
      title={`Select ${title || schema?.title || name}`}
      selectedKey={formData}
      items={items}
      onChange={(val) => onChange(val)}
    />
  );
};

export const CustomSchemaField: React.FC<SchemaFieldProps> = (props) => {
  const errors = getSchemaErrors(props.schema ?? {});
  if (errors.length) {
    // eslint-disable-next-line no-console
    console.warn('DynamicForm component does not support the provided JSON schema: ', errors);
    return null;
  }

  return <SchemaField {...props} />;
};

export const HiddenField = () => null;
export const NullField = () => null;

export default {
  BooleanField,
  DescriptionField,
  DropdownField,
  HiddenField,
  LabelsField,
  MatchExpressionsField,
  NodeAffinityField,
  NullField,
  PodAffinityField,
  ResourceRequirementsField,
  SchemaField: CustomSchemaField,
  UpdateStrategyField,
};
