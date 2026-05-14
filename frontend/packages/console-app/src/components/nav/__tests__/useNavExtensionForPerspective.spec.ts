import { renderHook } from '@testing-library/react';
import type { NavExtension } from '@console/dynamic-plugin-sdk/src/lib-core';
import type { LoadedExtension } from '@console/dynamic-plugin-sdk/src/types';
import { useExtensions } from '@console/plugin-sdk/src/api/useExtensions';
import { usePerspectives } from '@console/shared/src/hooks/usePerspectives';
import { useNavExtensionsForPerspective } from '../useNavExtensionForPerspective';

jest.mock('@console/plugin-sdk/src/api/useExtensions', () => ({
  useExtensions: jest.fn(),
}));

jest.mock('@console/shared/src/hooks/usePerspectives', () => ({
  usePerspectives: jest.fn(),
}));

const createNavExtension = (id: string, perspective?: string): LoadedExtension<NavExtension> =>
  ({
    type: 'console.navigation/href',
    uid: `uid-${id}`,
    properties: {
      id,
      name: `Nav ${id}`,
      href: `/${id}`,
      perspective,
    },
  } as LoadedExtension<NavExtension>);

const createPerspective = (id: string, isDefault = false) => ({
  uid: `perspective-${id}`,
  properties: {
    id,
    name: id.charAt(0).toUpperCase() + id.slice(1),
    default: isDefault,
  },
});

describe('useNavExtensionsForPerspective', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (usePerspectives as jest.Mock).mockReturnValue([]);
    (useExtensions as jest.Mock).mockReturnValue([]);
  });

  it('should return empty array when no extensions exist', () => {
    (useExtensions as jest.Mock).mockReturnValue([]);

    const { result } = renderHook(() => useNavExtensionsForPerspective('admin'));

    expect(result.current).toEqual([]);
  });

  it('should return extensions matching the perspective', () => {
    const adminExtension = createNavExtension('admin-nav', 'admin');
    const devExtension = createNavExtension('dev-nav', 'dev');
    (useExtensions as jest.Mock).mockReturnValue([adminExtension, devExtension]);

    const { result } = renderHook(() => useNavExtensionsForPerspective('admin'));

    expect(result.current).toHaveLength(1);
    expect(result.current[0].properties.id).toBe('admin-nav');
  });

  it('should include extensions without perspective for default perspective', () => {
    const adminPerspective = createPerspective('admin', true);
    const noPerspectiveExtension = createNavExtension('global-nav');
    const adminExtension = createNavExtension('admin-nav', 'admin');

    (usePerspectives as jest.Mock).mockReturnValue([adminPerspective]);
    (useExtensions as jest.Mock).mockReturnValue([noPerspectiveExtension, adminExtension]);

    const { result } = renderHook(() => useNavExtensionsForPerspective('admin'));

    expect(result.current).toHaveLength(2);
  });

  it('should not include extensions without perspective for non-default perspective', () => {
    const adminPerspective = createPerspective('admin', true);
    const devPerspective = createPerspective('dev', false);
    const noPerspectiveExtension = createNavExtension('global-nav');
    const devExtension = createNavExtension('dev-nav', 'dev');

    (usePerspectives as jest.Mock).mockReturnValue([adminPerspective, devPerspective]);
    (useExtensions as jest.Mock).mockReturnValue([noPerspectiveExtension, devExtension]);

    const { result } = renderHook(() => useNavExtensionsForPerspective('dev'));

    expect(result.current).toHaveLength(1);
    expect(result.current[0].properties.id).toBe('dev-nav');
  });

  it('should handle undefined perspectives array', () => {
    (usePerspectives as jest.Mock).mockReturnValue(undefined);
    const adminExtension = createNavExtension('admin-nav', 'admin');
    (useExtensions as jest.Mock).mockReturnValue([adminExtension]);

    const { result } = renderHook(() => useNavExtensionsForPerspective('admin'));

    expect(result.current).toHaveLength(1);
  });

  it('should return new array reference when extensions change', () => {
    const ext1 = createNavExtension('nav-1', 'admin');
    const ext2 = createNavExtension('nav-2', 'admin');

    (useExtensions as jest.Mock).mockReturnValue([ext1]);

    const { result, rerender } = renderHook(() => useNavExtensionsForPerspective('admin'));
    const firstResult = result.current;

    (useExtensions as jest.Mock).mockReturnValue([ext1, ext2]);
    rerender();

    expect(result.current).not.toBe(firstResult);
    expect(result.current).toHaveLength(2);
  });

  it('should handle multiple perspectives with same extension', () => {
    const adminPerspective = createPerspective('admin', false);
    const devPerspective = createPerspective('dev', true);
    const sharedExtension = createNavExtension('shared-nav');

    (usePerspectives as jest.Mock).mockReturnValue([adminPerspective, devPerspective]);
    (useExtensions as jest.Mock).mockReturnValue([sharedExtension]);

    // For default perspective (dev), should include extensions without perspective
    const { result: devResult } = renderHook(() => useNavExtensionsForPerspective('dev'));
    expect(devResult.current).toHaveLength(1);

    // For non-default perspective (admin), should not include
    const { result: adminResult } = renderHook(() => useNavExtensionsForPerspective('admin'));
    expect(adminResult.current).toHaveLength(0);
  });
});
