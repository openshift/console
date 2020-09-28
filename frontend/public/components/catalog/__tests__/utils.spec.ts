import { toTitleCase } from '../utils';

describe('Catalog utils', () => {
  it('Converts string to titleCase correctly', () => {
    expect(toTitleCase('ibm-b2bi-prod')).toBe('Ibm B2bi Prod');
    expect(toTitleCase('IBM-b2BI-prod')).toBe('IBM B2BI Prod');
    expect(toTitleCase('ibm-b2bi-prod--ibm-helm-catalog')).toBe('Ibm B2bi Prod  Ibm Helm Catalog');
  });
});
