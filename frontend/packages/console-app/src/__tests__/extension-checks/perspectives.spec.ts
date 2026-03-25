import { useExtensions } from '@openshift/dynamic-plugin-sdk';
import * as _ from 'lodash';
import { isPerspective } from '@console/dynamic-plugin-sdk';
import { renderHookWithProviders } from '@console/shared/src/test-utils/unit-test-utils';

describe('Perspective', () => {
  it('duplicate ids are not allowed', async () => {
    const { result } = renderHookWithProviders(() => useExtensions(isPerspective));
    const perspectives = result.current;

    const dedupedPerspectives = _.uniqWith(
      perspectives,
      (a, b) => a.properties.id === b.properties.id,
    );
    const duplicatePerspectives = _.difference(perspectives, dedupedPerspectives);

    expect(duplicatePerspectives).toEqual([]);
  });

  it('exactly one default perspective is allowed', async () => {
    const { result } = renderHookWithProviders(() => useExtensions(isPerspective));
    const perspectives = result.current;

    const defaultPerspectives = perspectives.filter((p) => p.properties.default);

    expect(defaultPerspectives.length).toBe(1);
    expect(defaultPerspectives[0].properties).toMatchObject({ id: 'admin' });
  });
});
