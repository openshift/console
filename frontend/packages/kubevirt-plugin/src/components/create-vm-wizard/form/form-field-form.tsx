import * as React from 'react';
import { Form } from '@patternfly/react-core';
import { FormFieldReviewContext } from './form-field-review-context';

import './form-field-form.scss';

export const FormFieldForm: React.FC<FormFieldFormProps> = ({ children, isReview }) => {
  const result = isReview ? (
    <dl className="kubevirt-form-field-form__container">{children}</dl>
  ) : (
    <Form>{children}</Form>
  );
  return (
    <FormFieldReviewContext.Provider value={{ isReview }}>{result}</FormFieldReviewContext.Provider>
  );
};
type FormFieldFormProps = {
  children?: React.ReactNode;
  isReview?: boolean;
};
