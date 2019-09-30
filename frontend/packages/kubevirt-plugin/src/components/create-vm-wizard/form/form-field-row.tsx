import * as React from 'react';
import * as _ from 'lodash';
import { getFieldHelp, getFieldId, getFieldTitle } from '../utils/vm-settings-tab-utils';
import { iGetFieldValue, isFieldHidden, isFieldRequired } from '../selectors/immutable/vm-settings';
import { iGet, iGetIn, iGetIsLoaded } from '../../../utils/immutable';
import { FormRow } from '../../form/form-row';
import { FormFieldContext } from './form-field-context';
import { FormFieldType } from './form-field';
import { FormFieldReviewContext } from './form-field-review-context';
import { FormFieldReviewRow } from './form-field-review-row';

const isLoading = (loadingResources?: { [k: string]: any }) =>
  loadingResources &&
  _.some(Object.keys(loadingResources), (key) => !iGetIsLoaded(loadingResources[key]));

export const FormFieldRow: React.FC<FieldFormRowProps> = ({
  field,
  fieldType,
  children,
  loadingResources,
}) => {
  const fieldKey = iGet(field, 'key');

  if (!field || !fieldKey || isFieldHidden(field)) {
    return null;
  }

  const loading = isLoading(loadingResources);

  return (
    <FormFieldReviewContext.Consumer>
      {({ isReview }: { isReview: boolean }) => {
        if (isReview) {
          return <FormFieldReviewRow field={field} fieldType={fieldType} />;
        }
        return (
          <FormRow
            fieldId={getFieldId(fieldKey)}
            title={
              fieldType === FormFieldType.INLINE_CHECKBOX ? undefined : getFieldTitle(fieldKey)
            }
            help={getFieldHelp(fieldKey, iGetFieldValue(field))}
            isRequired={isFieldRequired(field)}
            validationMessage={iGetIn(field, ['validation', 'message'])}
            validationType={iGetIn(field, ['validation', 'type'])}
            isLoading={loading}
          >
            <FormFieldContext.Provider value={{ field, fieldType, isLoading: loading }}>
              {children}
            </FormFieldContext.Provider>
          </FormRow>
        );
      }}
    </FormFieldReviewContext.Consumer>
  );
};

type FieldFormRowProps = {
  field: any;
  fieldType: FormFieldType;
  children?: React.ReactNode;
  loadingResources?: { [k: string]: any };
};

export const FormFieldMemoRow = React.memo(
  FormFieldRow,
  (prevProps, nextProps) =>
    prevProps.field === nextProps.field &&
    prevProps.fieldType === nextProps.fieldType &&
    isLoading(prevProps.loadingResources) === isLoading(nextProps.loadingResources),
);
