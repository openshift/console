import * as React from 'react';
import { AccordionContent, AccordionItem, AccordionToggle } from '@patternfly/react-core';
import * as classnames from 'classnames';
import { JSONSchema6 } from 'json-schema';
import * as _ from 'lodash';
import { useTranslation } from 'react-i18next';
import { FieldProps, UiSchema } from 'react-jsonschema-form';
import SchemaField, {
  SchemaFieldProps,
} from 'react-jsonschema-form/lib/components/fields/SchemaField';
import { getUiOptions, getSchemaType } from 'react-jsonschema-form/lib/utils';
import { ConfigureUpdateStrategy } from '@console/internal/components/modals/configure-update-strategy-modal';
import { LinkifyExternal, SelectorInput, Dropdown } from '@console/internal/components/utils';
import {
  NodeAffinity,
  PodAffinity,
} from '@console/operator-lifecycle-manager/src/components/descriptors/spec/affinity';
import { MatchExpressions } from '@console/operator-lifecycle-manager/src/components/descriptors/spec/match-expressions';
import { ResourceRequirements } from '@console/operator-lifecycle-manager/src/components/descriptors/spec/resource-requirements';
import { JSONSchemaType } from './types';
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
  const { t } = useTranslation();
  const [showLabel, label] = useSchemaLabel(
    schema,
    uiSchema,
    defaultLabel || t('console-shared~Value'),
  );
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
            {label}
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
}) => {
  const { t } = useTranslation();
  return (
    <FieldSet
      defaultLabel={name || t('console-shared~Resource requirements')}
      idSchema={idSchema}
      required={required}
      schema={schema}
      uiSchema={uiSchema}
    >
      <dl id={idSchema.$id}>
        <dt>{t('console-shared~Limits')}</dt>
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
        <dt>{t('console-shared~Requests')}</dt>
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

export const UpdateStrategyField: React.FC<FieldProps> = ({
  formData,
  idSchema,
  name,
  onChange,
  required,
  schema,
  uiSchema,
}) => {
  const { t } = useTranslation();
  const description = useSchemaDescription(
    schema,
    uiSchema,
    t('public~How should the pods be replaced when a new revision is created?'),
  );
  return (
    <FormField
      defaultLabel={name || t('console-shared~Update strategy')}
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
}) => {
  const { t } = useTranslation();
  return (
    <FieldSet
      defaultLabel={name || t('console-shared~Node affinity')}
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
};
export const PodAffinityField: React.FC<FieldProps> = ({
  formData,
  idSchema,
  name,
  onChange,
  required,
  schema,
  uiSchema,
}) => {
  const { t } = useTranslation();
  return (
    <FieldSet
      defaultLabel={name || t('console-shared~Pod affinity')}
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
};

export const MatchExpressionsField: React.FC<FieldProps> = ({
  formData,
  idSchema,
  name,
  onChange,
  required,
  schema,
  uiSchema,
}) => {
  const { t } = useTranslation();
  return (
    <FieldSet
      defaultLabel={name || t('console-shared~Expressions')}
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
  const { t } = useTranslation();
  const { items, title } = getUiOptions(uiSchema) as { items?: object; title?: string };
  return (
    <Dropdown
      id={idSchema.$id}
      key={idSchema.$id}
      title={t('console-shared~Select {{title}}', { title: title || schema?.title || name })}
      selectedKey={formData}
      items={items ?? {}}
      onChange={(val) => onChange(val)}
    />
  );
};

export const CustomSchemaField: React.FC<SchemaFieldProps> = (props) => {
  // TODO Remove this workaround when the issue has been fixed upstream in react-jsonschema-form and
  // we bump our version to include that fix.
  // Provide a fallback formData value for objects and arrays to prevent undefined
  // references. This can occur if formData is malformed (for example, almExamples annotation
  // explicitly sets an array value to null). This is an edge case that should be handled in the
  // react-jsonschema-form package. An issue and fix have been opened upstream:
  // Issue filed in @rjsf/core repo: https://github.com/rjsf-team/react-jsonschema-form/issues/2153
  // PR opened for fix: https://github.com/rjsf-team/react-jsonschema-form/pull/2154
  const type = getSchemaType(props.schema);
  const fallbackFormData = React.useMemo(() => {
    switch (type) {
      case JSONSchemaType.array:
        return [];
      case JSONSchemaType.object:
        return {};
      default:
        return undefined;
    }
  }, [type]);

  // If a the provided schema will not generate any form field elements, return null.
  if (hasNoFields(props.schema, props.uiSchema)) {
    return null;
  }
  return <SchemaField {...props} formData={props.formData ?? fallbackFormData} />;
};

export const NullField = () => null;

export default {
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
