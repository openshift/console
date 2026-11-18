import { render } from '@testing-library/react';
import type { ExtensionHookResult } from '@console/dynamic-plugin-sdk/src/api/common-types';
import type { CatalogCategory } from '@console/dynamic-plugin-sdk/src/extensions/catalog';
import CatalogCategoryProviderResolver from '../CatalogCategoryProviderResolver';

const categories: CatalogCategory[] = [{ id: 'database', label: 'Database', tags: ['database'] }];

describe('CatalogCategoryProviderResolver', () => {
  it('should resolve categories from an SDK hook after loading', () => {
    const onValueResolved = jest.fn();
    const useValue = jest.fn<ExtensionHookResult<CatalogCategory[]>, []>(() => [
      categories,
      false,
      undefined,
    ]);
    const { rerender } = render(
      <CatalogCategoryProviderResolver
        id="sdk-provider"
        useValue={useValue}
        onValueResolved={onValueResolved}
      />,
    );
    expect(onValueResolved).not.toHaveBeenCalled();

    useValue.mockReturnValue([categories, true, undefined]);
    rerender(
      <CatalogCategoryProviderResolver
        id="sdk-provider"
        useValue={useValue}
        onValueResolved={onValueResolved}
      />,
    );
    expect(onValueResolved).toHaveBeenCalledWith(categories, 'sdk-provider');
  });

  it('should still resolve categories from legacy array providers', () => {
    const onValueResolved = jest.fn();
    render(
      <CatalogCategoryProviderResolver
        id="legacy-provider"
        useValue={() => categories}
        onValueResolved={onValueResolved}
      />,
    );
    expect(onValueResolved).toHaveBeenCalledWith(categories, 'legacy-provider');
  });
});
