import type { FC, ReactNode } from 'react';
import { useCallback, useState } from 'react';
import {
  AccordionContent,
  AccordionItem,
  AccordionToggle,
  DescriptionList,
  DescriptionListDescription,
  DescriptionListGroup,
  DescriptionListTerm,
} from '@patternfly/react-core';
import { css } from '@patternfly/react-styles';
import { getDefaultRegistry } from '@rjsf/core';
import type { FieldPathId, FieldProps, UiSchema } from '@rjsf/utils';
import { getUiOptions } from '@rjsf/utils';
import type { JSONSchema7 } from 'json-schema';
import * as _ from 'lodash';
import { useTranslation } from 'react-i18next';
import { ConfigureUpdateStrategy } from '@console/internal/components/modals/configure-update-strategy-modal';
import type { ConsoleSelectProps } from '@console/internal/components/utils/console-select';
import { ConsoleSelect } from '@console/internal/components/utils/console-select';
import { LinkifyExternal } from '@console/internal/components/utils/link';
import { SelectorInput } from '@console/internal/components/utils/selector-input';
import {
  NodeAffinity,
  PodAffinity,
} from '@console/operator-lifecycle-manager/src/components/descriptors/spec/affinity';
import { MatchExpressions } from '@console/operator-lifecycle-manager/src/components/descriptors/spec/match-expressions';
import { ResourceRequirements } from '@console/operator-lifecycle-manager/src/components/descriptors/spec/resource-requirements';
import { hasNoFields, useSchemaDescription, useSchemaLabel } from './utils';

const { SchemaField } = getDefaultRegistry().fields;

const updateField = (onChange: FieldProps['onChange'], fieldPathId: FieldPathId, value: unknown) =>
  onChange(value, fieldPathId.path);

const Description = ({ id, description }) =>
  description ? (
    <span id={id} className="help-block">
      <LinkifyExternal>
        <div className="co-pre-line">{description}</div>
      </LinkifyExternal>
    </span>
  ) : null;

const DescriptionField: FC<FieldProps> = ({ id, description }) => (
  <Description id={id} description={description} />
);

export const FormField: FC<FormFieldProps> = ({
  children,
  id,
  defaultLabel,
  required,
  schema,
  uiSchema,
}) => {
  const { t } = useTranslation('console-shared');
  const [showLabel, label] = useSchemaLabel(schema, uiSchema, defaultLabel || t('Value'));
  return (
    <div id={`${id}_field`} className="form-group">
      {showLabel && label && (
        <label className={css('form-label', { 'co-required': required })} htmlFor={id}>
          {label}
        </label>
      )}
      {children}
    </div>
  );
};

export const FieldSet: FC<FieldSetProps> = ({
  children,
  defaultLabel,
  fieldPathId,
  required = false,
  schema,
  uiSchema,
}) => {
  const [expanded, setExpanded] = useState(false);
  const [showLabel, label] = useSchemaLabel(schema, uiSchema, defaultLabel);
  const description = useSchemaDescription(schema, uiSchema);
  const onToggle = (e) => {
    e.preventDefault();
    setExpanded((current) => !current);
  };
  return showLabel && label ? (
    <div
      id={`${fieldPathId.$id}_field-group`}
      className="form-group co-dynamic-form__field-group"
      data-test="dynamic-form-field-group"
    >
      <AccordionItem isExpanded={expanded}>
        <AccordionToggle id={`${fieldPathId.$id}_accordion-toggle`} onClick={onToggle}>
          <label
            className={css({ 'co-required': required })}
            htmlFor={`${fieldPathId.$id}_accordion-content`}
          >
            {label}
          </label>
        </AccordionToggle>
        {description && (
          <Description id={`${fieldPathId.$id}_description`} description={description} />
        )}
        <AccordionContent id={`${fieldPathId.$id}_accordion-content`}>{children}</AccordionContent>
      </AccordionItem>
    </div>
  ) : (
    <>{children}</>
  );
};

