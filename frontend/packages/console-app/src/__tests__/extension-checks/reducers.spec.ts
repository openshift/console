import * as _ from 'lodash';
import { testedExtensions } from '../plugin-test-utils';
import { isReduxReducer } from '@console/plugin-sdk';

describe('ReduxReducer', () => {
  it('duplicate namespaces are not allowed', () => {
    const reducers = testedExtensions.toArray().filter(isReduxReducer);
    const dedupedReducers = _.uniqWith(
      reducers,
      (a, b) => a.properties.namespace === b.properties.namespace,
    );
    const duplicateReducers = _.difference(reducers, dedupedReducers);

    expect(duplicateReducers).toEqual([]);
  });
});
