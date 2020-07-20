import * as _ from 'lodash';
import * as React from 'react';
import {
  ArrayFieldTemplateProps,
  FieldTemplateProps,
  ObjectFieldTemplateProps,
} from 'react-jsonschema-form';
import { Button, Alert, FormHelperText } from '@patternfly/react-core';
import { MinusCircleIcon, PlusCircleIcon } from '@patternfly/react-icons';
import { JSON_SCHEMA_GROUP_TYPES } from './const';
import { getUiOptions, getSchemaType } from 'react-jsonschema-form/lib/utils';
import { ExpandCollapse } from '@console/internal/components/utils';
import { FieldSet, FormField } from './fields';
import { useSchemaLabel } from './utils';

export const AtomicFieldTemplate: React.FC<FieldTemplateProps> = ({
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
            <FormHelperText key={error} isHidden={false} isError>
              {_.capitalize(error)}
            </FormHelperText>
          ))}
        </>
      )}
    </FormField>
  );
};

const AdvancedProperties: React.FC<Pick<ObjectFieldTemplateProps, 'properties'>> = ({
  properties,
}) => (
  <ExpandCollapse textCollapsed="Advanced Configuration" textExpanded="Advanced Configuration">
    {_.map(properties, (property) => property.content)}
  </ExpandCollapse>
);

export const FieldTemplate: React.FC<FieldTemplateProps> = (props) => {
  const { hidden, schema = {}, children, uiSchema = {}, formContext = {} } = props;
  const type = getSchemaType(schema);
  const [dependencyMet, setDependencyMet] = React.useState(true);
  React.useEffect(() => {
    const { dependency } = getUiOptions(uiSchema ?? {}) as DependencyUIOption; // Type defs for this function are awful
    if (dependency) {
      setDependencyMet(
        dependency.value ===
          _.get(formContext.formData ?? {}, ['spec', ...(dependency.path ?? [])], '').toString(),
      );
    }
  }, [uiSchema, formContext]);

  if (hidden || !dependencyMet) {
    return null;
  }
  const isGroup = JSON_SCHEMA_GROUP_TYPES.includes(type);
  return isGroup ? children : <AtomicFieldTemplate {...props} />;
};

export const ObjectFieldTemplate: React.FC<ObjectFieldTemplateProps> = ({
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

export const ArrayFieldTemplate: React.FC<ArrayFieldTemplateProps> = ({
  idSchema,
  items,
  onAddClick,
  required,
  schema,
  title,
  uiSchema,
}) => {
  const [, label] = useSchemaLabel(schema, uiSchema, title ?? 'Items');
  const singularLabel = label.replace(/s$/, '');
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
            {item.index > 0 && <hr />}
            {item.hasRemove && (
              <div className="row co-dynamic-form__array-field-group-remove">
                <Button
                  id={`${item.key}_remove-btn`}
                  type="button"
                  onClick={item.onDropIndexClick(item.index)}
                  variant="link"
                >
                  <MinusCircleIcon className="co-icon-space-r" />
                  Remove {singularLabel}
                </Button>
              </div>
            )}
            {item.children}
          </div>
        );
      })}
      <div className="row">
        <Button id={`${idSchema.$id}_add-btn`} type="button" onClick={onAddClick} variant="link">
          <PlusCircleIcon className="co-icon-space-r" />
          Add {singularLabel}
        </Button>
      </div>
    </FieldSet>
  );
};

export const ErrorTemplate: React.FC<{ errors: string[] }> = ({ errors }) => (
  <Alert
    isInline
    className="co-alert co-break-word co-alert--scrollable"
    variant="danger"
    title="Error"
  >
    Fix the above errors:
    <ul>
      {_.map(errors, (error) => (
        <li key={error}>{error}</li>
      ))}
    </ul>
  </Alert>
);

type DependencyUIOption = {
  dependency?: {
    path: string;
    value: string;
  };
};
