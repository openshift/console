import type { FC } from 'react';
import { useState, useEffect } from 'react';
import { Button, Alert, Divider, FormHelperText } from '@patternfly/react-core';
import { MinusCircleIcon } from '@patternfly/react-icons/dist/esm/icons/minus-circle-icon';
import { PlusCircleIcon } from '@patternfly/react-icons/dist/esm/icons/plus-circle-icon';
import type {
  ArrayFieldTemplateProps,
  FieldTemplateProps,
  ObjectFieldTemplateProps,
} from '@rjsf/core';
import { getUiOptions, getSchemaType } from '@rjsf/core/dist/cjs/utils';
import * as _ from 'lodash';
import { useTranslation } from 'react-i18next';
import { ExpandCollapse } from '@console/internal/components/utils/expand-collapse';
import { JSON_SCHEMA_GROUP_TYPES } from './const';
import { FieldSet, FormField } from './fields';
import type { UiSchemaOptionsWithDependency } from './types';
import { useSchemaLabel } from './utils';

export const AtomicFieldTemplate: FC<FieldTemplateProps> = ({
  children,
  id,
  label,
  rawErrors,
  description,
  required,
  schema,
  uiSchema,
}) => {
  return (
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
};

const AdvancedProperties: FC<Pick<ObjectFieldTemplateProps, 'properties'>> = ({ properties }) => {
  const { t } = useTranslation();
  return (
    <ExpandCollapse
      textCollapsed={t('console-shared~Advanced configuration')}
      textExpanded={t('console-shared~Advanced configuration')}
    >
      {_.map(properties, (property) => property.content)}
    </ExpandCollapse>
  );
};
export const FieldTemplate: FC<FieldTemplateProps> = (props) => {
  const { hidden, schema = {}, children, uiSchema = {}, formContext = {} } = props;
  const type = getSchemaType(schema);
  const [dependencyMet, setDependencyMet] = useState(true);
  useEffect(() => {
    const { dependency } = getUiOptions(uiSchema ?? {}) as UiSchemaOptionsWithDependency; // Type defs for this function are awful
    if (dependency) {
      setDependencyMet(
        dependency?.controlFieldValue ===
          _.get(
            formContext.formData ?? {},
            ['spec', ...(dependency?.controlFieldPath ?? [])],
            '',
          ).toString(),
      );
    }
  }, [uiSchema, formContext]);

  if (hidden || !dependencyMet) {
    return null;
  }
  const isGroup = JSON_SCHEMA_GROUP_TYPES.includes(type);
  return isGroup ? children : <AtomicFieldTemplate {...props} />;
};

export const ObjectFieldTemplate: FC<ObjectFieldTemplateProps> = ({
  idSchema,
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
      idSchema={idSchema}
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
  idSchema,
  items,
  onAddClick,
  required,
  schema,
  title,
  uiSchema,
}) => {
  const { t } = useTranslation();
  const [, label] = useSchemaLabel(schema, uiSchema, title ?? 'Items');
  return (
    <FieldSet
      defaultLabel={label}
      idSchema={idSchema}
      required={required}
      schema={schema}
      uiSchema={uiSchema}
    >
      {_.map(items ?? [], (item) => {
        return (
          <div className="co-dynamic-form__array-field-group-item" key={item.key}>
            {item.index > 0 && <Divider className="co-divider" />}
            {item.hasRemove && (
              <div className="co-dynamic-form__array-field-group-remove">
                <Button
                  icon={<MinusCircleIcon className="co-icon-space-r" />}
                  id={`${item.key}_remove-btn`}
                  type="button"
                  onClick={item.onDropIndexClick(item.index)}
                  variant="link"
                >
                  {t('console-shared~Remove {{singularLabel}}', { singularLabel: label })}
                </Button>
              </div>
            )}
            {item.children}
          </div>
        );
      })}
      <div>
        <Button
          icon={<PlusCircleIcon className="co-icon-space-r" />}
          id={`${idSchema.$id}_add-btn`}
          type="button"
          onClick={onAddClick}
          variant="link"
        >
          {t('console-shared~Add {{singularLabel}}', { singularLabel: label })}
        </Button>
      </div>
    </FieldSet>
  );
};

export const ErrorTemplate: FC<{ errors: string[] }> = ({ errors }) => {
  const { t } = useTranslation();
  return (
    <Alert
      isInline
      className="co-alert co-break-word co-alert--scrollable"
      variant="danger"
      title={t('console-shared~Error')}
    >
      {t('console-shared~Fix the following errors:')}
      <ul>
        {_.map(errors, (error) => (
          <li key={error}>{error}</li>
        ))}
      </ul>
    </Alert>
  );
};