export const ResourceRequirementsField: FC<FieldProps> = ({
  formData,
  fieldPathId,
  name,
  onChange,
  required,
  schema,
  uiSchema,
}) => {
  const { t } = useTranslation('console-shared');
  const onChangeLimitsCPU = useCallback(
    (cpu: string) =>
      updateField(onChange, fieldPathId, _.set(_.cloneDeep(formData), 'limits.cpu', cpu)),
    [onChange, fieldPathId, formData],
  );
  const onChangeLimitsMemory = useCallback(
    (memory: string) =>
      updateField(onChange, fieldPathId, _.set(_.cloneDeep(formData), 'limits.memory', memory)),
    [onChange, fieldPathId, formData],
  );
  const onChangeLimitsStorage = useCallback(
    (storage: string) =>
      updateField(
        onChange,
        fieldPathId,
        _.set(_.cloneDeep(formData), 'limits.ephemeral-storage', storage),
      ),
    [onChange, fieldPathId, formData],
  );
  const onChangeRequestsCPU = useCallback(
    (cpu: string) =>
      updateField(onChange, fieldPathId, _.set(_.cloneDeep(formData), 'requests.cpu', cpu)),
    [onChange, fieldPathId, formData],
  );
  const onChangeRequestsMemory = useCallback(
    (memory: string) =>
      updateField(onChange, fieldPathId, _.set(_.cloneDeep(formData), 'requests.memory', memory)),
    [onChange, fieldPathId, formData],
  );
  const onChangeRequestsStorage = useCallback(
    (storage: string) =>
      updateField(
        onChange,
        fieldPathId,
        _.set(_.cloneDeep(formData), 'requests.ephemeral-storage', storage),
      ),
    [onChange, fieldPathId, formData],
  );
  return (
    <FieldSet
      defaultLabel={name || t('Resource requirements')}
      fieldPathId={fieldPathId}
      required={required}
      schema={schema}
      uiSchema={uiSchema}
    >
      <DescriptionList id={fieldPathId.$id}>
        <DescriptionListGroup>
          <DescriptionListTerm>{t('Limits')}</DescriptionListTerm>
          <DescriptionListDescription>
            <ResourceRequirements
              cpu={formData?.limits?.cpu || ''}
              memory={formData?.limits?.memory || ''}
              storage={formData?.limits?.['ephemeral-storage'] || ''}
              onChangeCPU={onChangeLimitsCPU}
              onChangeMemory={onChangeLimitsMemory}
              onChangeStorage={onChangeLimitsStorage}
              path={`${fieldPathId.$id}.limits`}
            />
          </DescriptionListDescription>
        </DescriptionListGroup>
        <DescriptionListGroup>
          <DescriptionListTerm>{t('Requests')}</DescriptionListTerm>
          <DescriptionListDescription>
            <ResourceRequirements
              cpu={formData?.requests?.cpu || ''}
              memory={formData?.requests?.memory || ''}
              storage={formData?.requests?.['ephemeral-storage'] || ''}
              onChangeCPU={onChangeRequestsCPU}
              onChangeMemory={onChangeRequestsMemory}
              onChangeStorage={onChangeRequestsStorage}
              path={`${fieldPathId.$id}.requests`}
            />
          </DescriptionListDescription>
        </DescriptionListGroup>
      </DescriptionList>
    </FieldSet>
  );
};

export const UpdateStrategyField: FC<FieldProps> = ({
  formData,
  fieldPathId,
  name,
  onChange,
  required,
  schema,
  uiSchema,
}) => {
  const { t } = useTranslation('console-shared');
  const description = useSchemaDescription(
    schema,
    uiSchema,
    t('How should the pods be replaced when a new revision is created?'),
  );
  return (
    <FormField
      defaultLabel={name || t('Update strategy')}
      id={fieldPathId.$id}
      required={required}
      schema={schema}
      uiSchema={uiSchema}
    >
      <Description description={description} id={fieldPathId.$id} />
      <ConfigureUpdateStrategy
        showDescription={false}
        strategyType={formData?.type || 'RollingUpdate'}
        maxUnavailable={formData?.rollingUpdate?.maxUnavailable || ''}
        maxSurge={formData?.rollingUpdate?.maxSurge || ''}
        onChangeStrategyType={(type) =>
          updateField(onChange, fieldPathId, _.set(_.cloneDeep(formData), 'type', type))
        }
        onChangeMaxUnavailable={(maxUnavailable) =>
          updateField(
            onChange,
            fieldPathId,
            _.set(_.cloneDeep(formData), 'rollingUpdate.maxUnavailable', maxUnavailable),
          )
        }
        onChangeMaxSurge={(maxSurge) =>
          updateField(
            onChange,
            fieldPathId,
            _.set(_.cloneDeep(formData), 'rollingUpdate.maxSurge', maxSurge),
          )
        }
        replicas={1}
        uid={fieldPathId.$id}
      />
    </FormField>
  );
};

