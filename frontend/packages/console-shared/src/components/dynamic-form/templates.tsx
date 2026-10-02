import type { FC } from 'react';
import { Button, Alert, Divider, FormHelperText } from '@patternfly/react-core';
import { RhUiMinusCircleIcon, RhUiAddCircleFillIcon } from '@patternfly/react-icons';
import type {
  ArrayFieldTemplateProps,
  ArrayFieldItemTemplateProps,
  FieldTemplateProps,
  ObjectFieldTemplateProps,
} from '@rjsf/utils';
import { getUiOptions, getSchemaType } from '@rjsf/utils';
import * as _ from 'lodash';
import { useTranslation } from 'react-i18next';
import { ExpandCollapse } from '@console/internal/components/utils/expand-collapse';
import { JSON_SCHEMA_GROUP_TYPES } from './const';
import { FieldSet, FormField } from './fields';
import type { UiSchemaOptionsWithDependency } from './types';
import { useSchemaLabel } from './utils';

const AtomicFieldTemplate: FC<FieldTemplateProps> = ({
  children,
  id,
  label,
  rawErrors,
  description,
  required,
  schema,
  uiSchema,
}) => (
  <FormField id={id} defaultLabel={label} required={required} schema={schema} uiSchema={uiSchema}>
    {children}
    {description}
    {!_.isEmpty(rawErrors) && (
      <>
        {_.map(rawErrors, (error) => (
          <FormHelperText key={error}>{_.capitalize(error)}</FormHelperText>
        ))}
      </>
    )}
  </FormField>
);

const AdvancedProperties: FC<Pick<ObjectFieldTemplateProps, 'properties'>> = ({ properties }) => {
  const { t } = useTranslation('console-shared');
  return (
    <ExpandCollapse
      textCollapsed={t('Advanced configuration')}
      textExpanded={t('Advanced configuration')}
    >
      {_.map(properties, (property) => property.content)}
    </ExpandCollapse>
  );
};
export const FieldTemplate: FC<FieldTemplateProps> = (props) => {
  const { hidden, schema = {}, children, uiSchema = {}, registry } = props;
  const { formContext = {} } = registry;
  const type = getSchemaType(schema);
  const { dependency } = getUiOptions(uiSchema ?? {}) as UiSchemaOptionsWithDependency;
  const dependencyMet =
    !dependency ||
    dependency.controlFieldValue ===
      _.get(
        formContext.formData ?? {},
        ['spec', ...(dependency.controlFieldPath ?? [])],
        '',
      ).toString();

  if (hidden || !dependencyMet) {
    return null;
  }
  const isGroup = JSON_SCHEMA_GROUP_TYPES.includes(Array.isArray(type) ? type[0] : type);
  return isGroup ? children : <AtomicFieldTemplate {...props} />;
};

export const ObjectFieldTemplate: FC<ObjectFieldTemplateProps> = ({
  fieldPathId,
  properties,
  required,
  schema,
  title,
  uiSchema,
}) => {
  const { advanced } = getUiOptions(uiSchema ?? {});
  const { normalProperties, advancedProperties } = _.groupBy(properties ?? [], ({ name }) =>
    _.includes(advanced as string[], name) ? 'advancedProperties' : 'normalProperties',
  );
  return properties?.length ? (
    <FieldSet
      defaultLabel={title}
      fieldPathId={fieldPathId}
      required={required}
      schema={schema}
      uiSchema={uiSchema}
    >
      <div className="co-dynamic-form__field-group-content">
        {normalProperties?.length > 0 && _.map(normalProperties, (p) => p.content)}
        {advancedProperties?.length > 0 && <AdvancedProperties properties={advancedProperties} />}
      </div>
    </FieldSet>
  ) : null;
};

export const ArrayFieldTemplate: FC<ArrayFieldTemplateProps> = ({
  fieldPathId,
  items,
  onAddClick,
  required,
  schema,
  title,
  uiSchema,
}) => {
  const { t } = useTranslation('console-shared');
  const [, label] = useSchemaLabel(schema, uiSchema, title ?? 'Items');
  return (
    <FieldSet
      defaultLabel={label}
      fieldPathId={fieldPathId}
      required={required}
      schema={schema}
      uiSchema={uiSchema}
    >
      {items}
      <div>
        <Button
          icon={<RhUiAddCircleFillIcon className="co-icon-space-r" />}
          id={`${fieldPathId.$id}_add-btn`}
          type="button"
          onClick={onAddClick}
          variant="link"
        >
          {t('Add {{singularLabel}}', { singularLabel: label })}
        </Button>
      </div>
    </FieldSet>
  );
};

export const ArrayFieldItemTemplate: FC<ArrayFieldItemTemplateProps> = ({
  buttonsProps,
  children,
  index,
  itemKey,
  schema,
  uiSchema,
}) => {
  const { t } = useTranslation('console-shared');
  const [, label] = useSchemaLabel(schema, uiSchema, schema.title ?? 'Items');
  return (
    <div className="co-dynamic-form__array-field-group-item" key={itemKey}>
      {index > 0 && <Divider className="co-divider" />}
      {buttonsProps.hasRemove && (
        <div className="co-dynamic-form__array-field-group-remove">
          <Button
            icon={<RhUiMinusCircleIcon className="co-icon-space-r" />}
            id={`${itemKey}_remove-btn`}
            type="button"
            onClick={buttonsProps.onRemoveItem}
            variant="link"
          >
            {t('Remove {{singularLabel}}', { singularLabel: label })}
          </Button>
        </div>
      )}
      {children}
    </div>
  );
};

export const ErrorTemplate: FC<{ errors: string[] }> = ({ errors }) => {
  const { t } = useTranslation('console-shared');
  return (
    <Alert
      isInline
      className="co-alert co-break-word co-alert--scrollable"
      variant="danger"
      title={t('Error')}
    >
      {t('Fix the following errors:')}
      <ul>
        {_.map(errors, (error) => (
          <li key={error}>{error}</li>
        ))}
      </ul>
    </Alert>
  );
};
