import * as React from 'react';
import { getFieldTitle } from '../utils/renderable-field-utils';
import { iGet } from '../../../utils/immutable';
import { prefixedID } from '../../../utils';
import { FormFieldType } from './form-field';
import { getReviewValue } from '../tabs/review-tab/utils';

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
  const asId = prefixedID.bind(null, 'wizard-review');
  const fieldKey = iGet(field, 'key');
  const fieldTitle = getFieldTitle(fieldKey);
  const reviewValue = value || getReviewValue(field, fieldType) || (
    <span className="text-secondary">{`No ${fieldTitle.toLowerCase()}`}</span>
  );

  return (
    <>
      <dt>{fieldTitle}</dt>
      <dd id={asId(fieldKey.toLowerCase())}>{reviewValue}</dd>
    </>
  );
};

export const FormFieldReviewMemoRow = React.memo(FormFieldReviewRow);
