import { createSvgIdUrl } from '../svg-utils';
import { mockLocation } from '../../test/browser-mock';

describe('svg-utils#createSvgIdUrl', () => {
  it('should return absolute url based on pathname and search', () => {
    mockLocation({
      pathname: '/foo/bar',
      search: '?key=value',
    });
    expect(createSvgIdUrl('testid')).toBe('url(/foo/bar?key=value#testid)');
  });
});
