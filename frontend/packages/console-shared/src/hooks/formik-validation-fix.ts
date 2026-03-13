import * as React from 'react';
import { useFormikContext, FormikValues } from 'formik';
import { useDeepCompareMemoize } from './deep-compare-memoize';

export const useFormikValidationFix = (value: any) => {
  const { validateForm } = useFormikContext<FormikValues>();
  const memoizedValue = useDeepCompareMemoize(value);
  const mounted = React.useRef(false);

  React.useEffect(() => {
    if (!mounted.current) {
      // skip auto validation when the component just mounted
      mounted.current = true;
    } else {
      validateForm();
    }
    // validateForm is a stable function from Formik context and doesn't need to be in deps.
    // Including it can cause infinite re-render loops when field arrays change.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [memoizedValue]);
};
