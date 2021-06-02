import { AddAction, ResolvedExtension } from '@console/dynamic-plugin-sdk';
import { ALL_NAMESPACES_KEY } from '@console/shared';
import {
  addActionExtensions,
  addActionGroupExtensions,
  addActionsWithoutValidGroupId,
} from '../../components/add/__tests__/add-page-test-data';
import { AddGroup } from '../../components/types';
import { getAddGroups, resolvedHref, filterNamespaceScopedUrl } from '../add-page-utils';

describe('getAddGroups', () => {
  it('should return empty array if addActions is not defined', () => {
    expect(getAddGroups(undefined, addActionGroupExtensions).length).toEqual(0);
  });

  it('should return empty array if addActions is not defined', () => {
    expect(getAddGroups(addActionExtensions, undefined).length).toEqual(0);
  });

  it('should add actions to their respective action groups', () => {
    const devCatalogGroupItems: ResolvedExtension<
      AddAction
    >[] = addActionExtensions.filter((action) =>
      action.properties.groupId.includes('developer-catalog'),
    );
    const addGroups: AddGroup[] = getAddGroups(addActionExtensions, addActionGroupExtensions);
    expect(addGroups.find((group) => group.id === 'developer-catalog').items.length).toEqual(
      devCatalogGroupItems.length,
    );
  });

  it('should filter out the groups for which there are no add actions', () => {
    const addActionsExcludingDevCatalogGroupItems: ResolvedExtension<
      AddAction
    >[] = addActionExtensions.filter(
      (action) => !action.properties.groupId.includes('developer-catalog'),
    );
    const addGroups: AddGroup[] = getAddGroups(
      addActionsExcludingDevCatalogGroupItems,
      addActionGroupExtensions,
    );
    expect(addGroups.find((group) => group.id === 'developer-catalog')).toBeUndefined();
  });

  it('should create an action group for an add action which does not have a groupId or for which no groupId matches the current add groups', () => {
    const mockAddExtensions: ResolvedExtension<AddAction>[] = [
      ...addActionExtensions,
      ...addActionsWithoutValidGroupId,
    ];
    const addGroups: AddGroup[] = getAddGroups(mockAddExtensions, addActionGroupExtensions);
    expect(addGroups.length).toBeGreaterThan(addActionGroupExtensions.length);
    addActionsWithoutValidGroupId.forEach((action) => {
      expect(addGroups.find((group) => group.id === action.properties.id)).toBeDefined();
    });
  });
});

describe('resolvedHref', () => {
  const namespace: string = 'ns';

  it('should return null if href or namespace is not defined', () => {
    expect(resolvedHref(null, namespace)).toBeNull();
    expect(resolvedHref('href', null)).toBeNull();
  });

  it('should replace ":namespace" in the href with namespace', () => {
    const {
      properties: { href },
    } = addActionExtensions.find(({ properties: { href: currHref } }) =>
      currHref.match(/:namespace\b/),
    );
    expect(resolvedHref(href, namespace).includes(namespace)).toBe(true);
  });

  it('should return the href unchanged if the href does not have ":namespace"', () => {
    const {
      properties: { href },
    } = addActionExtensions.find(
      ({ properties: { href: currHref } }) => !currHref.match(/:namespace\b/),
    );
    expect(resolvedHref(href, namespace)).toMatch(href);
  });
});

describe('filterNamespaceScopedUrl', () => {
  const namespace: string = 'ns';

  it('should return empty array if namespace or addActions is not defined', () => {
    expect(filterNamespaceScopedUrl(null, addActionExtensions).length).toBe(0);
    expect(filterNamespaceScopedUrl(namespace, null).length).toBe(0);
    expect(filterNamespaceScopedUrl(namespace, []).length).toBe(0);
  });

  it(`should return only those add actions whose href does not have ":namespace" if namespace equals ${ALL_NAMESPACES_KEY}`, () => {
    const addActionsWithoutNamespacedHref: ResolvedExtension<
      AddAction
    >[] = addActionExtensions.filter(({ properties: { href } }) => !href.match(/:namespace\b/));

    const filteredAddActions: ResolvedExtension<AddAction>[] = filterNamespaceScopedUrl(
      ALL_NAMESPACES_KEY,
      addActionExtensions,
    );

    expect(
      filteredAddActions.every((filteredAction) =>
        addActionsWithoutNamespacedHref.find(
          (action) => action.properties.id === filteredAction.properties.id,
        ),
      ),
    ).toBe(true);
  });

  it(`should return the array of add actions unchanged if namespace is not equal to ${ALL_NAMESPACES_KEY}`, () => {
    const filteredAddActions: ResolvedExtension<AddAction>[] = filterNamespaceScopedUrl(
      namespace,
      addActionExtensions,
    );

    expect(
      filteredAddActions.every((filteredAction) =>
        addActionExtensions.find((action) => action.properties.id === filteredAction.properties.id),
      ),
    ).toBe(true);
  });
});
