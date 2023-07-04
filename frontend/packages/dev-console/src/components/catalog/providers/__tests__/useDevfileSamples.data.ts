import { CatalogItem } from '@console/dynamic-plugin-sdk/src';
import { DevfileSample } from '../../../import/devfile/devfile-types';

export const devfileSamples: DevfileSample[] = [
  {
    name: 'nodejs-basic',
    displayName: 'Basic Node.js',
    description: 'A simple Hello World Node.js application',
    icon: 'trimmed',
    tags: ['NodeJS', 'Express'],
    projectType: 'nodejs',
    language: 'nodejs',
    git: {
      remotes: {
        origin: 'https://github.com/nodeshift-starters/devfile-sample.git',
      },
    },
  },
  {
    name: 'code-with-quarkus',
    displayName: 'Basic Quarkus',
    description: 'A simple Hello World Java application using Quarkus',
    icon: 'trimmed',
    tags: ['Java', 'Quarkus'],
    projectType: 'quarkus',
    language: 'java',
    git: {
      remotes: {
        origin: 'https://github.com/devfile-samples/devfile-sample-code-with-quarkus.git',
      },
    },
  },
  {
    name: 'java-springboot-basic',
    displayName: 'Basic Spring Boot',
    description: 'A simple Hello World Java Spring Boot application using Maven',
    icon: 'trimmed',
    tags: ['Java', 'Spring'],
    projectType: 'springboot',
    language: 'java',
    git: {
      remotes: {
        origin: 'https://github.com/devfile-samples/devfile-sample-java-springboot-basic.git',
      },
    },
  },
  {
    name: 'python-basic',
    displayName: 'Basic Python',
    description: 'A simple Hello World application using Python',
    icon: 'trimmed',
    tags: ['Python'],
    projectType: 'python',
    language: 'python',
    git: {
      remotes: {
        origin: 'https://github.com/devfile-samples/devfile-sample-python-basic.git',
      },
    },
  },
];

export const expectedCatalogItems: CatalogItem[] = [
  {
    uid: 'nodejs-basic',
    type: 'Devfile',
    name: 'Basic Node.js',
    provider: undefined,
    description: 'A simple Hello World Node.js application',
    tags: ['NodeJS', 'Express'],
    cta: {
      label: 'Create Devfile Sample',
      href:
        '/import/ns/test?formType=sample&importType=devfile&devfileName=nodejs-basic&git.repository=https%3A%2F%2Fgithub.com%2Fnodeshift-starters%2Fdevfile-sample.git',
    },
    icon: { url: 'trimmed' },
  },
  {
    uid: 'code-with-quarkus',
    type: 'Devfile',
    name: 'Basic Quarkus',
    provider: undefined,
    description: 'A simple Hello World Java application using Quarkus',
    tags: ['Java', 'Quarkus'],
    cta: {
      label: 'Create Devfile Sample',
      href:
        '/import/ns/test?formType=sample&importType=devfile&devfileName=code-with-quarkus&git.repository=https%3A%2F%2Fgithub.com%2Fdevfile-samples%2Fdevfile-sample-code-with-quarkus.git',
    },
    icon: { url: 'trimmed' },
  },
  {
    uid: 'java-springboot-basic',
    type: 'Devfile',
    name: 'Basic Spring Boot',
    provider: undefined,
    description: 'A simple Hello World Java Spring Boot application using Maven',
    tags: ['Java', 'Spring'],
    cta: {
      label: 'Create Devfile Sample',
      href:
        '/import/ns/test?formType=sample&importType=devfile&devfileName=java-springboot-basic&git.repository=https%3A%2F%2Fgithub.com%2Fdevfile-samples%2Fdevfile-sample-java-springboot-basic.git',
    },
    icon: { url: 'trimmed' },
  },
  {
    uid: 'python-basic',
    type: 'Devfile',
    name: 'Basic Python',
    provider: undefined,
    description: 'A simple Hello World application using Python',
    tags: ['Python'],
    cta: {
      label: 'Create Devfile Sample',
      href:
        '/import/ns/test?formType=sample&importType=devfile&devfileName=python-basic&git.repository=https%3A%2F%2Fgithub.com%2Fdevfile-samples%2Fdevfile-sample-python-basic.git',
    },
    icon: { url: 'trimmed' },
  },
];
