import { ConsoleSample } from '../../types/samples';

export const gitImportSample: ConsoleSample = {
  apiVersion: 'console.openshift.io/v1',
  kind: 'ConsoleSample',
  metadata: { name: 'nodeinfo-git-sample' },
  spec: {
    title: 'Nodeinfo Git Import example',
    abstract: 'Project to test OpenShift git s2i & Dockerfile import flow',
    description: '# About this project\nProject to test OpenShift git import flow\n',
    icon: 'data:image/svg+xml;base64,...',
    provider: 'Red Hat',
    type: 'Source to image',
    tags: ['JavaScript', 'Node.js', 's2i'],
    source: {
      type: 'GitImport',
      gitImport: {
        repository: {
          url: 'https://github.com/openshift-dev-console/nodejs-sample',
        },
      },
    },
  },
};

export const containerImportSample: ConsoleSample = {
  apiVersion: 'console.openshift.io/v1',
  kind: 'ConsoleSample',
  metadata: { name: 'nodeinfo-container-sample' },
  spec: {
    title: 'Nodeinfo Container Import example',
    abstract: 'Project to test OpenShift import container image flow',
    description: '# About this project\nProject to test OpenShift import container image flow\n',
    icon: 'data:image/svg+xml;base64,...',
    provider: 'Red Hat',
    type: 'UBI Container',
    tags: ['JavaScript', 'Node.js', 's2i'],
    source: {
      type: 'ContainerImport',
      containerImport: {
        image: 'registry.access.redhat.com/ubi8/ubi-minimal:8.8-860',
      },
    },
  },
};

const getPseudoTranslatedConsoleSample = (
  sample: ConsoleSample,
  lang?: string,
  country?: string,
): ConsoleSample => {
  return {
    ...sample,
    metadata: {
      ...sample.metadata,
      name: `${sample.metadata.name}${lang ? `-${lang}` : ''}${country ? `-${country}` : ''}`,
      labels: {
        ...sample.metadata.labels,
        'console.openshift.io/name': sample.metadata.name,
        'console.openshift.io/lang': lang,
        'console.openshift.io/country': country,
      },
    },
    spec: {
      ...sample.spec,
      title: `${sample.spec.title}${lang ? ` ${lang}` : ''}${country ? `-${country}` : ''}`,
    },
  };
};

export const translatedGitImportSamples: ConsoleSample[] = [
  getPseudoTranslatedConsoleSample(gitImportSample),
  getPseudoTranslatedConsoleSample(gitImportSample, 'en', 'US'),
  getPseudoTranslatedConsoleSample(gitImportSample, 'EN', 'CA'),
  getPseudoTranslatedConsoleSample(gitImportSample, 'fr', 'CA'),
  getPseudoTranslatedConsoleSample(gitImportSample, 'fr'),
  getPseudoTranslatedConsoleSample(gitImportSample, 'de', 'DE'),
  getPseudoTranslatedConsoleSample(gitImportSample, 'de', 'AT'),
];

export const translatedContainerImportSamples: ConsoleSample[] = [
  getPseudoTranslatedConsoleSample(containerImportSample),
  getPseudoTranslatedConsoleSample(containerImportSample, 'en', 'US'),
  getPseudoTranslatedConsoleSample(containerImportSample, 'EN', 'CA'),
  getPseudoTranslatedConsoleSample(containerImportSample, 'fr', 'CA'),
  getPseudoTranslatedConsoleSample(containerImportSample, 'fr'),
  getPseudoTranslatedConsoleSample(containerImportSample, 'de', 'DE'),
  getPseudoTranslatedConsoleSample(containerImportSample, 'de', 'AT'),
];

export const translatedSamples: ConsoleSample[] = [
  ...translatedGitImportSamples,
  ...translatedContainerImportSamples,
];
