import * as React from 'react';
import { getFieldTitle } from '../utils/renderable-field-utils';
import { GridItem, Title } from '@patternfly/react-core';
import { iGet } from '../../../utils/immutable';
import { FormFieldType } from './form-field';
import { getReviewValue } from '../tabs/review-tab/utils';

import './form-field-review-row.scss';

type FormFieldReviewRowProps = {
  field: any;
  fieldType: FormFieldType;
  value?: any;
};

export const FormFieldReviewRow: React.FC<FormFieldReviewRowProps> = ({
  fieldType,
  field,
  value = undefined,
}) => {
  const fieldKey = iGet(field, 'key');
  const reviewValue = value || getReviewValue(field, fieldType);

  if (!reviewValue) {
    return null;
  }

  return (
    <>
      <GridItem span={2} className="kubevirt-create-vm-modal__form-field-review-row">
        <Title headingLevel="h4" size="sm">
          {getFieldTitle(fieldKey)}
        </Title>
      </GridItem>
      <GridItem span={10}>{reviewValue}</GridItem>
    </>
  );
};

export const FormFieldReviewMemoRow = React.memo(FormFieldReviewRow);