export const NodeAffinityField: FC<FieldProps> = ({
  formData,
  fieldPathId,
  name,
  onChange,
  required,
  schema,
  uiSchema,
}) => {
  const { t } = useTranslation('console-shared');
  return (
    <FieldSet
      defaultLabel={name || t('Node affinity')}
      fieldPathId={fieldPathId}
      required={required}
      schema={schema}
      uiSchema={uiSchema}
    >
      <NodeAffinity
        affinity={formData}
        onChange={(affinity) => updateField(onChange, fieldPathId, affinity)}
        uid={fieldPathId.$id}
      />
    </FieldSet>
  );
};
export const PodAffinityField: FC<FieldProps> = ({
  formData,
  fieldPathId,
  name,
  onChange,
  required,
  schema,
  uiSchema,
}) => {
  const { t } = useTranslation('console-shared');
  return (
    <FieldSet
      defaultLabel={name || t('Pod affinity')}
      fieldPathId={fieldPathId}
      required={required}
      schema={schema}
      uiSchema={uiSchema}
    >
      <PodAffinity
        affinity={formData}
        onChange={(affinity) => updateField(onChange, fieldPathId, affinity)}
        uid={fieldPathId.$id}
      />
    </FieldSet>
  );
};

const MatchExpressionsField: FC<FieldProps> = ({
  formData,
  fieldPathId,
  name,
  onChange,
  required,
  schema,
  uiSchema,
}) => {
  const { t } = useTranslation('console-shared');
  return (
    <FieldSet
      defaultLabel={name || t('Expressions')}
      fieldPathId={fieldPathId}
      required={required}
      schema={schema}
      uiSchema={uiSchema}
    >
      <MatchExpressions
        matchExpressions={formData}
        onChange={(v) => updateField(onChange, fieldPathId, v)}
        uid={fieldPathId.$id}
      />
    </FieldSet>
  );
};

const LabelsField: FC<FieldProps> = ({
  formData,
  fieldPathId,
  name,
  onChange,
  required,
  schema,
  uiSchema,
}) => (
  <FormField
    defaultLabel={name}
    id={fieldPathId.$id}
    required={required}
    schema={schema}
    uiSchema={uiSchema}
  >
    <SelectorInput
      inputProps={{ id: fieldPathId.$id }}
      onChange={(newValue) => updateField(onChange, fieldPathId, SelectorInput.objectify(newValue))}
      tags={SelectorInput.arrayify(formData)}
    />
  </FormField>
);

const DropdownField: FC<FieldProps> = ({
  formData,
  fieldPathId,
  name,
  onChange,
  schema,
  uiSchema = {},
}) => {
  const { t } = useTranslation('console-shared');
  const { items, title } = getUiOptions(uiSchema) as {
    items?: ConsoleSelectProps['items'];
    title?: string;
  };
  return (
    <ConsoleSelect
      id={fieldPathId.$id}
      key={fieldPathId.$id}
      title={t('Select {{title}}', { title: title || schema?.title || name })}
      selectedKey={formData}
      items={items ?? {}}
      onChange={(val) => updateField(onChange, fieldPathId, val)}
    />
  );
};

const CustomSchemaField: FC<FieldProps> = (props) => {
  // If the provided schema will not generate any form field elements, return null.
  // To check that, it's required to resolving definition references ($ref) in the
  // JSON schema as it is implemented in the origin SchemaField:
  // https://github.com/rjsf-team/react-jsonschema-form/blob/v2.5.1/packages/core/src/components/fields/SchemaField.js#L226-L244
  const {
    schema: fieldSchema,
    registry: { schemaUtils },
    formData,
    uiSchema,
  } = props;

  let resolvedSchema = fieldSchema;
  try {
    resolvedSchema = schemaUtils.retrieveSchema(fieldSchema, formData);
  } catch (error) {
    console.error('dynamic-form CustomSchemaField retrieveSchema error:', error);
  }

  if (hasNoFields(resolvedSchema, uiSchema)) {
    return null;
  }

  return <SchemaField {...props} />;
};

const NullField = () => null;

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
  schema: JSONSchema7;
  uiSchema: UiSchema;
  children?: ReactNode;
};

type FieldSetProps = Pick<FieldProps, 'fieldPathId' | 'required' | 'schema' | 'uiSchema'> & {
  defaultLabel?: string;
  children?: ReactNode;
};
