import { CoreState } from '../../../redux-types';
import { setUser, beginImpersonate, endImpersonate } from '../../actions/core';
import { coreReducer } from '../core';
import reducerTest from './utils/reducerTest';

describe('Core Reducer', () => {
  const state: CoreState = {};

  it('set user', () => {
    const mockUser = {
      username: 'kube:admin',
    };
    reducerTest(coreReducer, state, setUser(mockUser)).expectVal({
      user: mockUser,
    });
  });

  it('begin Impersonate', () => {
    reducerTest(
      coreReducer,
      state,
      beginImpersonate('User', 'developer', ['Impersonate-User.Y29uc29sZWRldmVsb3Blcg__']),
    ).expectVal({
      impersonate: {
        kind: 'User',
        name: 'developer',
        subprotocols: ['Impersonate-User.Y29uc29sZWRldmVsb3Blcg__'],
      },
    });
  });

  it('end Impersonate', () => {
    reducerTest(coreReducer, state, endImpersonate()).expectVal({});
  });
});
