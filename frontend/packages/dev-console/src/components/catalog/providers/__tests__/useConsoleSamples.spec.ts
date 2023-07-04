import { TFunction } from 'i18next';
import { CatalogItem } from '@console/dynamic-plugin-sdk/src';
import { ConsoleSample } from '../../../../types';
import { normalizeConsoleSamples } from '../useConsoleSamples';
import { gitImportSample, containerImportSample } from './useConsoleSamples.data';

export const t: TFunction = (key: string) =>
  key.includes('~') ? key.substring(key.indexOf('~') + 1) : key;

describe('normalizeConsoleSamples', () => {
  it('should return a correct CatalogItem for a git import sample', () => {
    const actual = normalizeConsoleSamples('my-namespace', t)(gitImportSample);
    const expected: CatalogItem<ConsoleSample> = {
      uid: undefined, // metadata.uid
      type: 'ConsoleSample',
      typeLabel: 'Source to image',
      name: 'nodeinfo-git-sample',
      title: 'Nodeinfo Git Import example',
      description: 'Project to test OpenShift git s2i & Dockerfile import flow',
      provider: 'Red Hat',
      tags: ['JavaScript', 'Node.js', 's2i'],
      icon: {
        url: 'data:image/svg+xml;base64,...',
      },
      cta: {
        label: 'Create',
        href:
          '/import/ns/my-namespace?formType=sample&sample=nodeinfo-git-sample&git.repository=https%3A%2F%2Fgithub.com%2Fopenshift-dev-console%2Fnodejs-sample',
      },
      data: gitImportSample,
    };
    expect(actual).toEqual(expected);
  });

  it('should return a correct CatalogItem for a container import sample', () => {
    const actual = normalizeConsoleSamples('my-namespace', t)(containerImportSample);
    const expected: CatalogItem<ConsoleSample> = {
      uid: undefined, // metadata.uid
      type: 'ConsoleSample',
      typeLabel: 'UBI Container',
      name: 'nodeinfo-container-sample',
      title: 'Nodeinfo Container Import example',
      description: 'Project to test OpenShift import container image flow',
      provider: 'Red Hat',
      tags: ['JavaScript', 'Node.js', 's2i'],
      icon: {
        url: 'data:image/svg+xml;base64,...',
      },
      cta: {
        label: 'Create',
        href:
          '/deploy-image/ns/my-namespace?sample=nodeinfo-container-sample&image=registry.access.redhat.com%2Fubi8%2Fubi-minimal%3A8.8-860',
      },
      data: containerImportSample,
    };
    expect(actual).toEqual(expected);
  });
});
