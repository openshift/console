import { MenuOptionType } from '../menu/menu-types';
import { getMenuOptionType, createMenuOptions } from '../menu/menu-utils';
import { mockActionGroups, mockActions, mockMenuOptions } from './menu-utils-test-data';

describe('Menu utils', () => {
  it('should create menu options using groups extensions', () => {
    const menuOptions = createMenuOptions(mockActions, mockActionGroups);

    expect(menuOptions).toEqual(mockMenuOptions);
  });

  it('should not create any groups if no actions have path for provided action group extensions', () => {
    const actions = [mockActions[2]];
    const menuOptions = createMenuOptions(actions, mockActionGroups);

    expect(menuOptions).toEqual(actions);
  });

  it('should not create top and bottom groups if no actions have their paths', () => {
    const actions = mockActions.slice(1, -1);
    const menuOptions = createMenuOptions(actions, mockActionGroups);

    expect(menuOptions).toEqual(mockMenuOptions.slice(1, -1));
  });

  it('should return correct menu option type for group menu option', () => {
    const menuOptionType = getMenuOptionType(mockMenuOptions[0]);

    expect(menuOptionType).toBe(MenuOptionType.GROUP_MENU);
  });

  it('should return correct menu option type for sub menu option', () => {
    const menuOptionType = getMenuOptionType(mockMenuOptions[1]);

    expect(menuOptionType).toBe(MenuOptionType.SUB_MENU);
  });

  it('should return correct menu option type for atomic menu option', () => {
    const menuOptionType = getMenuOptionType(mockMenuOptions[2]);

    expect(menuOptionType).toBe(MenuOptionType.ATOMIC_MENU);
  });
});
