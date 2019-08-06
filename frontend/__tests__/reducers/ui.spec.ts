import * as Immutable from 'immutable';
import uiReducer, { getActivePerspective, getDefaultPerspective } from '../../public/reducers/ui';
import { LAST_PERSPECTIVE_LOCAL_STORAGE_KEY } from '../../public/const';
import * as UIActions from '../../public/actions/ui';
import { RootState } from '@console/internal/redux';
import * as plugins from '../../public/plugins'; // TODO(vojtech): remove import
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
    spyOn(plugins.registry, 'getPerspectives').and.returnValue([{
      type: 'Perspective',
      properties: {
        id: 'admin',
        default: true,
      },
    } as plugins.Perspective]);
    expect(getDefaultPerspective()).toBe('admin');
  });

  it('should default to localStorage if perspective is a valid extension', () => {
    // return Perspectives extension whose id matches that in the localStorage
    spyOn(plugins.registry, 'getPerspectives').and.returnValue([{
      type: 'Perspective',
      properties: {
        id: 'test',
      },
    } as plugins.Perspective]);
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
