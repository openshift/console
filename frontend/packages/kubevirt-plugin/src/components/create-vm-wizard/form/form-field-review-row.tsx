import * as React from 'react';
import { getFieldTitle } from '../utils/renderable-field-utils';
import { iGet } from '../../../utils/immutable';
import { FormFieldType } from './form-field';
import { getReviewValue } from '../tabs/review-tab/utils';
import { EMPTY_MESSAGE } from '../../../utils/strings';

import './form-field-review-row.scss';

type FormFieldReviewRowProps = {
  field: any;
  fieldType?: FormFieldType;
  value?: any;
};

export const FormFieldReviewRow: React.FC<FormFieldReviewRowProps> = ({
  fieldType,
  field,
  value = undefined,
}) => {
  const fieldKey = iGet(field, 'key');
  const reviewValue = value || getReviewValue(field, fieldType) || EMPTY_MESSAGE;

  return (
    <>
      <dt>{getFieldTitle(fieldKey)}</dt>
      <dd>{reviewValue}</dd>
    </>
  );
};

export const FormFieldReviewMemoRow = React.memo(FormFieldReviewRow);
