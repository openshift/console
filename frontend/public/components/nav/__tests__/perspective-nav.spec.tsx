import * as React from 'react';
import { DndProvider } from 'react-dnd';
import { shallow } from 'enzyme';
import { modelFor } from '@console/internal/module/k8s';
import { usePinnedResources } from '@console/shared';
import { useActivePerspective } from '@console/dynamic-plugin-sdk';
import { useExtensions } from '@console/plugin-sdk';
import { mockPerspectiveExtensions } from '@console/dynamic-plugin-sdk/src/perspective/__tests__/perspective.data';
import { NavGroup } from '@patternfly/react-core';
import PerspectiveNav from '../perspective-nav';
import AdminNav from '../admin-nav';
import PinnedResource from '../PinnedResource';

const useActivePerspectiveMock = useActivePerspective as jest.Mock;
const useExtensionsMock = useExtensions as jest.Mock;
const setPinnedResourcesMock = jest.fn();
jest.mock('react', () => ({
  ...require.requireActual('react'),
  useLayoutEffect: require.requireActual('react').useEffect,
}));
const usePinnedResourcesMock = usePinnedResources as jest.Mock;

jest.mock('@console/dynamic-plugin-sdk/src/perspective/useActivePerspective', () => ({
  default: jest.fn(),
}));
jest.mock('@console/shared/src/hooks/usePinnedResources', () => ({
  usePinnedResources: jest.fn(),
}));
jest.mock('@console/plugin-sdk/src/api/useExtensions', () => ({ useExtensions: jest.fn() }));
jest.mock('react-dnd', () => {
  const reactDnd = require.requireActual('react-dnd');
  return {
    ...reactDnd,
    useDrag: jest.fn(() => [{}, {}]),
    useDrop: jest.fn(() => [{}, {}]),
  };
});

describe('Perspective Nav', () => {
  beforeEach(() => {
    useActivePerspectiveMock.mockClear();
  });

  it('should render Admin nav for admin perspective', () => {
    useExtensionsMock.mockReturnValue(mockPerspectiveExtensions);
    useActivePerspectiveMock.mockReturnValue(['admin', () => {}]);
    usePinnedResourcesMock.mockReturnValue([['hgh'], setPinnedResourcesMock, true]);
    const wrapper = shallow(<PerspectiveNav />);
    expect(wrapper.find(AdminNav).exists()).toBe(true);
  });
  it('should render draggable pinned items for dev perspective', () => {
    useActivePerspectiveMock.mockReturnValue(['dev', () => {}]);
    usePinnedResourcesMock.mockReturnValue([
      [
        'core~v1~ConfigMap',
        'build.openshift.io~v1~BuildConfig',
        'apiregistration.k8s.io~v1~APIService',
        'config.openshift.io~v1~Authentication',
      ],
      jest.fn(),
      true,
    ]);
    const wrapper = shallow(<PerspectiveNav />);
    expect(wrapper.find('[data-test-id="dev-perspective-nav"]').exists()).toBeTruthy();
  });

  it('should render non-draggable pinned items for dev perspective if only one pinned resource is available', () => {
    useActivePerspectiveMock.mockReturnValue(['dev', () => {}]);
    usePinnedResourcesMock.mockReturnValue([['core~v1~ConfigMap'], jest.fn(), true]);
    const wrapper = shallow(<PerspectiveNav />);
    expect(
      wrapper
        .find('[data-test-id="dev-perspective-nav"]')
        .childAt(1)
        .shallow()
        .find(DndProvider)
        .childAt(0)
        .shallow()
        .find(NavGroup)
        .shallow()
        .find(PinnedResource)
        .shallow()
        .find('[data-test="pinned-resource-item"]')
        .exists(),
    ).toBeTruthy();
  });

  it('should render draggable pinned items for dev perspective more than one pinned resource is available', () => {
    useActivePerspectiveMock.mockReturnValue(['dev', () => {}]);
    usePinnedResourcesMock.mockReturnValue([
      [
        'core~v1~ConfigMap',
        'build.openshift.io~v1~BuildConfig',
        'apiregistration.k8s.io~v1~APIService',
      ],
      jest.fn(),
      true,
    ]);
    const wrapper = shallow(<PerspectiveNav />);
    expect(
      wrapper
        .find('[data-test-id="dev-perspective-nav"]')
        .childAt(1)
        .shallow()
        .find(DndProvider)
        .childAt(0)
        .shallow()
        .find(NavGroup)
        .shallow()
        .find(PinnedResource)
        .at(0)
        .shallow()
        .find('[data-test="draggable-pinned-resource-item"]')
        .exists(),
    ).toBeTruthy();
  });

  it('should handle resource with invalid model', () => {
    const spyOnUseState = spyOn(React, 'useState');
    useActivePerspectiveMock.mockReturnValue(['dev', () => {}]);
    usePinnedResourcesMock.mockReturnValue([['core~v1~ConfigMap', 'xyz'], jest.fn(), true]);
    spyOnUseState.and.returnValue([
      ['core~v1~ConfigMap', 'xyz'].filter((res) => !!modelFor(res), jest.fn()),
    ]);
    let wrapper = shallow(<PerspectiveNav />);
    expect(
      wrapper
        .find('[data-test-id="dev-perspective-nav"]')
        .childAt(1)
        .shallow()
        .find(DndProvider)
        .childAt(0)
        .shallow()
        .find(NavGroup)
        .shallow()
        .find(PinnedResource)
        .shallow()
        .find('[data-test="pinned-resource-item"]')
        .exists(),
    ).toBeTruthy();

    usePinnedResourcesMock.mockClear();

    usePinnedResourcesMock.mockReturnValue([
      ['core~v1~ConfigMap', 'build.openshift.io~v1~BuildConfig', 'xyz'],
      jest.fn(),
      true,
    ]);
    spyOnUseState.and.returnValue([
      ['core~v1~ConfigMap', 'build.openshift.io~v1~BuildConfig', 'xyz'].filter(
        (res) => !!modelFor(res),
        jest.fn(),
      ),
    ]);
    wrapper = shallow(<PerspectiveNav />);
    expect(
      wrapper
        .find('[data-test-id="dev-perspective-nav"]')
        .childAt(1)
        .shallow()
        .find(DndProvider)
        .childAt(0)
        .shallow()
        .find(NavGroup)
        .shallow()
        .find(PinnedResource)
        .at(0)
        .shallow()
        .find('[data-test="draggable-pinned-resource-item"]')
        .exists(),
    ).toBeTruthy();
  });
});
