import type { FC } from 'react';

export type FormProps = {
  globals: { [key: string]: any };
  formValues: { [key: string]: any };
  dispatchFormChange: Function;
};

export type SubFormModule = {
  Form: FC<FormProps>;
  getInitialValues: (globals: object, receiverConfig: object) => object;
  isFormInvalid: (formValues: object) => boolean;
  updateGlobals: (globals: object, formValues: object) => object;
  createReceiverConfig: (globals: object, formValues: object, receiverConfig: object) => object;
};
