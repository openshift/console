import { resolvedURLWithParams } from '../add-resources';

describe('add-resources', () => {
  it('should return resolved URL with params', () => {
    expect(resolvedURLWithParams('/import/ns/:namespace', 'xyz', 'my-app', 'nodejs')).toEqual(
      '/import/ns/xyz?application=my-app&action=%7B%22type%22%3A%22connectsTo%22%2C%22payload%22%3A%22nodejs%22%7D',
    );
    expect(resolvedURLWithParams('/samples/ns/:namespace', 'xyz', 'my-app', 'nodejs')).toEqual(
      '/samples/ns/xyz?application=my-app&action=%7B%22type%22%3A%22connectsTo%22%2C%22payload%22%3A%22nodejs%22%7D',
    );
  });
  it('should return resolved URL with application param as UNASSIGNED when application is null', () => {
    expect(resolvedURLWithParams('/import/ns/:namespace', 'xyz', null, 'nodejs')).toEqual(
      '/import/ns/xyz?application=%23UNASSIGNED_APP%23&action=%7B%22type%22%3A%22connectsTo%22%2C%22payload%22%3A%22nodejs%22%7D',
    );
  });
  it('should return resolved URL when contextSource is null', () => {
    expect(resolvedURLWithParams('/import/ns/:namespace', 'xyz', 'my-app', null)).toEqual(
      '/import/ns/xyz?application=my-app',
    );
  });
  it('should return resolved URL when both application and contextSource is null', () => {
    expect(resolvedURLWithParams('/samples/ns/:namespace', 'xyz', null, null)).toEqual(
      '/samples/ns/xyz',
    );
  });
  it('should return resolved URL with params containing connectsTo when service binding is not allowed for operator backed service', () => {
    expect(
      resolvedURLWithParams(
        '/catalog/ns/:namespace?catalogType=OperatorBackedService',
        'xyz',
        'my-app',
        'nodejs',
        false,
      ),
    ).toEqual(
      '/catalog/ns/xyz?catalogType=OperatorBackedService&application=my-app&action=%7B%22type%22%3A%22connectsTo%22%2C%22payload%22%3A%22nodejs%22%7D',
    );
  });
  it('should return resolved URL with params containing serviceBinding when service binding is allowed for operator backed service', () => {
    expect(
      resolvedURLWithParams(
        '/catalog/ns/:namespace?catalogType=OperatorBackedService',
        'xyz',
        'my-app',
        'nodejs',
        true,
      ),
    ).toEqual(
      '/catalog/ns/xyz?catalogType=OperatorBackedService&application=my-app&action=%7B%22type%22%3A%22serviceBinding%22%2C%22payload%22%3A%22nodejs%22%7D',
    );
  });
});
