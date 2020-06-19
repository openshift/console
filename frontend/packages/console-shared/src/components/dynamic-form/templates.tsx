import * as _ from 'lodash';
import * as classnames from 'classnames';
import * as React from 'react';
import {
  ArrayFieldTemplateProps,
  FieldTemplateProps,
  ObjectFieldTemplateProps,
  FieldProps,
} from 'react-jsonschema-form';
import {
  AccordionItem,
  AccordionToggle,
  AccordionContent,
  Button,
  Alert,
  FormHelperText,
} from '@patternfly/react-core';
import { MinusCircleIcon, PlusCircleIcon } from '@patternfly/react-icons';
import { JSON_SCHEMA_GROUP_TYPES } from './const';
import { getUiOptions, getSchemaType } from 'react-jsonschema-form/lib/utils';
import { ExpandCollapse } from '@console/internal/components/utils';

export const FieldLabel: React.FC<FieldLabelProps> = ({ htmlFor, label, required }) => (
  <label className={classnames('form-label', { 'co-required': required })} htmlFor={htmlFor}>
    {label}
  </label>
);

export const FormField: React.FC<FormFieldProps> = ({
  children,
  displayTitle = true,
  id,
  required,
  title,
}) => {
  return (
    <div id={`${id}_field`} className="form-group">
      {displayTitle && <FieldLabel label={title || 'Value'} required={required} htmlFor={id} />}
      {children}
    </div>
  );
};

export const AtomicFieldTemplate: React.FC<FieldTemplateProps> = ({
  children,
  id,
  displayLabel,
  label,
  rawErrors,
  description,
  required,
  schema,
  uiSchema,
}) => {
  const options = getUiOptions(uiSchema);
  const title = options?.title || schema?.title || label;
  const displayTitle = displayLabel || !_.isEmpty(title);

  return (
    <FormField id={id} displayTitle={displayTitle} title={title as string} required={required}>
      <>
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
      </>
    </FormField>
  );
};

export const FieldSet: React.FC<FieldSetProps> = ({
  children,
  idSchema,
  name,
  required = false,
  schema,
  title,
  uiSchema = {},
}) => {
  const [expanded, setExpanded] = React.useState(false);
  const options = getUiOptions(uiSchema);
  const { label: showLabel = true } = options;
  const displayName = (options?.title as string) ?? schema?.title ?? title ?? name;
  const onToggle = (e) => {
    e.preventDefault();
    setExpanded((current) => !current);
  };
  return showLabel && displayName ? (
    <div id={`${idSchema.$id}_field-group`} className="co-dynamic-form__field-group">
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
            {_.startCase(displayName)}
          </label>
        </AccordionToggle>
        <AccordionContent id={`${idSchema.$id}_accordion-content`} isHidden={!expanded}>
          {children}
        </AccordionContent>
      </AccordionItem>
    </div>
  ) : (
    <>{children}</>
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

export const ObjectFieldTemplate: React.FC<ObjectFieldTemplateProps> = (props) => {
  const { properties = [], uiSchema = {} } = props;
  const { advanced = [] } = getUiOptions(uiSchema);
  const { normalProperties = [], advancedProperties = [] } = _.groupBy(properties, ({ name }) =>
    _.includes(advanced as string[], name) ? 'advancedProperties' : 'normalProperties',
  );
  return properties.length ? (
    <FieldSet {...props}>
      <div className="co-dynamic-form__field-group-content">
        {normalProperties.length > 0 && _.map(normalProperties, (p) => p.content)}
        {advancedProperties.length > 0 && <AdvancedProperties properties={advancedProperties} />}
      </div>
    </FieldSet>
  ) : null;
};

export const ArrayFieldTemplate: React.FC<ArrayFieldTemplateProps> = (props) => {
  const { idSchema, items = [], onAddClick, schema, title, uiSchema } = props;
  const options = getUiOptions(uiSchema);
  const displayName = (options?.title as string) || schema?.title || title || 'Items';
  const singularTitle = displayName.replace(/s$/, '');
  return (
    <FieldSet {...props}>
      {_.map(items, (item) => {
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
                  Remove {singularTitle}
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
          Add {singularTitle}
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

type FieldLabelProps = {
  htmlFor: string;
  required?: boolean;
  label: string;
};

type FormFieldProps = Partial<FieldTemplateProps> & {
  displayTitle?: boolean;
  title: string;
};

type FieldSetProps = Partial<FieldProps> &
  Partial<ObjectFieldTemplateProps> &
  Partial<ArrayFieldTemplateProps>;
