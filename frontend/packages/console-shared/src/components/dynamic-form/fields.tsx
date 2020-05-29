import * as _ from 'lodash';
import * as classnames from 'classnames';
import * as React from 'react';
import { JSONSchema6 } from 'json-schema';
import { getUiOptions } from 'react-jsonschema-form/lib/utils';
import { FieldProps, UiSchema } from 'react-jsonschema-form';
import SchemaField, {
  SchemaFieldProps,
} from 'react-jsonschema-form/lib/components/fields/SchemaField';
import { LinkifyExternal, SelectorInput, Dropdown } from '@console/internal/components/utils';
import { AccordionContent, AccordionItem, AccordionToggle, Switch } from '@patternfly/react-core';
import { MatchExpressions } from '@console/operator-lifecycle-manager/src/components/descriptors/spec/match-expressions';
import { ResourceRequirements } from '@console/operator-lifecycle-manager/src/components/descriptors/spec/resource-requirements';
import {
  ConfigureUpdateStrategy,
  UPDATE_STRATEGY_DESCRIPTION,
} from '@console/internal/components/modals/configure-update-strategy-modal';
import {
  NodeAffinity,
  PodAffinity,
} from '@console/operator-lifecycle-manager/src/components/descriptors/spec/affinity';
import { hasNoFields, useSchemaDescription, useSchemaLabel } from './utils';

const Description = ({ id, description }) =>
  description ? (
    <span id={id} className="help-block">
      <LinkifyExternal>
        <div className="co-pre-line">{description}</div>
      </LinkifyExternal>
    </span>
  ) : null;

export const DescriptionField: React.FC<FieldProps> = ({ id, description }) => (
  <Description id={id} description={description} />
);

export const FormField: React.FC<FormFieldProps> = ({
  children,
  id,
  defaultLabel,
  required,
  schema,
  uiSchema,
}) => {
  const [showLabel, label] = useSchemaLabel(schema, uiSchema, defaultLabel || 'Value');
  return (
    <div id={`${id}_field`} className="form-group">
      {showLabel && label && (
        <label className={classnames('form-label', { 'co-required': required })} htmlFor={id}>
          {label}
        </label>
      )}
      {children}
    </div>
  );
};

export const FieldSet: React.FC<FieldSetProps> = ({
  children,
  defaultLabel,
  idSchema,
  required = false,
  schema,
  uiSchema,
}) => {
  const [expanded, setExpanded] = React.useState(false);
  const [showLabel, label] = useSchemaLabel(schema, uiSchema, defaultLabel);
  const description = useSchemaDescription(schema, uiSchema);
  const onToggle = (e) => {
    e.preventDefault();
    setExpanded((current) => !current);
  };
  return showLabel && label ? (
    <div id={`${idSchema.$id}_field-group`} className="form-group co-dynamic-form__field-group">
      <AccordionItem>
        <AccordionToggle
          id={`${idSchema.$id}_accordion-toggle`}
          onClick={onToggle}
          isExpanded={expanded}
        >
          <label
            className={classnames({ 'co-required': required })}
            htmlFor={`${idSchema.$id}_accordion-content`}
          >
            {_.startCase(label)}
          </label>
        </AccordionToggle>
        {description && (
          <Description id={`${idSchema.$id}_description`} description={description} />
        )}
        <AccordionContent id={`${idSchema.$id}_accordion-content`} isHidden={!expanded}>
          {children}
        </AccordionContent>
      </AccordionItem>
    </div>
  ) : (
    <>{children}</>
  );
};

