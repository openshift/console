export type CloudShellSetupFormData = {
  namespace?: string;
  newNamespace?: string;
  createNamespace?: boolean;
};

export const CREATE_NAMESPACE_KEY = '#CREATE_NAMESPACE_KEY#';

export const cloudShellSetupValidation = (values: CloudShellSetupFormData) => {
  const errors: { [key: string]: string } = {};

  if (!values.namespace) {
    errors.namespace = 'Required';
  } else if (values.namespace === CREATE_NAMESPACE_KEY && !values.newNamespace) {
    errors.newNamespace = 'Required';
  }
  return errors;
};
