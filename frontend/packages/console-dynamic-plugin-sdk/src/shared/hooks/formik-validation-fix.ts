import * as React from 'react';
import { useFormikContext, FormikValues } from 'formik';
import { useDeepCompareMemoize } from './deep-compare-memoize';

export const useFormikValidationFix = (value: any) => {
  const { validateForm } = useFormikContext<FormikValues>();
  const memoizedValue = useDeepCompareMemoize(value);

  React.useEffect(() => {
    validateForm();
  }, [memoizedValue, validateForm]);
};
