import * as yup from 'yup';

const urlRegex = /^(((ssh|git|https?):\/\/[\w]+)|(git@[\w]+.[\w]+:))([\w\-._~/?#[\]!$&'()*+,;=])+$/;

export const validationSchema = yup.object().shape({
  name: yup.string().required('Required'),
  project: yup.object().shape({
    name: yup.string().required('Required'),
  }),
  application: yup.object().shape({
    name: yup.string().required('Required'),
    selectedKey: yup.string().required('Required'),
  }),
  image: yup.object().shape({
    selected: yup.string().required('Required'),
    tag: yup.string().required('Required'),
  }),
  git: yup.object().shape({
    url: yup
      .string()
      .matches(urlRegex, 'Invalid Git URL')
      .required('Required'),
    type: yup.string().when('showGitType', {
      is: true,
      then: yup.string().required('We failed to detect the git type. Please choose a git type.'),
    }),
    showGitType: yup.boolean(),
  }),
  deployment: yup.object().shape({
    replicas: yup
      .number()
      .integer('Replicas must be an Integer')
      .min(0, 'Replicas must be greater than or equal to 0.')
      .test({
        name: 'isEmpty',
        test: (value) => value !== undefined,
        message: 'This field cannot be empty',
      }),
  }),
});

export const detectGitType = (url: string): string => {
  if (!urlRegex.test(url)) {
    return undefined;
  }
  if (url.includes('github.com')) {
    return 'github';
  }
  if (url.includes('bitbucket.org')) {
    return 'bitbucket';
  }
  if (url.includes('gitlab.com')) {
    return 'gitlab';
  }
  return '';
};
