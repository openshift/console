import {
  CatalogItem,
  CatalogItemMetadataProviderFunction,
} from '@console/dynamic-plugin-sdk/src/extensions';
import { applyCatalogItemMetadata } from '../catalog-utils';

describe('catalog-utils#applyCatalogItemMetadata', () => {
  it('should merge metadata with catalog items', () => {
    const catalogItems: CatalogItem[] = [
      {
        uid: '1',
        type: 'type1',
        name: 'Item 1',
      },
      {
        uid: '2',
        type: 'type2',
        name: 'Item 2',
      },

      {
        uid: '3',
        type: 'type1',
        name: 'Item 3',
        attributes: {
          bindable: true,
        },
        tags: ['tag1'],
        badges: [
          {
            text: 'badge1',
          },
        ],
      },
    ];
    const metadataProviderMap: {
      [type: string]: { [id: string]: CatalogItemMetadataProviderFunction };
    } = {
      type1: {
        '@console/dev-console[49]': () => ({
          tags: ['foo', 'bar'],
          attributes: {
            foo: 'bar',
            asdf: 'qwerty',
          },
          badges: [
            {
              text: 'foo',
              color: 'red',
              variant: 'filled',
            },
          ],
        }),
      },
    };

    const result = applyCatalogItemMetadata(catalogItems, metadataProviderMap);

    expect(result[0].tags).toEqual(['foo', 'bar']);
    expect(result[0].attributes).toEqual({
      foo: 'bar',
      asdf: 'qwerty',
    });
    expect(result[0].badges).toEqual([
      {
        text: 'foo',
        color: 'red',
        variant: 'filled',
      },
    ]);
    expect(result[1]).toEqual(catalogItems[1]);
    expect(result[2].tags).toEqual(['tag1', 'foo', 'bar']);
    expect(result[2].attributes).toEqual({
      bindable: true,
      foo: 'bar',
      asdf: 'qwerty',
    });
    expect(result[2].badges).toEqual([
      {
        text: 'badge1',
      },
      {
        text: 'foo',
        color: 'red',
        variant: 'filled',
      },
    ]);
  });
});
