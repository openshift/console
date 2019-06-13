import cx from 'classnames';

export const getValidationState = (error: string, touched: boolean, warning?: string) => {
  const state = cx({
    success: touched && !error,
    error: touched && error,
    warning: touched && warning,
  });
  return state || null;
};
