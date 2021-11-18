import { CoreState } from '../../../redux-types';
import { setUser, beginImpersonate, endImpersonate } from '../../actions/core';
import coreReducer from '../core';
import reducerTest from './utils/reducerTest';

describe('Core Reducer', () => {
  const state: CoreState = {};

  it('set user', () => {
    const mockUser = {
      apiVersion: 'user.openshift.io/v1',
      kind: 'User',
      identities: [],
      metadata: {
        name: 'kube:admin',
      },
    };
    reducerTest(coreReducer, state, setUser(mockUser)).expectVal({
      activeNamespace: 'sample-app',
      user: mockUser,
    });
  });

  it('begin Impersonate', () => {
    reducerTest(
      coreReducer,
      state,
      beginImpersonate('User', 'developer', ['Impersonate-User.Y29uc29sZWRldmVsb3Blcg__']),
    ).expectVal({
      activeNamespace: 'sample-app',
      impersonate: {
        kind: 'User',
        name: 'developer',
        subprotocols: ['Impersonate-User.Y29uc29sZWRldmVsb3Blcg__'],
      },
    });
  });

  it('end Impersonate', () => {
    reducerTest(coreReducer, state, endImpersonate()).expectVal({
      activeNamespace: 'sample-app',
    });
  });
});
