import * as _ from 'lodash';
import { testedRegistry } from '../plugin-test-utils';

describe('ReduxReducer', () => {
  it('duplicate namespaces are not allowed', () => {
    const reducers = testedRegistry.getReduxReducers();
    const dedupedReducers = _.uniqWith(
      reducers,
      (a, b) => a.properties.namespace === b.properties.namespace,
    );
    const duplicateReducers = _.difference(reducers, dedupedReducers);

    expect(duplicateReducers).toEqual([]);
  });
});
