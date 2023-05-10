import * as yup from 'yup';

type AdvancedOptions = {
  timeout?: {
    limit?: number;
    unit?: string;
  };
  image?: string;
};

export type CloudShellSetupFormData = {
  namespace?: string;
  newNamespace?: string;
  createNamespace?: boolean;
  advancedOptions?: AdvancedOptions;
};

export const CREATE_NAMESPACE_KEY = '#CREATE_NAMESPACE_KEY#';
const projectNameRegex = /^[a-z0-9]([-a-z0-9]*[a-z0-9])?$/;

export const newNamespaceValidationSchema = yup.string().when('namespace', {
  is: CREATE_NAMESPACE_KEY,
  then: yup
    .string()
    .matches(
      projectNameRegex,
      "Name must consist of lower case alphanumeric characters or '-' and must start and end with an alphanumeric character.",
    )
    .required('Required'),
});

export const advancedOptionsValidationSchema = yup.object().shape({
  image: yup.string(),
});

export const cloudShellSetupValidationSchema = () =>
  yup.object().shape({
    namespace: yup.string().required('Required'),
    newNamespace: newNamespaceValidationSchema,
    advancedOptions: advancedOptionsValidationSchema,
  });

export const getCloudShellTimeout = (limit: number, unit: string): string | null =>
  unit && limit && limit > 0 ? `${limit}${unit}` : null;
