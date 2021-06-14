import * as React from 'react';
import { useTranslation } from 'react-i18next';
import { prefixedID } from '../../../utils';
import { iGet } from '../../../utils/immutable';
import { getReviewValue } from '../tabs/review-tab/utils';
import { getFieldTitleKey } from '../utils/renderable-field-utils';
import { FormFieldType } from './form-field';

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
  const { t } = useTranslation();
  const asId = prefixedID.bind(null, 'wizard-review');
  const fieldKey = iGet(field, 'key');
  const fieldTitleKey = getFieldTitleKey(fieldKey);
  const reviewValue = value || getReviewValue(field, fieldType) || (
    <span className="text-secondary">{t('kubevirt-plugin~Not defined')}</span>
  );

  return (
    <>
      <dt>{t(fieldTitleKey)}</dt>
      <dd id={asId(fieldKey.toLowerCase())}>{reviewValue}</dd>
    </>
  );
};

export const FormFieldReviewMemoRow = React.memo(FormFieldReviewRow);
