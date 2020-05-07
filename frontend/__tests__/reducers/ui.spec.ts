import * as Immutable from 'immutable';
import uiReducer, { getDefaultPerspective } from '../../public/reducers/ui';
import { getActivePerspective } from '../../public/reducers/ui-selectors';
import { LAST_PERSPECTIVE_LOCAL_STORAGE_KEY } from '@console/shared';
import { RootState } from '@console/internal/redux-types';
import * as UIActions from '../../public/actions/ui';
import { pluginStore, Perspective } from '../../public/plugins';
import '../../__mocks__/localStorage';

describe('getDefaultPerspective', () => {
  it('should default to undefined', () => {
    expect(getDefaultPerspective()).toBeUndefined();
  });

  it('should default to undefined if perspective is not a valid extension', () => {
    // no registry entry for perspective with id 'test'
    localStorage.setItem(LAST_PERSPECTIVE_LOCAL_STORAGE_KEY, 'test');
    expect(getDefaultPerspective()).toBeUndefined();
  });

  it('should default to perspective extension marked default', () => {
    // return Perspectives extension with one marked as the default
    spyOn(pluginStore, 'getAllExtensions').and.returnValue([
      {
        type: 'Perspective',
        properties: {
          id: 'admin',
          default: true,
        },
      } as Perspective,
    ]);
    expect(getDefaultPerspective()).toBe('admin');
  });

  it('should default to localStorage if perspective is a valid extension', () => {
    // return Perspectives extension whose id matches that in the localStorage
    spyOn(pluginStore, 'getAllExtensions').and.returnValue([
      {
        type: 'Perspective',
        properties: {
          id: 'test',
        },
      } as Perspective,
    ]);
    localStorage.setItem(LAST_PERSPECTIVE_LOCAL_STORAGE_KEY, 'test');
    expect(getDefaultPerspective()).toBe('test');
  });
});

describe('getActivePerspective', () => {
  it('should retrieve active perspective from state', () => {
    const newState = {
      UI: uiReducer(Immutable.Map({}), UIActions.setActivePerspective('test')),
    } as RootState;
    expect(getActivePerspective(newState)).toBe('test');
  });
});
