import { edgesFromAnnotations } from '../connector-utils';

describe('connector-utils', () => {
  describe('edgeFromAnnotations utils', () => {
    it('should return empty array if connects-to annotation is not present', () => {
      expect(edgesFromAnnotations({})).toEqual([]);
    });

    it('should return string value if connects-to anotation as single value', () => {
      expect(edgesFromAnnotations({ 'app.openshift.io/connects-to': 'abcd' })).toEqual(['abcd']);
    });

    it('should return array of values if connects-to anotation as multiple value', () => {
      expect(
        edgesFromAnnotations({ 'app.openshift.io/connects-to': 'abcd, mock, value' }),
      ).toEqual(['abcd', 'mock', 'value']);
    });
  });
});
