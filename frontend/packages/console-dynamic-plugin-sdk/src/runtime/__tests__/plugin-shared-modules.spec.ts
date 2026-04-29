import type { getSharedScope } from '../plugin-shared-modules';
import { monkeyPatchSharedScope } from '../plugin-shared-modules';

describe('monkeyPatchSharedScope', () => {
  it('adds aliased modules to share scope object', () => {
    const getModule = jest.fn();

    const testScope: ReturnType<typeof getSharedScope> = {
      'react-router': {
        '7.13.1': { from: 'openshift-console', eager: true, loaded: 1, get: getModule },
      },
    };

    monkeyPatchSharedScope(testScope);

    expect(Object.keys(testScope)).toEqual([
      'react-router',
      'react-router-dom',
      'react-router-dom-v5-compat',
    ]);

    expect(testScope['react-router']).toEqual({
      '7.13.1': { from: 'openshift-console', eager: true, loaded: 1, get: getModule },
    });

    expect(testScope['react-router-dom']).toEqual(testScope['react-router']);
    expect(testScope['react-router-dom-v5-compat']).toEqual(testScope['react-router']);
  });
});
