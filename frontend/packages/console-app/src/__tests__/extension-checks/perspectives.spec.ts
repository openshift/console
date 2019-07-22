import * as _ from 'lodash';
import { testedRegistry } from '../plugin-test-utils';

describe('Perspective', () => {
  it('duplicate ids are not allowed', () => {
    const perspectives = testedRegistry.getPerspectives();
    const dedupedPerspectives = _.uniqWith(
      perspectives,
      (a, b) => a.properties.id === b.properties.id,
    );
    const duplicatePerspectives = _.difference(perspectives, dedupedPerspectives);

    expect(duplicatePerspectives).toEqual([]);
  });

  it('exactly one default perspective is allowed', () => {
    const perspectives = testedRegistry.getPerspectives();
    const defaultPerspectives = perspectives.filter((p) => p.properties.default);

    expect(defaultPerspectives.length).toBe(1);
    expect(defaultPerspectives[0].properties).toMatchObject({ id: 'admin' });
  });
});
