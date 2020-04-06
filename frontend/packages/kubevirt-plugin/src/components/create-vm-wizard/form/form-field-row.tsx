import * as React from 'react';
import * as _ from 'lodash';
import { ValidationObject } from '@console/shared';
import { getFieldHelp, getFieldId, getFieldTitle } from '../utils/renderable-field-utils';
import { iGetFieldValue, isFieldHidden, isFieldRequired } from '../selectors/immutable/field';
import { iGet, iGetIn, iGetIsLoaded } from '../../../utils/immutable';
import { FormRow } from '../../form/form-row';
import { FormFieldContext } from './form-field-context';
import { FormFieldType } from './form-field';

const isLoading = (loadingResources?: { [k: string]: any }) =>
  loadingResources &&
  _.some(Object.keys(loadingResources), (key) => !iGetIsLoaded(loadingResources[key]));

export const FormFieldInnerRow: React.FC<FieldFormInnerRowProps> = React.memo(
  ({ field, fieldType, fieldHelp, children, loadingResources, validation }) => {
    const fieldKey = iGet(field, 'key');
    const loading = isLoading(loadingResources);

    return (
      <FormRow
        key={fieldKey}
        fieldId={getFieldId(fieldKey)}
        title={fieldType === FormFieldType.INLINE_CHECKBOX ? undefined : getFieldTitle(fieldKey)}
        help={fieldHelp || getFieldHelp(fieldKey, iGetFieldValue(field))}
        isRequired={isFieldRequired(field)}
        isHidden={isFieldHidden(field)}
        validationMessage={validation ? undefined : iGetIn(field, ['validation', 'message'])}
        validationType={validation ? undefined : iGetIn(field, ['validation', 'type'])}
        isLoading={loading}
        validation={validation}
      >
        <FormFieldContext.Provider value={{ field, fieldType, isLoading: loading }}>
          {children}
        </FormFieldContext.Provider>
      </FormRow>
    );
  },
);

type FieldFormInnerRowProps = {
  field: any;
  fieldType: FormFieldType;
  fieldHelp?: React.ReactNode;
  children?: React.ReactNode;
  loadingResources?: { [k: string]: any };
  validation?: ValidationObject;
};

export const FormFieldInnerMemoRow = React.memo(
  FormFieldInnerRow,
  (prevProps, nextProps) =>
    prevProps.field === nextProps.field &&
    prevProps.fieldType === nextProps.fieldType &&
    _.get(prevProps.validation, ['type']) === _.get(nextProps.validation, ['type']) &&
    _.get(prevProps.validation, ['message']) === _.get(nextProps.validation, ['message']) &&
    isLoading(prevProps.loadingResources) === isLoading(nextProps.loadingResources),
);

export const FormFieldRow: React.FC<FieldFormRowProps> = ({
  field,
  fieldType,
  fieldHelp,
  children,
  loadingResources,
  validation,
  memoize,
}) => {
  const fieldKey = iGet(field, 'key');

  if (!field || !fieldKey || isFieldHidden(field)) {
    return null;
  }
  const Component = memoize ? FormFieldInnerMemoRow : FormFieldInnerRow;

  return (
    <Component
      key="main"
      field={field}
      fieldType={fieldType}
      fieldHelp={fieldHelp}
      loadingResources={loadingResources}
      validation={validation}
    >
      {children}
    </Component>
  );
};

type FieldFormRowProps = {
  field: any;
  fieldType?: FormFieldType;
  fieldHelp?: React.ReactNode;
  children?: React.ReactNode;
  loadingResources?: { [k: string]: any };
  validation?: ValidationObject;
  memoize?: boolean;
};

export const FormFieldMemoRow: React.FC<FormFieldMemoRowProps> = (props) => (
  <FormFieldRow {...props} memoize />
);

type FormFieldMemoRowProps = FieldFormRowProps;
