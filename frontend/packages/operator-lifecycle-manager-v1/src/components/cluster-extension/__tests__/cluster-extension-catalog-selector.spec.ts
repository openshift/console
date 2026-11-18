import { CATALOG_LABEL_KEY } from '../../../const';
import { selectorForCatalogs } from '../cluster-extension-catalog-selector';

describe('selectorForCatalogs', () => {
  it.each([{ catalogs: ['community'] }, { catalogs: ['community', 'certified'] }])(
    'removes conflicting catalog exclusions for $catalogs',
    ({ catalogs }) => {
      const selector = {
        matchLabels: { provider: 'trusted' },
        matchExpressions: [
          { key: CATALOG_LABEL_KEY, operator: 'NotIn', values: ['community', 'other'] },
          { key: CATALOG_LABEL_KEY, operator: 'DoesNotExist' },
          { key: CATALOG_LABEL_KEY, operator: 'NotIn', values: ['excluded'] },
          { key: CATALOG_LABEL_KEY, operator: 'Exists' },
          { key: 'support', operator: 'DoesNotExist' },
          { key: 'provider', operator: 'NotIn', values: ['community'] },
          { key: 'category', operator: 'In', values: ['database'] },
        ],
      };

      const result = selectorForCatalogs(catalogs, selector);

      expect(result).toEqual({
        matchLabels: {
          provider: 'trusted',
          ...(catalogs.length === 1 ? { [CATALOG_LABEL_KEY]: catalogs[0] } : {}),
        },
        matchExpressions: [
          ...selector.matchExpressions.slice(2),
          ...(catalogs.length > 1
            ? [{ key: CATALOG_LABEL_KEY, operator: 'In', values: catalogs }]
            : []),
        ],
      });
    },
  );

  it('preserves exclusions even when catalog names are unchanged', () => {
    const selector = {
      matchLabels: { [CATALOG_LABEL_KEY]: 'community' },
      matchExpressions: [
        { key: CATALOG_LABEL_KEY, operator: 'NotIn', values: ['community'] },
        { key: CATALOG_LABEL_KEY, operator: 'DoesNotExist' },
      ],
    };

    expect(selectorForCatalogs(['community'], selector)).toBe(selector);
  });

  it('preserves partially overlapping catalog inclusions and exclusions', () => {
    const selector = {
      matchExpressions: [
        { key: CATALOG_LABEL_KEY, operator: 'In', values: ['redhat', 'community'] },
        { key: CATALOG_LABEL_KEY, operator: 'NotIn', values: ['community'] },
      ],
    };

    expect(selectorForCatalogs(['redhat', 'community'], selector)).toBe(selector);
  });

  it('preserves exclusions when clearing a catalog selection', () => {
    const matchExpressions = [
      { key: CATALOG_LABEL_KEY, operator: 'NotIn', values: ['community'] },
      { key: CATALOG_LABEL_KEY, operator: 'DoesNotExist' },
    ];

    expect(
      selectorForCatalogs([], {
        matchLabels: { [CATALOG_LABEL_KEY]: 'old-catalog' },
        matchExpressions: [
          { key: CATALOG_LABEL_KEY, operator: 'In', values: ['old-catalog'] },
          ...matchExpressions,
        ],
      }),
    ).toEqual({ matchExpressions });
  });

  it('preserves unchanged selectors without conflicts', () => {
    const selector = {
      matchExpressions: [
        { key: CATALOG_LABEL_KEY, operator: 'In', values: ['community', 'certified'] },
        { key: CATALOG_LABEL_KEY, operator: 'NotIn', values: ['excluded'] },
      ],
    };

    expect(selectorForCatalogs(['community', 'certified'], selector)).toBe(selector);
  });

  it('replaces existing catalog In expressions when names change', () => {
    expect(
      selectorForCatalogs(['community', 'certified'], {
        matchExpressions: [
          { key: CATALOG_LABEL_KEY, operator: 'In', values: ['old-catalog'] },
          { key: 'category', operator: 'In', values: ['database'] },
        ],
      }),
    ).toEqual({
      matchExpressions: [
        { key: 'category', operator: 'In', values: ['database'] },
        { key: CATALOG_LABEL_KEY, operator: 'In', values: ['community', 'certified'] },
      ],
    });
  });
});
