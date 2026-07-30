import { renderHook } from '@testing-library/react';
import { useActivePerspective } from '@console/dynamic-plugin-sdk/src/lib-core';
import type { NavExtension } from '@console/dynamic-plugin-sdk/src/lib-core';
import type { LoadedExtension } from '@console/dynamic-plugin-sdk/src/types';
import { useNavExtensionsForPerspective } from '../useNavExtensionForPerspective';
import { useNavExtensionsForSection } from '../useNavExtensionsForSection';

jest.mock('@console/dynamic-plugin-sdk/src/lib-core', () => ({
  useActivePerspective: jest.fn(),
}));

jest.mock('../useNavExtensionForPerspective', () => ({
  useNavExtensionsForPerspective: jest.fn(),
}));

const createNavExtension = (
  id: string,
  section?: string,
  insertAfter?: string,
): LoadedExtension<NavExtension> =>
  ({
    type: 'console.navigation/href',
    uid: `uid-${id}`,
    properties: {
      id,
      name: `Nav ${id}`,
      href: `/${id}`,
      section,
      insertAfter,
    },
  } as LoadedExtension<NavExtension>);

describe('useNavExtensionsForSection', () => {
  const mockSetPerspective = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    (useActivePerspective as jest.Mock).mockReturnValue(['admin', mockSetPerspective]);
    (useNavExtensionsForPerspective as jest.Mock).mockReturnValue([]);
  });

  it('should return empty array when no extensions for section', () => {
    (useNavExtensionsForPerspective as jest.Mock).mockReturnValue([]);

    const { result } = renderHook(() => useNavExtensionsForSection('workloads'));

    expect(result.current).toEqual([]);
  });

  it('should return extensions matching the section', () => {
    const workloadsExt = createNavExtension('pods', 'workloads');
    const networkingExt = createNavExtension('services', 'networking');
    (useNavExtensionsForPerspective as jest.Mock).mockReturnValue([workloadsExt, networkingExt]);

    const { result } = renderHook(() => useNavExtensionsForSection('workloads'));

    expect(result.current).toHaveLength(1);
    expect(result.current[0].properties.id).toBe('pods');
  });

  it('should sort extensions using getSortedNavExtensions', () => {
    const ext1 = createNavExtension('deployments', 'workloads');
    const ext2 = createNavExtension('pods', 'workloads', 'deployments');
    (useNavExtensionsForPerspective as jest.Mock).mockReturnValue([ext2, ext1]);

    const { result } = renderHook(() => useNavExtensionsForSection('workloads'));

    expect(result.current).toHaveLength(2);
    expect(result.current[0].properties.id).toBe('deployments');
    expect(result.current[1].properties.id).toBe('pods');
  });

  it('should use active perspective from hook', () => {
    (useActivePerspective as jest.Mock).mockReturnValue(['dev', mockSetPerspective]);
    (useNavExtensionsForPerspective as jest.Mock).mockReturnValue([]);

    renderHook(() => useNavExtensionsForSection('workloads'));

    expect(useNavExtensionsForPerspective).toHaveBeenCalledWith('dev');
  });

  it('should filter extensions by exact section match', () => {
    const workloadsExt = createNavExtension('pods', 'workloads');
    const workloads2Ext = createNavExtension('deployments', 'workloads-extra');
    (useNavExtensionsForPerspective as jest.Mock).mockReturnValue([workloadsExt, workloads2Ext]);

    const { result } = renderHook(() => useNavExtensionsForSection('workloads'));

    expect(result.current).toHaveLength(1);
    expect(result.current[0].properties.id).toBe('pods');
  });

  it('should memoize result when inputs unchanged', () => {
    const ext1 = createNavExtension('pods', 'workloads');
    (useNavExtensionsForPerspective as jest.Mock).mockReturnValue([ext1]);

    const { result, rerender } = renderHook(() => useNavExtensionsForSection('workloads'));
    const firstResult = result.current;

    rerender();

    expect(result.current).toBe(firstResult);
  });

  it('should update result when extensions change', () => {
    const ext1 = createNavExtension('pods', 'workloads');
    (useNavExtensionsForPerspective as jest.Mock).mockReturnValue([ext1]);

    const { result, rerender } = renderHook(() => useNavExtensionsForSection('workloads'));
    const firstResult = result.current;

    const ext2 = createNavExtension('deployments', 'workloads');
    (useNavExtensionsForPerspective as jest.Mock).mockReturnValue([ext1, ext2]);
    rerender();

    expect(result.current).not.toBe(firstResult);
    expect(result.current).toHaveLength(2);
  });
});
