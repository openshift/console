import * as _ from 'lodash';
import { isPerspective } from '@console/dynamic-plugin-sdk';
import { testedExtensions } from '../plugin-test-utils';

describe('Perspective', () => {
  // TODO need to load console-extensions.json for tests to function
  xit('duplicate ids are not allowed', () => {
    const perspectives = testedExtensions.toArray().filter(isPerspective);
    const dedupedPerspectives = _.uniqWith(
      perspectives,
      (a, b) => a.properties.id === b.properties.id,
    );
    const duplicatePerspectives = _.difference(perspectives, dedupedPerspectives);

    expect(duplicatePerspectives).toEqual([]);
  });

  xit('exactly one default perspective is allowed', () => {
    const perspectives = testedExtensions.toArray().filter(isPerspective);
    const defaultPerspectives = perspectives.filter((p) => p.properties.default);

    expect(defaultPerspectives.length).toBe(1);
    expect(defaultPerspectives[0].properties).toMatchObject({ id: 'admin' });
  });
});
