import * as _ from 'lodash';
import { testedExtensions } from '../plugin-test-utils';
import { isPerspective } from '@console/plugin-sdk';

describe('Perspective', () => {
  it('duplicate ids are not allowed', () => {
    const perspectives = testedExtensions.toArray().filter(isPerspective);
    const dedupedPerspectives = _.uniqWith(
      perspectives,
      (a, b) => a.properties.id === b.properties.id,
    );
    const duplicatePerspectives = _.difference(perspectives, dedupedPerspectives);

    expect(duplicatePerspectives).toEqual([]);
  });

  it('exactly one default perspective is allowed', () => {
    const perspectives = testedExtensions.toArray().filter(isPerspective);
    const defaultPerspectives = perspectives.filter((p) => p.properties.default);

    expect(defaultPerspectives.length).toBe(1);
    expect(defaultPerspectives[0].properties).toMatchObject({ id: 'admin' });
  });
});
