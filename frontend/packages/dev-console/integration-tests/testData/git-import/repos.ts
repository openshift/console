/* eslint-disable global-require, import/no-dynamic-require, @typescript-eslint/no-var-requires, @typescript-eslint/no-require-imports */

export const gitImportRepos: GithubRepo[] = [
  { url: 'https://github.com/sclorg/dancer-ex', folder: 'dancer-ex' },
  { url: 'https://github.com/sclorg/cakephp-ex', folder: 'cakephp-ex' },
  { url: 'https://github.com/sclorg/golang-ex', folder: 'golang-ex' },
  { url: 'https://github.com/sclorg/ruby-ex', folder: 'ruby-ex' },
  { url: 'https://github.com/sclorg/django-ex', folder: 'django-ex' },
  { url: 'https://github.com/spring-projects/spring-boot', folder: 'spring-boot' },
  { url: 'https://github.com/sclorg/nodejs-ex', folder: 'nodejs-ex' },
  { url: 'https://github.com/redhat-developer/s2i-dotnetcore-ex', folder: 's2i-dotnetcore-ex' },
  { url: 'https://github.com/nodeshift-starters/devfile-sample', folder: 'devfile-sample' },
  {
    url: 'https://github.com/rohitkrai03/flask-dockerfile-example',
    folder: 'flask-dockerfile-example',
  },
  {
    url: 'https://github.com/Lucifergene/serverless-func-repo',
    folder: 'serverless-func-repo',
  },
  {
    url: 'https://github.com/vikram-raj/hello-func-node',
    folder: 'hello-func-node',
  },
  {
    url: 'https://github.com/vikram-raj/hello-func-node-env',
    folder: 'hello-func-node-env',
  },
  {
    url: 'https://github.com/vikram-raj/hello-func-quarkus',
    folder: 'hello-func-quarkus',
  },
  {
    url: 'https://github.com/openshift-dev-console/kn-func-typescript-http',
    folder: 'kn-func-typescript-http',
  },
  {
    url: 'https://github.com/openshift-dev-console/kn-func-typescript-cloudevents',
    folder: 'kn-func-typescript-cloudevents',
  },
];

interface GithubRepo {
  url: string;
  folder: string;
}

export function getResponseMocks(repo: GithubRepo) {
  const repoJson = require(`./${repo.folder}/repo.json`);
  const contentsJson = require(`./${repo.folder}/contents.json`);

  let packageJson = null;
  let devFileResources = null;
  let funcJson = null;
  try {
    packageJson = require(`./${repo.folder}/package.json`);
  } catch (err) {
    // nothing, the file does not exist
  }
  try {
    devFileResources = require(`./${repo.folder}/devFileResources.json`);
  } catch (err) {
    // nothing, the file does not exist
  }
  try {
    funcJson = require(`./${repo.folder}/func.json`);
  } catch (err) {
    // nothing, the file does not exist
  }
  return {
    repoResponse: repoJson,
    contentsResponse: contentsJson,
    packageResponse: packageJson,
    devFileResources,
    funcJson,
  };
}