export const ResourceRequirementsField: React.FC<FieldProps> = ({
  formData,
  idSchema,
  name,
  onChange,
  required,
  schema,
  uiSchema,
}) => (
  <FieldSet
    defaultLabel={name || 'Resource Requirements'}
    idSchema={idSchema}
    required={required}
    schema={schema}
    uiSchema={uiSchema}
  >
    <dl id={idSchema.$id}>
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

export const UpdateStrategyField: React.FC<FieldProps> = ({
  formData,
  idSchema,
  name,
  onChange,
  required,
  schema,
  uiSchema,
}) => {
  const description = useSchemaDescription(schema, uiSchema, UPDATE_STRATEGY_DESCRIPTION);
  return (
    <FormField
      defaultLabel={name || 'Update Strategy'}
      id={idSchema.$id}
      required={required}
      schema={schema}
      uiSchema={uiSchema}
    >
      <Description description={description} id={idSchema.$id} />
      <ConfigureUpdateStrategy
        showDescription={false}
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
    </FormField>
  );
};

export const NodeAffinityField: React.FC<FieldProps> = ({
  formData,
  idSchema,
  name,
  onChange,
  required,
  schema,
  uiSchema,
}) => (
  <FieldSet
    defaultLabel={name || 'Node Affinity'}
    idSchema={idSchema}
    required={required}
    schema={schema}
    uiSchema={uiSchema}
  >
    <NodeAffinity
      affinity={formData}
      onChange={(affinity) => onChange(affinity)}
      uid={idSchema.$id}
    />
  </FieldSet>
);

export const PodAffinityField: React.FC<FieldProps> = ({
  formData,
  idSchema,
  name,
  onChange,
  required,
  schema,
  uiSchema,
}) => (
  <FieldSet
    defaultLabel={name || 'Pod Affinity'}
    idSchema={idSchema}
    required={required}
    schema={schema}
    uiSchema={uiSchema}
  >
    <PodAffinity
      affinity={formData}
      onChange={(affinity) => onChange(affinity)}
      uid={idSchema.$id}
    />
  </FieldSet>
);

export const MatchExpressionsField: React.FC<FieldProps> = ({
  formData,
  idSchema,
  name,
  onChange,
  required,
  schema,
  uiSchema,
}) => (
  <FieldSet
    defaultLabel={name || 'Match Expressions'}
    idSchema={idSchema}
    required={required}
    schema={schema}
    uiSchema={uiSchema}
  >
    <MatchExpressions
      matchExpressions={formData}
      onChange={(v) => onChange(v)}
      uid={idSchema.$id}
    />
  </FieldSet>
);

export const BooleanField: React.FC<FieldProps> = ({
  formData,
  idSchema,
  name,
  onChange,
  uiSchema,
}) => {
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

export const LabelsField: React.FC<FieldProps> = ({
  formData,
  idSchema,
  name,
  onChange,
  required,
  schema,
  uiSchema,
}) => (
  <FormField
    defaultLabel={name}
    id={idSchema.$id}
    required={required}
    schema={schema}
    uiSchema={uiSchema}
  >
    <SelectorInput
      inputProps={{ id: idSchema.$id }}
      onChange={(newValue) => onChange(SelectorInput.objectify(newValue))}
      tags={SelectorInput.arrayify(formData)}
    />
  </FormField>
);

export const DropdownField: React.FC<FieldProps> = ({
  formData,
  idSchema,
  name,
  onChange,
  schema,
  uiSchema = {},
}) => {
  const { items, title } = getUiOptions(uiSchema);
  return (
    <Dropdown
      id={idSchema.$id}
      key={idSchema.$id}
      title={`Select ${title || schema?.title || name}`}
      selectedKey={formData}
      items={items ?? {}}
      onChange={(val) => onChange(val)}
    />
  );
};

export const CustomSchemaField: React.FC<SchemaFieldProps> = (props) => {
  // If a the provided schema will not generate any form field elements, return null.
  if (hasNoFields(props.schema, props.uiSchema)) {
    return null;
  }
  return <SchemaField {...props} />;
};

export const NullField = () => null;

export default {
  BooleanField,
  DescriptionField,
  DropdownField,
  LabelsField,
  MatchExpressionsField,
  NodeAffinityField,
  NullField,
  PodAffinityField,
  ResourceRequirementsField,
  SchemaField: CustomSchemaField,
  UpdateStrategyField,
};

type FormFieldProps = {
  id: string;
  defaultLabel?: string;
  required: boolean;
  schema: JSONSchema6;
  uiSchema: UiSchema;
};

type FieldSetProps = Pick<FieldProps, 'idSchema' | 'required' | 'schema' | 'uiSchema'> & {
  defaultLabel?: string;
};
