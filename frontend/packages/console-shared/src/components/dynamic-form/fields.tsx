import type { FC, ReactNode } from 'react';
import { useState } from 'react';
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
import type { FieldProps, UiSchema } from '@rjsf/core';
import type { SchemaFieldProps } from '@rjsf/core/dist/cjs/components/fields/SchemaField';
import SchemaField from '@rjsf/core/dist/cjs/components/fields/SchemaField';
import { retrieveSchema, getUiOptions } from '@rjsf/core/dist/cjs/utils';
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

const Description = ({ id, description }) =>
  description ? (
    <span id={id} className="help-block">
      <LinkifyExternal>
        <div className="co-pre-line">{description}</div>
      </LinkifyExternal>
    </span>
  ) : null;

export const DescriptionField: FC<FieldProps> = ({ id, description }) => (
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
  const { t } = useTranslation();
  const [showLabel, label] = useSchemaLabel(
    schema,
    uiSchema,
    defaultLabel || t('console-shared~Value'),
  );
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
  idSchema,
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
    <div id={`${idSchema.$id}_field-group`} className="form-group co-dynamic-form__field-group">
      <AccordionItem isExpanded={expanded}>
        <AccordionToggle id={`${idSchema.$id}_accordion-toggle`} onClick={onToggle}>
          <label
            className={css({ 'co-required': required })}
            htmlFor={`${idSchema.$id}_accordion-content`}
          >
            {label}
          </label>
        </AccordionToggle>
        {description && (
          <Description id={`${idSchema.$id}_description`} description={description} />
        )}
        <AccordionContent id={`${idSchema.$id}_accordion-content`}>{children}</AccordionContent>
      </AccordionItem>
    </div>
  ) : (
    <>{children}</>
  );
};

export const ResourceRequirementsField: FC<FieldProps> = ({
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
      <DescriptionList id={idSchema.$id}>
        <DescriptionListGroup>
          <DescriptionListTerm>{t('console-shared~Limits')}</DescriptionListTerm>
          <DescriptionListDescription>
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
          </DescriptionListDescription>
        </DescriptionListGroup>
        <DescriptionListGroup>
          <DescriptionListTerm>{t('console-shared~Requests')}</DescriptionListTerm>
          <DescriptionListDescription>
            <ResourceRequirements
              cpu={formData?.requests?.cpu || ''}
              memory={formData?.requests?.memory || ''}
              storage={formData?.requests?.['ephemeral-storage'] || ''}
              onChangeCPU={(cpu) => onChange(_.set(_.cloneDeep(formData), 'requests.cpu', cpu))}
              onChangeMemory={(mem) =>
                onChange(_.set(_.cloneDeep(formData), 'requests.memory', mem))
              }
              onChangeStorage={(sto) =>
                onChange(_.set(_.cloneDeep(formData), 'requests.ephemeral-storage', sto))
              }
              path={`${idSchema.$id}.requests`}
            />
          </DescriptionListDescription>
        </DescriptionListGroup>
      </DescriptionList>
    </FieldSet>
  );
};

export const UpdateStrategyField: FC<FieldProps> = ({
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

export const NodeAffinityField: FC<FieldProps> = ({
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
export const PodAffinityField: FC<FieldProps> = ({
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

export const MatchExpressionsField: FC<FieldProps> = ({
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

export const LabelsField: FC<FieldProps> = ({
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

export const DropdownField: FC<FieldProps> = ({
  formData,
  idSchema,
  name,
  onChange,
  schema,
  uiSchema = {},
}) => {
  const { t } = useTranslation();
  const { items, title } = getUiOptions(uiSchema) as {
    items?: ConsoleSelectProps['items'];
    title?: string;
  };
  return (
    <ConsoleSelect
      id={idSchema.$id}
      key={idSchema.$id}
      title={t('console-shared~Select {{title}}', { title: title || schema?.title || name })}
      selectedKey={formData}
      items={items ?? {}}
      onChange={(val) => onChange(val)}
    />
  );
};

export const CustomSchemaField: FC<SchemaFieldProps> = (props) => {
  // If the provided schema will not generate any form field elements, return null.
  // To check that, it's required to resolving definition references ($ref) in the
  // JSON schema as it is implemented in the origin SchemaField:
  // https://github.com/rjsf-team/react-jsonschema-form/blob/v2.5.1/packages/core/src/components/fields/SchemaField.js#L226-L244
  const {
    schema: fieldSchema,
    registry: { rootSchema },
    formData,
    uiSchema,
  } = props;

  let resolvedSchema = fieldSchema;
  try {
    resolvedSchema = retrieveSchema(fieldSchema, rootSchema, formData);
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error('dynamic-form CustomSchemaField retrieveSchema error:', error);
  }

  if (hasNoFields(resolvedSchema, uiSchema)) {
    return null;
  }

  return <SchemaField {...props} />;
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
  schema: JSONSchema7;
  uiSchema: UiSchema;
  children?: ReactNode;
};

type FieldSetProps = Pick<FieldProps, 'idSchema' | 'required' | 'schema' | 'uiSchema'> & {
  defaultLabel?: string;
  children?: ReactNode;
};
