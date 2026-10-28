import { OLMCatalogVersion } from '../../const';
import { operatorCatalogComparator } from '../filters';

describe('operatorCatalogComparator', () => {
  it('places cluster extensions before Classic Operators regardless of provider order', () => {
    expect(
      [OLMCatalogVersion.OLMv0, OLMCatalogVersion.OLMv1].sort(operatorCatalogComparator),
    ).toEqual([OLMCatalogVersion.OLMv1, OLMCatalogVersion.OLMv0]);
    expect(
      [OLMCatalogVersion.OLMv1, OLMCatalogVersion.OLMv0].sort(operatorCatalogComparator),
    ).toEqual([OLMCatalogVersion.OLMv1, OLMCatalogVersion.OLMv0]);
  });

  it('treats identical catalog values as equal', () => {
    expect(operatorCatalogComparator(OLMCatalogVersion.OLMv1, OLMCatalogVersion.OLMv1)).toBe(0);
  });
});
