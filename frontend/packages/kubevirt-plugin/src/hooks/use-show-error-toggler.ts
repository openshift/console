import * as React from 'react';

export const useShowErrorToggler = (
  initialShowError: boolean = false,
  initialIsValid: boolean = false,
  checkIsValid?: boolean,
) => {
  const [showError, setShowError] = React.useState<boolean>(initialShowError);
  const [prevIsValid, setPrevIsValid] = React.useState<boolean>(initialIsValid);

  const checkValidity = (isValid: boolean) => {
    if (isValid !== prevIsValid) {
      setPrevIsValid(isValid);
      if (isValid) {
        setShowError(false);
      }
    }
  };

  if (checkIsValid != null) {
    checkValidity(checkIsValid);
  }

  return [showError, setShowError, checkValidity] as [
    boolean,
    React.Dispatch<React.SetStateAction<boolean>>,
    (isValid: boolean) => void,
  ];
};
