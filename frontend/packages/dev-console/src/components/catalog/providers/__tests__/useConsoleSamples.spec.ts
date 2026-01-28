import { renderHook } from '@testing-library/react';
import { CatalogItem } from '@console/dynamic-plugin-sdk/src';
import { ConsoleSample } from '../../../../types';
import { normalizeConsoleSamples, useConsoleSamplesCatalogProvider } from '../useConsoleSamples';
import { gitImportSample, containerImportSample } from './useConsoleSamples.data';

const mockUseSamples = jest.fn();
const mockUseTranslation = jest.fn();

jest.mock('../../../../utils/samples', () => ({
  ...jest.requireActual('../../../../utils/samples'),
  useSamples: () => mockUseSamples(),
}));

jest.mock('react-i18next', () => ({
  useTranslation: () => mockUseTranslation(),
  withTranslation: () => (Component: any) => Component,
  Trans: ({ children }: { children: any }) => children,
}));

export const t = (key: string): string =>
  key.includes('~') ? key.substring(key.indexOf('~') + 1) : key;

const ns = 'test-ns';

beforeEach(() => {
  jest.clearAllMocks();
  mockUseTranslation.mockReturnValue({
    i18n: { language: 'en' },
    t,
  });
});

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

describe('useConsoleSamplesCatalogProvider', () => {
  it('should return loading state when samples are not loaded', () => {
    mockUseSamples.mockReturnValue([[], false, undefined]);

    const { result } = renderHook(() => useConsoleSamplesCatalogProvider({ namespace: ns }));

    expect(result.current).toEqual([[], false, undefined]);
  });

  it('should return catalog items when samples are loaded', () => {
    const samples = [gitImportSample, containerImportSample];
    mockUseSamples.mockReturnValue([samples, true, undefined]);

    const { result } = renderHook(() => useConsoleSamplesCatalogProvider({ namespace: ns }));

    const [catalogItems, loaded, error] = result.current;

    expect(loaded).toBe(true);
    expect(error).toBeUndefined();
    expect(catalogItems).toHaveLength(2);
    // Items are sorted alphabetically by title
    expect(catalogItems[0]).toMatchObject({
      type: 'ConsoleSample',
      name: 'nodeinfo-container-sample',
      title: 'Nodeinfo Container Import example',
    });
    expect(catalogItems[0].cta.href).toContain(`/ns/${ns}`);
    expect(catalogItems[1]).toMatchObject({
      type: 'ConsoleSample',
      name: 'nodeinfo-git-sample',
      title: 'Nodeinfo Git Import example',
    });
    expect(catalogItems[1].cta.href).toContain(`/ns/${ns}`);
  });

  it('should filter out samples with hidden tag', () => {
    const hiddenSample: ConsoleSample = {
      ...gitImportSample,
      metadata: { name: 'hidden-sample' },
      spec: {
        ...gitImportSample.spec,
        title: 'Hidden Sample',
        tags: ['hidden'],
      },
    };
    const samples = [gitImportSample, hiddenSample];
    mockUseSamples.mockReturnValue([samples, true, undefined]);

    const { result } = renderHook(() => useConsoleSamplesCatalogProvider({ namespace: ns }));

    const [catalogItems] = result.current;

    expect(catalogItems).toHaveLength(1);
    expect(catalogItems[0].name).toBe('nodeinfo-git-sample');
  });

  it('should return error state when samples fail to load', () => {
    const error = new Error('Failed to load samples');
    mockUseSamples.mockReturnValue([[], false, error]);

    const { result } = renderHook(() => useConsoleSamplesCatalogProvider({ namespace: ns }));

    expect(result.current).toEqual([[], false, error]);
  });

  it('should use namespace parameter in normalized catalog items', () => {
    const testNamespace = 'custom-namespace';
    const samples = [gitImportSample];
    mockUseSamples.mockReturnValue([samples, true, undefined]);

    const { result } = renderHook(() =>
      useConsoleSamplesCatalogProvider({ namespace: testNamespace }),
    );

    const [catalogItems] = result.current;

    expect(catalogItems[0].cta.href).toContain(`/ns/${testNamespace}`);
  });

  it('should sort samples by title', () => {
    const sampleA: ConsoleSample = {
      ...gitImportSample,
      metadata: { name: 'sample-a' },
      spec: { ...gitImportSample.spec, title: 'Zebra Sample' },
    };
    const sampleB: ConsoleSample = {
      ...gitImportSample,
      metadata: { name: 'sample-b' },
      spec: { ...gitImportSample.spec, title: 'Alpha Sample' },
    };
    const samples = [sampleA, sampleB];
    mockUseSamples.mockReturnValue([samples, true, undefined]);

    const { result } = renderHook(() => useConsoleSamplesCatalogProvider({ namespace: ns }));

    const [catalogItems] = result.current;

    expect(catalogItems[0].title).toBe('Alpha Sample');
    expect(catalogItems[1].title).toBe('Zebra Sample');
  });
});
