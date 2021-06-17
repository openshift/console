import { CatalogItem } from '@console/dynamic-plugin-sdk/src';
import { DevfileSample } from '../../../import/devfile/devfile-types';

export const devfileSamples: DevfileSample[] = [
  {
    name: 'nodejs-basic',
    displayName: 'Basic NodeJS',
    description: 'A simple Hello world NodeJS application',
    icon: 'trimmed',
    tags: ['NodeJS', 'Express'],
    projectType: 'nodejs',
    language: 'nodejs',
    git: {
      remotes: {
        origin: 'https://github.com/redhat-developer/devfile-sample.git',
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
        origin: 'https://github.com/elsony/devfile-sample-code-with-quarkus.git',
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
        origin: 'https://github.com/elsony/devfile-sample-java-springboot-basic.git',
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
        origin: 'https://github.com/elsony/devfile-sample-python-basic.git',
      },
    },
  },
];

export const expectedCatalogItems: CatalogItem[] = [
  {
    uid: 'nodejs-basic',
    type: 'Sample',
    name: 'Basic NodeJS',
    description: 'A simple Hello world NodeJS application',
    tags: ['NodeJS', 'Express'],
    cta: {
      label: 'Create Devfile Sample',
      href:
        '/import?importType=devfile&formType=sample&devfileName=nodejs-basic&gitRepo=https://github.com/redhat-developer/devfile-sample.git',
    },
    icon: { url: 'data:image/png;base64,trimmed' },
  },
  {
    uid: 'code-with-quarkus',
    type: 'Sample',
    name: 'Basic Quarkus',
    description: 'A simple Hello World Java application using Quarkus',
    tags: ['Java', 'Quarkus'],
    cta: {
      label: 'Create Devfile Sample',
      href:
        '/import?importType=devfile&formType=sample&devfileName=code-with-quarkus&gitRepo=https://github.com/elsony/devfile-sample-code-with-quarkus.git',
    },
    icon: { url: 'data:image/png;base64,trimmed' },
  },
  {
    uid: 'java-springboot-basic',
    type: 'Sample',
    name: 'Basic Spring Boot',
    description: 'A simple Hello World Java Spring Boot application using Maven',
    tags: ['Java', 'Spring'],
    cta: {
      label: 'Create Devfile Sample',
      href:
        '/import?importType=devfile&formType=sample&devfileName=java-springboot-basic&gitRepo=https://github.com/elsony/devfile-sample-java-springboot-basic.git',
    },
    icon: { url: 'data:image/png;base64,trimmed' },
  },
  {
    uid: 'python-basic',
    type: 'Sample',
    name: 'Basic Python',
    description: 'A simple Hello World application using Python',
    tags: ['Python'],
    cta: {
      label: 'Create Devfile Sample',
      href:
        '/import?importType=devfile&formType=sample&devfileName=python-basic&gitRepo=https://github.com/elsony/devfile-sample-python-basic.git',
    },
    icon: { url: 'data:image/png;base64,trimmed' },
  },
];
