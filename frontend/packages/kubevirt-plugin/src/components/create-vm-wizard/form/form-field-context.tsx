import * as React from 'react';

export const FormFieldContext = React.createContext({
  field: null,
  fieldType: null,
  isLoading: false,
});
