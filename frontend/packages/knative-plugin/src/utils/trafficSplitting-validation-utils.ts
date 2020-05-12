import * as yup from 'yup';

const nameRegex = /^([a-z]([-a-z0-9]*[a-z0-9])?)*$/;

export const trafficModalValidationSchema = yup.object().shape({
  trafficSplitting: yup.array().of(
    yup.object({
      percent: yup
        .number()
        .required('Required')
        .max(100, 'cannot exceed 100%'),
      tag: yup
        .string()
        .matches(nameRegex, {
          message:
            'tag name must consist of lower-case letters, numbers and hyphens. It must start with a letter and end with a letter or number.',
          excludeEmptyString: true,
        })
        .max(253, 'Cannot be longer than 253 characters.'),
      revisionName: yup.string().required('Required'),
    }),
  ),
});
