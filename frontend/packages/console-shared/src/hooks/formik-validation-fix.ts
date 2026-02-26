import { useRef, useEffect } from 'react';
import type { FormikValues } from 'formik';
import { useFormikContext } from 'formik';
import { useDeepCompareMemoize } from './deep-compare-memoize';

export const useFormikValidationFix = (value: any) => {
  const { validateForm } = useFormikContext<FormikValues>();
  const memoizedValue = useDeepCompareMemoize(value);
  const mounted = useRef(false);

  useEffect(() => {
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
